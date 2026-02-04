#import "LuciqScreenLoadingFrameTracker.h"
#import <LuciqSDK/LCQAPM.h>
#import "Util/LCQAPM+PrivateAPIs.h"

@interface LuciqScreenLoadingFrameTracker ()
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *spanIdToTimestamp;
@property (nonatomic, strong) NSMutableSet<NSString *> *activeSpanIds;
@property (nonatomic, assign) NSInteger maxStorageCapacity;
@property (nonatomic, assign) BOOL isTracking;
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
        self.maxStorageCapacity = 50;
        self.isTracking = NO;
    }
    return self;
}

- (void)initializeFrameTracking {
    if (self.isTracking) {
        return;
    }

    __weak typeof(self) weakSelf = self;
    [LCQAPM startObservingDisplayLinkWithCallback:^(NSTimeInterval currentTimestamp, NSTimeInterval targetTimestamp) {
        [weakSelf frameRenderedWithTimestamp:currentTimestamp];
    }];
    self.isTracking = YES;
}

- (void)frameRenderedWithTimestamp:(NSTimeInterval)timestamp {
    if (self.activeSpanIds.count > 0) {
        // timestamp is already epoch-based (seconds since 1970) from LCQAPM SDK
        // Convert from seconds to microseconds
        NSTimeInterval epochTimestampMicroseconds = timestamp * 1000000;
        NSNumber *timestampNumber = @(epochTimestampMicroseconds);

        for (NSString *spanId in self.activeSpanIds) {
            self.spanIdToTimestamp[spanId] = timestampNumber;
            NSLog(@"[ScreenLoading] Frame rendered for span %@ at %.0fμs", spanId, epochTimestampMicroseconds);
        }
        [self.activeSpanIds removeAllObjects];

        // Cleanup if exceeding capacity
        if (self.spanIdToTimestamp.count > self.maxStorageCapacity) {
            [self cleanupStorage];
        }
    }
}

- (void)startTrackingForSpanId:(NSString *)spanId {
    [self.activeSpanIds addObject:spanId];
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
        [LCQAPM stopObservingDisplayLink];
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
