#import "LuciqScreenLoadingFrameTracker.h"
#import <QuartzCore/CADisplayLink.h>

@interface LuciqScreenLoadingFrameTracker ()
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *spanIdToTimestamp;
@property (nonatomic, strong) NSMutableSet<NSString *> *activeSpanIds;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *spanIdToTrackingStart;
@property (nonatomic, assign) NSInteger maxStorageCapacity;
@property (nonatomic, assign) BOOL isTracking;
@property (nonatomic, strong) CADisplayLink *displayLink;
@end

@implementation LuciqScreenLoadingFrameTracker

+ (instancetype)sharedInstance {
    static LuciqScreenLoadingFrameTracker *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc] init];
    });
    return instance;
}

- (instancetype)init {
    if (self = [super init]) {
        self.spanIdToTimestamp = [NSMutableDictionary dictionary];
        self.activeSpanIds = [NSMutableSet set];
        self.spanIdToTrackingStart = [NSMutableDictionary dictionary];
        self.maxStorageCapacity = 50;
        self.isTracking = NO;
    }
    return self;
}

- (void)initializeFrameTracking {
    if (self.isTracking) {
        return;
    }

    self.displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(handleDisplayLink:)];
    [self.displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    self.isTracking = YES;
}

- (void)handleDisplayLink:(CADisplayLink *)displayLink {
    [self frameRenderedWithTimestamp:displayLink.timestamp];
}

- (void)frameRenderedWithTimestamp:(NSTimeInterval)timestamp {
    if (self.activeSpanIds.count > 0) {
        // timestamp is monotonic (seconds since boot, from CADisplayLink / mach_absolute_time)
        // Convert to epoch microseconds using the same approach as Android:
        // figure out how long ago the frame was rendered, then subtract from current epoch
        NSTimeInterval currentUptime = [[NSProcessInfo processInfo] systemUptime];
        NSTimeInterval currentEpoch = [[NSDate date] timeIntervalSince1970];
        NSTimeInterval timeSinceFrame = currentUptime - timestamp;
        NSTimeInterval frameEpochSeconds = currentEpoch - timeSinceFrame;
        NSTimeInterval epochTimestampMicroseconds = frameEpochSeconds * 1000000;
        NSNumber *timestampNumber = @(epochTimestampMicroseconds);

        NSMutableSet<NSString *> *resolvedSpanIds = [NSMutableSet set];
        for (NSString *spanId in self.activeSpanIds) {
            NSNumber *trackingStart = self.spanIdToTrackingStart[spanId];
            if (trackingStart && timestamp < trackingStart.doubleValue) {
                NSLog(@"[ScreenLoading] Skipping frame for span %@ (VSync %.6fs < tracking start %.6fs)", spanId, timestamp, trackingStart.doubleValue);
                continue;
            }
            self.spanIdToTimestamp[spanId] = timestampNumber;
            [resolvedSpanIds addObject:spanId];
            [self.spanIdToTrackingStart removeObjectForKey:spanId];
            NSLog(@"[ScreenLoading] Frame rendered for span %@ at %.0fμs", spanId, epochTimestampMicroseconds);
        }
        [self.activeSpanIds minusSet:resolvedSpanIds];

        // Cleanup if exceeding capacity
        if (self.spanIdToTimestamp.count > self.maxStorageCapacity) {
            [self cleanupStorage];
        }
    }
}

- (void)startTrackingForSpanId:(NSString *)spanId {
    [self.activeSpanIds addObject:spanId];
    self.spanIdToTrackingStart[spanId] = @([[NSProcessInfo processInfo] systemUptime]);
    NSLog(@"[ScreenLoading] Started tracking for span %@", spanId);
}

- (NSNumber *)getFrameTimestampForSpanId:(NSString *)spanId {
    NSNumber *timestamp = self.spanIdToTimestamp[spanId];
    if (timestamp) {
        [self.spanIdToTimestamp removeObjectForKey:spanId];
        NSLog(@"[ScreenLoading] Retrieved timestamp %@μs for span %@", timestamp, spanId);
    }
    return timestamp;
}

- (void)cleanup {
    if (self.isTracking) {
        [self.displayLink invalidate];
        self.displayLink = nil;
        self.isTracking = NO;
    }
    [self.spanIdToTimestamp removeAllObjects];
    [self.activeSpanIds removeAllObjects];
}

- (void)cleanupStorage {
    NSArray *sortedKeys = [self.spanIdToTimestamp keysSortedByValueUsingComparator:^NSComparisonResult(NSNumber *obj1, NSNumber *obj2) {
        return [obj1 compare:obj2];
    }];

    NSInteger itemsToRemove = self.spanIdToTimestamp.count - 30;
    if (itemsToRemove > 0) {
        for (NSInteger i = 0; i < itemsToRemove; i++) {
            [self.spanIdToTimestamp removeObjectForKey:sortedKeys[i]];
        }
    }
}

@end

