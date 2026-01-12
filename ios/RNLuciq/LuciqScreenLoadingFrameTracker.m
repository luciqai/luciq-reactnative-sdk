#import "LuciqScreenLoadingFrameTracker.h"
#import <QuartzCore/CADisplayLink.h>

@interface LuciqScreenLoadingFrameTracker ()
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *spanIdToTimestamp;
@property (nonatomic, strong) NSMutableSet<NSString *> *activeSpanIds;
@property (nonatomic, strong) CADisplayLink *displayLink;
@property (nonatomic, assign) NSInteger maxStorageCapacity;
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
    }
    return self;
}

- (void)initializeFrameTracking {
    if (!self.displayLink) {
        self.displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(frameRendered:)];
        [self.displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    }
}

- (void)frameRendered:(CADisplayLink *)displayLink {
    if (self.activeSpanIds.count > 0) {
        NSTimeInterval timestampMicroseconds = [[NSDate date] timeIntervalSince1970] * 1000000;
        NSNumber *timestamp = @(timestampMicroseconds);

        for (NSString *spanId in self.activeSpanIds) {
            self.spanIdToTimestamp[spanId] = timestamp;
            NSLog(@"[ScreenLoading] Frame rendered for span %@ at %@μs", spanId, timestamp);
        }
        [self.activeSpanIds removeAllObjects];

        // Cleanup if exceeding capacity
        if (self.spanIdToTimestamp.count > self.maxStorageCapacity) {
            [self cleanup];
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
