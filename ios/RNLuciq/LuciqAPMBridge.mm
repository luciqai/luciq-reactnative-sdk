

#import "LuciqAPMBridge.h"
#import <LuciqSDK/LCQAPM.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>
#import "Util/LCQAPM+PrivateAPIs.h"
#import "LuciqScreenLoadingFrameTracker.h"
#import "Util/LuciqRNDebugTags.h"
#import "Util/LuciqRNLogger.h"

@implementation LuciqAPMBridge

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[];
}

RCT_EXPORT_MODULE(LCQAPM)

- (id) init
{
    self = [super init];
    return self;
}

// Pauses the current thread for 3 seconds.
RCT_EXPORT_METHOD(LCQSleep) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmCustomSpan] format:@"[LCQSleep] called"];
    [NSThread sleepForTimeInterval:3.0f];
}

// Enables or disables APM.
RCT_EXPORT_METHOD(setEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags apm] format:@"[setEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQAPM.enabled = isEnabled;
}

// Determines either coldAppLaunch is enabled or not.
RCT_EXPORT_METHOD(setAppLaunchEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmAppLaunch] format:@"[setAppLaunchEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQAPM.coldAppLaunchEnabled = isEnabled;
}

// This method is used to signal the end of the app launch process.
RCT_EXPORT_METHOD(endAppLaunch) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmAppLaunch] format:@"[endAppLaunch] called"];
    [LCQAPM endAppLaunch];
}

// Controls whether automatic tracing of UI interactions is enabled or disabled within the SDK.
RCT_EXPORT_METHOD(setAutoUITraceEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmUITrace] format:@"[setAutoUITraceEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQAPM.autoUITraceEnabled = isEnabled;
}

// Starts a flow trace with the specified `name`,
// allowing the SDK to capture and analyze the flow of execution within the application.
RCT_EXPORT_METHOD(startFlow: (NSString *)name) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmFlow] format:@"[startFlow] called name=%@", name];
    [LCQAPM startFlowWithName:name];
}

// Ends a flow with the specified `name`.
RCT_EXPORT_METHOD(endFlow: (NSString *)name) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmFlow] format:@"[endFlow] called name=%@", name];
    [LCQAPM endFlowWithName:name];
}


// Sets a user defined attribute for the currently active flow.
RCT_EXPORT_METHOD(setFlowAttribute:(NSString *)name :(NSString *)key :(NSString *_Nullable)value) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmFlow] format:@"[setFlowAttribute] called name=%@, key=%@, valuePresent=%@, valueLength=%lu", name, key, (value.length > 0 ? @"YES" : @"NO"), (unsigned long)value.length];
    [LCQAPM setAttributeForFlowWithName:name key:key value:value];
}

// Starts a new `UITrace` with the provided `name` parameter,
// allowing the SDK to capture and analyze the UI components within the application.
RCT_EXPORT_METHOD(startUITrace:(NSString *)name) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmUITrace] format:@"[startUITrace] called name=%@", name];
    [LCQAPM startUITraceWithName:name];
}

// Terminates the currently active UI trace.
RCT_EXPORT_METHOD(endUITrace) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmUITrace] format:@"[endUITrace] called"];
    [LCQAPM endUITrace];
}

// Enables or disables screen render.
RCT_EXPORT_METHOD(setScreenRenderingEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenRendering] format:@"[setScreenRenderingEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQAPM.screenRenderingEnabled = isEnabled;
}

// Syncs a custom span to the native SDK (currently logs only)
RCT_EXPORT_METHOD(syncCustomSpan:(NSString *)name
                  startTimestamp:(double)startTimestamp
                  endTimestamp:(double)endTimestamp
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [LuciqRNLogger d:[LuciqRNDebugTags apmCustomSpan] format:@"[syncCustomSpan] called name=%@, startTimestamp=%f, endTimestamp=%f", name, startTimestamp, endTimestamp];
    @try {
        // Convert microseconds → seconds (NSDate uses seconds)
        NSTimeInterval startSeconds = startTimestamp / 1e6;
        NSTimeInterval endSeconds   = endTimestamp / 1e6;

        NSDate *startDate = [NSDate dateWithTimeIntervalSince1970:startSeconds];
        NSDate *endDate   = [NSDate dateWithTimeIntervalSince1970:endSeconds];

        // Add completed span to APM
        [LCQAPM addCompletedCustomSpanWithName:name
                                     startDate:startDate
                                       endDate:endDate];

        [LuciqRNLogger d:[LuciqRNDebugTags apmCustomSpan] format:@"[syncCustomSpan] success result=%@", @YES];
        resolve(@YES);
    }
    @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags apmCustomSpan] format:@"[syncCustomSpan] failed: %@", exception];
        reject(
            @"SYNC_CUSTOM_SPAN_ERROR",
            exception.reason ?: @"Failed to sync custom span",
            nil
        );
    }
}

// Checks if custom spans feature is enabled
RCT_EXPORT_METHOD(isCustomSpanEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags apmCustomSpan] format:@"[isCustomSpanEnabled] called"];
    @try {
        BOOL enabled = LCQAPM.customSpansEnabled;
        [LuciqRNLogger d:[LuciqRNDebugTags apmCustomSpan] format:@"[isCustomSpanEnabled] success result=%@", (enabled ? @"YES" : @"NO")];
        resolve(@(enabled));
    } @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags apmCustomSpan] format:@"[isCustomSpanEnabled] failed: %@", exception];
        resolve(@NO);
    }
}

// Checks if APM is enabled
RCT_EXPORT_METHOD(isAPMEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags apm] format:@"[isAPMEnabled] called"];
    @try {
        BOOL enabled = LCQAPM.enabled;
        [LuciqRNLogger d:[LuciqRNDebugTags apm] format:@"[isAPMEnabled] success result=%@", (enabled ? @"YES" : @"NO")];
        resolve(@(enabled));
    } @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags apm] format:@"[isAPMEnabled] failed: %@", exception];
        resolve(@NO);
    }
}

// Screen Loading methods
RCT_EXPORT_METHOD(initScreenFrameTracking:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[initScreenFrameTracking] called"];
    dispatch_async(dispatch_get_main_queue(), ^{
        [[LuciqScreenLoadingFrameTracker sharedInstance] initializeFrameTracking];
        [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[initScreenFrameTracking] success result=%@", @"nil"];
        resolve(nil);
    });
}

RCT_EXPORT_METHOD(setActiveScreenSpanId:(NSString *)spanId)
{
    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[setActiveScreenSpanId] called spanIdPresent=%@, spanIdLength=%lu", (spanId.length > 0 ? @"YES" : @"NO"), (unsigned long)spanId.length];
    dispatch_async(dispatch_get_main_queue(), ^{
        [[LuciqScreenLoadingFrameTracker sharedInstance] startTrackingForSpanId:spanId];
    });
}

RCT_EXPORT_METHOD(getScreenTimeToDisplay:(NSString *)spanId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[getScreenTimeToDisplay] called spanIdPresent=%@, spanIdLength=%lu", (spanId.length > 0 ? @"YES" : @"NO"), (unsigned long)spanId.length];
    dispatch_async(dispatch_get_main_queue(), ^{
        NSNumber *timestamp = [[LuciqScreenLoadingFrameTracker sharedInstance] getFrameTimestampForSpanId:spanId];
        [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[getScreenTimeToDisplay] success result=%@", timestamp];
        resolve(timestamp);
    });
}

RCT_EXPORT_METHOD(isScreenLoadingEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject){

    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[isScreenLoadingEnabled] called"];
    BOOL isScreenLoadingEnabled = LCQAPM.screenLoadingEnabled;
    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[isScreenLoadingEnabled] success result=%@", (isScreenLoadingEnabled ? @"YES" : @"NO")];
    resolve(@(isScreenLoadingEnabled));
}

RCT_EXPORT_METHOD(isEndScreenLoadingEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject){

    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[isEndScreenLoadingEnabled] called"];
    BOOL isEndScreenLoadingEnabled = LCQAPM.endScreenLoadingEnabled;
    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[isEndScreenLoadingEnabled] success result=%@", (isEndScreenLoadingEnabled ? @"YES" : @"NO")];
    resolve(@(isEndScreenLoadingEnabled));
}

// uiTraceId is unused on iOS but required to keep the React Native Bridge call
// signature consistent with Android, which uses it.
RCT_EXPORT_METHOD(endScreenLoading:(double)timeStampMicro
                  uiTraceId:(double)uiTraceId){
    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[endScreenLoading] called timeStampMicro=%f, uiTraceId=%f", timeStampMicro, uiTraceId];
    [LCQAPM endScreenLoadingCPWithEndTimestampMUS:timeStampMicro];
}

RCT_EXPORT_METHOD(setScreenLoadingEnabled:(BOOL)isEnabled){
    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[setScreenLoadingEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQAPM.screenLoadingEnabled = isEnabled;
}

- (NSMutableDictionary<NSString *, NSNumber *> *)buildStagesMapFromAttributes:(NSDictionary *)stages {
    NSMutableDictionary<NSString *, NSNumber *> *stagesMap = [NSMutableDictionary dictionary];
    NSArray<NSString *> *keys = @[@"cnst_mus_st" , @"cnst_mus",@"rnd_mus_st", @"rnd_mus", @"mnt_mus_st" ,@"mnt_mus", @"lyt_mus_st" , @"lyt_mus"];
    for (NSString *key in keys) {
        if (stages[key])
            stagesMap[key] = @([stages[key] longLongValue]);
    }
    return stagesMap;
}

// Syncs screen loading data to native layer for reporting
RCT_EXPORT_METHOD(syncScreenLoading:(double)spanId
                  screenName:(NSString *)screenName
                  startTimestamp:(double)startTimestamp
                  ttid_us:(double)ttid_us
                  attributes:(NSDictionary *)stages){

    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[syncScreenLoading] called spanId=%f, screenNamePresent=%@, screenNameLength=%lu, startTimestamp=%f, ttid_us=%f, stagesCount=%lu", spanId, (screenName.length > 0 ? @"YES" : @"NO"), (unsigned long)screenName.length, startTimestamp, ttid_us, (unsigned long)stages.count];
    NSMutableDictionary<NSString *, NSNumber *> *stagesMap = [self buildStagesMapFromAttributes:stages];
    [LCQAPM reportScreenLoadingCPWithStartTimestampMUS:startTimestamp durationMUS:ttid_us stages:stagesMap];
}

// Syncs manual screen loading measurements to native layer for reporting (no span ID)
RCT_EXPORT_METHOD(syncManualScreenLoading:(NSString *)screenName
                  startTimestamp:(double)startTimestamp
                  ttid_mus:(double)ttid_mus
                  attributes:(NSDictionary *)stages){

    [LuciqRNLogger d:[LuciqRNDebugTags apmScreenLoading] format:@"[syncManualScreenLoading] called screenNamePresent=%@, screenNameLength=%lu, startTimestamp=%f, ttid_mus=%f, stagesCount=%lu", (screenName.length > 0 ? @"YES" : @"NO"), (unsigned long)screenName.length, startTimestamp, ttid_mus, (unsigned long)stages.count];
    NSMutableDictionary<NSString *, NSNumber *> *stagesMap = [self buildStagesMapFromAttributes:stages];
    [LCQAPM reportScreenLoadingCPUITraceWithName:screenName screenLoadingStartMUS:startTimestamp screenLoadingDurationMUS:ttid_mus stages:stagesMap];
}

@synthesize description;

@synthesize hash;

@synthesize superclass;

@end

