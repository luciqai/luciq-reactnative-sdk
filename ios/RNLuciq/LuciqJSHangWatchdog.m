#import "LuciqJSHangWatchdog.h"

#import <QuartzCore/QuartzCore.h>
#import <React/RCTBridge.h>
#import <UIKit/UIKit.h>
#import <sys/sysctl.h>

#import "LuciqJSHangProfiler.h"
#import "Util/LCQCrashReporting+CP.h"
#import "Util/LuciqRNDebugTags.h"
#import "Util/LuciqRNLogger.h"

@interface RCTBridge (LCQJSHangDispatch)
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;
@end

static NSTimeInterval const LCQJSHangPingInterval = 0.5;
static NSTimeInterval const LCQJSHangDefaultThreshold = 3.0;
static NSTimeInterval const LCQJSHangMarkerRefreshInterval = 5.0;
static NSTimeInterval const LCQJSHangMarkerMaximumAge = 24.0 * 60.0 * 60.0;
static NSUInteger const LCQJSHangMarkerSchemaVersion = 1;
static NSUInteger const LCQJSHangMaximumGroupingLength = 256;
static NSString *const LCQJSHangErrorName = @"JSThreadHang";
static NSString *const LCQJSHangFingerprint = @"js_hang";
static NSString *const LCQJSHangMarkerFileName = @"luciq_js_hang_marker.json";
static void *LCQJSHangWatchdogQueueKey = &LCQJSHangWatchdogQueueKey;

@implementation LuciqJSHangWatchdog {
    dispatch_queue_t _watchdogQueue;
    dispatch_queue_t _reportQueue;
    dispatch_source_t _timer;
    __weak RCTBridge *_bridge;

    BOOL _running;
    BOOL _applicationActive;
    BOOL _pongSeen;
    BOOL _probePending;
    NSUInteger _generation;
    CFTimeInterval _lastPongUptime;

    CFTimeInterval _hangStartUptime;
    NSTimeInterval _hangStartEpoch;
    CFTimeInterval _lastMarkerRefreshUptime;
    BOOL _profilerStarted;
    CFTimeInterval _profilerStartUptime;
    NSString *_processSessionIdentifier;
    NSTimeInterval _threshold;
}

+ (instancetype)sharedInstance {
    static LuciqJSHangWatchdog *instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [LuciqJSHangWatchdog new];
    });
    return instance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _watchdogQueue = dispatch_queue_create(
            "ai.luciq.reactlibrary.js-hang-watchdog",
            dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_UTILITY, 0));
        dispatch_queue_set_specific(_watchdogQueue, LCQJSHangWatchdogQueueKey,
                                    LCQJSHangWatchdogQueueKey, NULL);
        _reportQueue = dispatch_queue_create(
            "ai.luciq.reactlibrary.js-hang-reports",
            dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_UTILITY, 0));
        _hangStartUptime = -1;
        _threshold = LCQJSHangDefaultThreshold;
        _processSessionIdentifier = NSUUID.UUID.UUIDString;
    }
    return self;
}

+ (BOOL)supportsClassicBridge:(nullable id)bridge {
    // RCTBridgeProxy has no public, stable JS-queue dispatch contract. A
    // respondsToSelector check alone is not a support guarantee, so bridgeless
    // is deliberately capability-gated off.
    return [bridge isKindOfClass:RCTBridge.class] &&
        [bridge respondsToSelector:@selector(dispatchBlock:queue:)];
}

- (BOOL)readApplicationActiveState {
    __block BOOL active = NO;
    void (^readState)(void) = ^{
        active = UIApplication.sharedApplication.applicationState == UIApplicationStateActive;
    };
    if (NSThread.isMainThread) {
        readState();
    } else {
        dispatch_sync(dispatch_get_main_queue(), readState);
    }
    return active;
}

- (void)startWithBridge:(RCTBridge *)bridge {
#if RCT_DEV
    [LuciqRNLogger d:[LuciqRNDebugTags jsHang] format:@"[start] skipped: dev build"];
    return;
#endif
    if ([LuciqJSHangWatchdog isDebuggerAttached]) {
        [LuciqRNLogger d:[LuciqRNDebugTags jsHang] format:@"[start] skipped: debugger attached"];
        return;
    }
    BOOL applicationActive = [self readApplicationActiveState];
    BOOL classicBridgeSupported = [LuciqJSHangWatchdog supportsClassicBridge:bridge];
    // Captured on the caller thread. The basename, not the full container
    // path: per-install UUID paths defeat backend bundle recognition, and the
    // symbolication lookup only needs line/column.
    NSString *bundleName = ([bridge isKindOfClass:RCTBridge.class]
        ? ((RCTBridge *)bridge).bundleURL.lastPathComponent : nil) ?: @"main.jsbundle";
    dispatch_async(_watchdogQueue, ^{
        [self reportPreviousProcessHangIfFoundWithBundleName:bundleName];
        [self resetForNewGenerationWithBridge:classicBridgeSupported ? bridge : nil
                            applicationActive:applicationActive];
        if (!classicBridgeSupported) {
            // No detection is possible: also drop the timer a prior classic
            // bridge may have left running so backgrounded wakeups stop.
            [self cancelTimerLocked];
            [LuciqRNLogger d:[LuciqRNDebugTags jsHang]
                      format:@"[start] unavailable: no verified classic JS dispatch contract"];
            return;
        }
        // The timer only exists while the app is active so the watchdog causes
        // zero wakeups in the background (required by the performance budget).
        if (self->_applicationActive) {
            [self startTimerLocked];
        }
        [self observeAppState];
    });
}

/** Must be called on the watchdog queue. */
- (void)startTimerLocked {
    if (_timer != nil) {
        return;
    }
    _timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, _watchdogQueue);
    dispatch_source_set_timer(
        _timer, DISPATCH_TIME_NOW,
        (uint64_t)(LCQJSHangPingInterval * NSEC_PER_SEC),
        (uint64_t)(0.1 * NSEC_PER_SEC));
    __weak typeof(self) weakSelf = self;
    dispatch_source_set_event_handler(_timer, ^{
        [weakSelf tick];
    });
    dispatch_resume(_timer);
}

/** Must be called on the watchdog queue. */
- (void)cancelTimerLocked {
    if (_timer != nil) {
        dispatch_source_cancel(_timer);
        _timer = nil;
    }
}

- (void)resetForNewGenerationWithBridge:(RCTBridge *)bridge
                       applicationActive:(BOOL)applicationActive {
    ++_generation;
    [LuciqJSHangProfiler abortAndStop];
    [LuciqJSHangWatchdog clearMarker];
    _running = bridge != nil;
    _bridge = bridge;
    _applicationActive = applicationActive;
    _probePending = NO;
    _pongSeen = NO;
    _lastPongUptime = CACurrentMediaTime();
    _hangStartUptime = -1;
    _profilerStarted = NO;
}

- (void)stop {
    dispatch_block_t cleanup = ^{
        ++self->_generation;
        self->_running = NO;
        self->_applicationActive = NO;
        self->_probePending = NO;
        self->_pongSeen = NO;
        self->_hangStartUptime = -1;
        self->_bridge = nil;
        self->_profilerStarted = NO;
        if (self->_timer != nil) {
            dispatch_source_cancel(self->_timer);
            self->_timer = nil;
        }
        [[NSNotificationCenter defaultCenter] removeObserver:self];
        [LuciqJSHangProfiler abortAndStop];
        [LuciqJSHangWatchdog clearMarker];
    };
    if (dispatch_get_specific(LCQJSHangWatchdogQueueKey) != NULL) {
        cleanup();
    } else {
        dispatch_sync(_watchdogQueue, cleanup);
    }
}

#pragma mark - Detection

- (void)tick {
    @try {
        if (!_running || !_applicationActive) {
            return;
        }
        if (_pongSeen) {
            [self checkForHang];
        }
        [self postProbeIfNeeded];
    } @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags jsHang] format:@"[tick] failed: %@", exception.name];
    }
}

- (void)postProbeIfNeeded {
    if (_probePending) {
        return;
    }
    RCTBridge *bridge = _bridge;
    if (bridge == nil || ![bridge isKindOfClass:RCTBridge.class] ||
        ![bridge respondsToSelector:@selector(dispatchBlock:queue:)]) {
        return;
    }
    // One probe outstanding at a time; the generation token rejects pongs
    // from a previous lifecycle epoch, so no per-probe sequence is needed.
    NSUInteger generation = _generation;
    _probePending = YES;
    __weak typeof(self) weakSelf = self;
    @try {
        [bridge dispatchBlock:^{
            CFTimeInterval pongUptime = CACurrentMediaTime();
            typeof(self) strongSelf = weakSelf;
            if (strongSelf == nil) {
                return;
            }
            dispatch_async(strongSelf->_watchdogQueue, ^{
                if (!strongSelf->_running || !strongSelf->_applicationActive ||
                    generation != strongSelf->_generation ||
                    !strongSelf->_probePending) {
                    return;
                }
                strongSelf->_probePending = NO;
                strongSelf->_lastPongUptime = pongUptime;
                strongSelf->_pongSeen = YES;
            });
        } queue:RCTJSThread];
    } @catch (NSException *exception) {
        _probePending = NO;
        [LuciqRNLogger e:[LuciqRNDebugTags jsHang]
                  format:@"[probe] dispatch failed: %@", exception.name];
    }
}

- (void)checkForHang {
    CFTimeInterval now = CACurrentMediaTime();
    CFTimeInterval gap = MAX(0, now - _lastPongUptime);
    if (_hangStartUptime < 0 && gap >= _threshold) {
        _hangStartUptime = _lastPongUptime;
        _hangStartEpoch = NSDate.date.timeIntervalSince1970 - gap;
        _lastMarkerRefreshUptime = now;
        [LuciqJSHangWatchdog persistMarkerWithHangStart:_hangStartEpoch
                                           observedGap:gap
                                      sessionIdentifier:_processSessionIdentifier];
        _profilerStarted = [LuciqJSHangProfiler
            startWithHangStartEpochMs:(long long)(_hangStartEpoch * 1000.0)];
        _profilerStartUptime = now;
        return;
    }
    if (_hangStartUptime < 0) {
        return;
    }
    if (gap < _threshold) {
        CFTimeInterval hangStartUptime = _hangStartUptime;
        CFTimeInterval recoveryUptime = _lastPongUptime;
        NSTimeInterval hangStartEpoch = _hangStartEpoch;
        BOOL profilerStarted = _profilerStarted;
        // Samples taken after the recovery pong must never be attributed as
        // the hang's culprit stack.
        NSTimeInterval sampleWindow = profilerStarted
            ? MAX(0, recoveryUptime - _profilerStartUptime) : 0;
        long long durationMs =
            MAX(0LL, (long long)((recoveryUptime - hangStartUptime) * 1000.0));
        _hangStartUptime = -1;
        _profilerStarted = NO;
        [LuciqJSHangWatchdog clearMarker];
        [self enqueueRecoveredHangWithDurationMs:durationMs
                                  hangStartEpoch:hangStartEpoch
                             sampleWindowSeconds:sampleWindow
                                 profilerStarted:profilerStarted];
    } else if (now - _lastMarkerRefreshUptime >= LCQJSHangMarkerRefreshInterval) {
        _lastMarkerRefreshUptime = now;
        [LuciqJSHangWatchdog persistMarkerWithHangStart:_hangStartEpoch
                                           observedGap:gap
                                      sessionIdentifier:_processSessionIdentifier];
    }
}

#pragma mark - App state

- (void)observeAppState {
    NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
    [center removeObserver:self];
    [center addObserver:self selector:@selector(handleApplicationInactive:)
                   name:UIApplicationWillResignActiveNotification object:nil];
    [center addObserver:self selector:@selector(handleApplicationInactive:)
                   name:UIApplicationDidEnterBackgroundNotification object:nil];
    [center addObserver:self selector:@selector(handleApplicationActive:)
                   name:UIApplicationDidBecomeActiveNotification object:nil];
}

- (void)handleApplicationInactive:(NSNotification *)notification {
    (void)notification;
    dispatch_async(_watchdogQueue, ^{
        if (!self->_running) {
            return;
        }
        ++self->_generation;
        self->_applicationActive = NO;
        self->_probePending = NO;
        self->_pongSeen = NO;
        self->_hangStartUptime = -1;
        self->_profilerStarted = NO;
        [self cancelTimerLocked];
        [LuciqJSHangProfiler abortAndStop];
        [LuciqJSHangWatchdog clearMarker];
    });
}

- (void)handleApplicationActive:(NSNotification *)notification {
    (void)notification;
    dispatch_async(_watchdogQueue, ^{
        if (!self->_running) {
            return;
        }
        ++self->_generation;
        self->_applicationActive = YES;
        self->_probePending = NO;
        self->_pongSeen = NO;
        self->_lastPongUptime = CACurrentMediaTime();
        self->_hangStartUptime = -1;
        [self startTimerLocked];
        // No detection is allowed until a fresh generation-matched pong arrives.
        [self postProbeIfNeeded];
    });
}

#pragma mark - Reporting

- (void)enqueueRecoveredHangWithDurationMs:(long long)durationMs
                             hangStartEpoch:(NSTimeInterval)hangStartEpoch
                        sampleWindowSeconds:(NSTimeInterval)sampleWindowSeconds
                            profilerStarted:(BOOL)profilerStarted {
    // Basename, not the full container path: per-install UUID paths defeat
    // backend bundle recognition.
    NSString *bundleName = _bridge.bundleURL.lastPathComponent ?: @"main.jsbundle";
    long long thresholdMs = (long long)(_threshold * 1000.0);
    [self enqueueReportBlock:^{
        NSArray<NSDictionary *> *frames = @[];
        NSString *captureMode = [LuciqJSHangProfiler capabilityStatus];
        if (profilerStarted) {
            NSString *path = [LuciqJSHangProfiler
                dumpAndStopWithHangStartEpochMs:(long long)(hangStartEpoch * 1000.0)];
            if (path != nil) {
                frames = [LuciqJSHangProfiler culpritFramesFromTraceAtPath:path
                                                                bundleName:bundleName
                                               sampleWindowSeconds:sampleWindowSeconds] ?: @[];
                captureMode = frames.count > 0 ? @"hermes_sampling" : @"capture_failed";
            } else {
                captureMode = @"capture_failed";
            }
        }
        NSString *message = [NSString stringWithFormat:
            @"JS thread event loop was unresponsive for approximately %lld ms", durationMs];
        [self reportHangWithMessage:message
                         durationMs:durationMs
                        thresholdMs:thresholdMs
                             frames:frames
                   stackCaptureMode:captureMode
              previousProcessEnded:NO];
    }];
}

// Hangs arrive at most once per threshold interval; a plain serial queue is
// enough. The queue exists so dump + parse work stays off the watchdog queue.
- (void)enqueueReportBlock:(dispatch_block_t)block {
    dispatch_async(_reportQueue, ^{
        @autoreleasepool {
            block();
        }
    });
}

- (NSString *)boundedString:(NSString *)value limit:(NSUInteger)limit {
    if (value.length <= limit) {
        return value;
    }
    return [value substringToIndex:limit];
}

// Temporary non-fatal transport isolated in one method: once core ships the
// hang SPI specified in docs/js-hang-app-hang-spi.md, only this changes.
- (void)reportHangWithMessage:(NSString *)message
                   durationMs:(long long)durationMs
                  thresholdMs:(long long)thresholdMs
                       frames:(NSArray<NSDictionary *> *)frames
             stackCaptureMode:(NSString *)stackCaptureMode
        previousProcessEnded:(BOOL)previousProcessEnded {
    if (!LCQCrashReporting.enabled) {
        return;
    }
    NSString *grouping = LCQJSHangFingerprint;
    NSDictionary *topFrame = frames.firstObject;
    if ([topFrame isKindOfClass:NSDictionary.class]) {
        NSString *file = [topFrame[@"file"] isKindOfClass:NSString.class]
            ? [topFrame[@"file"] lastPathComponent] : @"unknown";
        NSString *method = [topFrame[@"methodName"] isKindOfClass:NSString.class]
            ? topFrame[@"methodName"] : @"anonymous";
        grouping = [NSString stringWithFormat:@"%@/%@:%@:%@:%@", LCQJSHangFingerprint,
            file, method, topFrame[@"lineNumber"] ?: @0, topFrame[@"column"] ?: @0];
    }
    grouping = [self boundedString:grouping limit:LCQJSHangMaximumGroupingLength];
    NSDictionary *stackTrace = @{
        @"message" : [NSString stringWithFormat:@"%@ - %@", LCQJSHangErrorName, message],
        @"e_message" : message,
        @"e_name" : LCQJSHangErrorName,
        @"os" : @"ios",
        @"platform" : @"react_native",
        @"exception" : frames,
        @"stackCaptureMode" : stackCaptureMode,
    };
    NSDictionary<NSString *, NSString *> *attributes = @{
        @"hang_duration_ms" : [NSString stringWithFormat:@"%lld", durationMs],
        @"hang_threshold_ms" : [NSString stringWithFormat:@"%lld", thresholdMs],
        @"detection" : @"native_watchdog",
        @"stack_capture_mode" : stackCaptureMode,
        @"previous_process_ended_during_hang" : previousProcessEnded ? @"true" : @"false",
    };
    [LCQCrashReporting cp_reportNonFatalCrashWithStackTrace:stackTrace
                                                      level:LCQNonFatalLevelError
                                             groupingString:grouping
                                             userAttributes:attributes];
}

- (void)reportPreviousProcessHangIfFoundWithBundleName:(NSString *)bundleName {
    NSDictionary *marker = [LuciqJSHangWatchdog consumeMarker];
    if (marker == nil ||
        [marker[@"session_id"] isEqualToString:_processSessionIdentifier]) {
        return;
    }
    long long gapMs = [marker[@"last_observed_gap_ms"] longLongValue];
    long long startTimestampMs = [marker[@"hang_start_epoch_ms"] longLongValue];
    long long thresholdMs = (long long)(_threshold * 1000.0);
    [self enqueueReportBlock:^{
        // The previous process may have dumped its trace mid-hang before it
        // ended; every sample in it is mid-hang, so no window filter applies.
        NSArray<NSDictionary *> *frames = @[];
        NSString *captureMode = @"previous_process_no_stack";
        NSString *tracePath = [LuciqJSHangProfiler leftoverTracePathForEpochMs:startTimestampMs];
        if (tracePath != nil) {
            frames = [LuciqJSHangProfiler culpritFramesFromTraceAtPath:tracePath
                                                            bundleName:bundleName
                                                   sampleWindowSeconds:0] ?: @[];
            if (frames.count > 0) {
                captureMode = @"hermes_sampling_previous_process";
            }
        }
        [LuciqJSHangProfiler deleteProfileIntermediates];
        NSString *message = [NSString stringWithFormat:
            @"The previous process ended while its JS thread had been unresponsive for at least %lld ms",
            gapMs];
        [self reportHangWithMessage:message
                         durationMs:gapMs
                        thresholdMs:thresholdMs
                             frames:frames
                   stackCaptureMode:captureMode
              previousProcessEnded:YES];
    }];
}

#pragma mark - Marker persistence

+ (NSString *)markerPath {
    NSString *directory = NSSearchPathForDirectoriesInDomains(
        NSApplicationSupportDirectory, NSUserDomainMask, YES).firstObject;
    NSString *luciqDirectory = [directory stringByAppendingPathComponent:@"luciq"];
    [NSFileManager.defaultManager createDirectoryAtPath:luciqDirectory
                            withIntermediateDirectories:YES attributes:nil error:nil];
    return [luciqDirectory stringByAppendingPathComponent:LCQJSHangMarkerFileName];
}

+ (void)persistMarkerWithHangStart:(NSTimeInterval)hangStartEpoch
                       observedGap:(NSTimeInterval)gap
                  sessionIdentifier:(NSString *)sessionIdentifier {
    NSTimeInterval now = NSDate.date.timeIntervalSince1970;
    NSDictionary *marker = @{
        @"schema_version" : @(LCQJSHangMarkerSchemaVersion),
        @"session_id" : sessionIdentifier,
        @"hang_start_epoch_ms" : @((long long)(hangStartEpoch * 1000.0)),
        @"last_observed_gap_ms" : @((long long)(MAX(0, gap) * 1000.0)),
        @"updated_epoch_ms" : @((long long)(now * 1000.0)),
    };
    NSData *data = [NSJSONSerialization dataWithJSONObject:marker options:0 error:nil];
    if (data != nil) {
        [data writeToFile:[self markerPath] atomically:YES];
    }
}

+ (nullable NSDictionary *)consumeMarker {
    NSString *path = [self markerPath];
    NSData *data = [NSData dataWithContentsOfFile:path];
    // Consumption is exactly once within the marker protocol: remove before
    // validation or reporting so reloads cannot consume the same marker twice.
    [NSFileManager.defaultManager removeItemAtPath:path error:nil];
    if (data == nil) {
        return nil;
    }
    id value = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    if (![value isKindOfClass:NSDictionary.class]) {
        return nil;
    }
    // Torn writes (the marker exists to survive unclean process death) and
    // cross-reboot clock skew are the realistic corruption cases: schema,
    // type safety, staleness, and future skew cover them.
    NSDictionary *marker = value;
    NSNumber *schema = marker[@"schema_version"];
    NSString *session = marker[@"session_id"];
    NSNumber *gap = marker[@"last_observed_gap_ms"];
    NSNumber *updated = marker[@"updated_epoch_ms"];
    NSNumber *started = marker[@"hang_start_epoch_ms"];
    if (![schema isKindOfClass:NSNumber.class] ||
        schema.unsignedIntegerValue != LCQJSHangMarkerSchemaVersion ||
        ![session isKindOfClass:NSString.class] || session.length == 0 ||
        ![gap isKindOfClass:NSNumber.class] || gap.longLongValue <= 0 ||
        ![updated isKindOfClass:NSNumber.class] || ![started isKindOfClass:NSNumber.class] ||
        started.longLongValue <= 0) {
        return nil;
    }
    long long nowMs = (long long)(NSDate.date.timeIntervalSince1970 * 1000.0);
    long long ageMs = nowMs - updated.longLongValue;
    if (ageMs < 0 || ageMs > (long long)(LCQJSHangMarkerMaximumAge * 1000.0)) {
        return nil;
    }
    return marker;
}

+ (void)clearMarker {
    [NSFileManager.defaultManager removeItemAtPath:[self markerPath] error:nil];
}

#pragma mark - Guards

+ (BOOL)isDebuggerAttached {
    struct kinfo_proc info;
    size_t size = sizeof(info);
    int name[4] = {CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()};
    if (sysctl(name, 4, &info, &size, NULL, 0) != 0) {
        return NO;
    }
    return (info.kp_proc.p_flag & P_TRACED) != 0;
}

@end
