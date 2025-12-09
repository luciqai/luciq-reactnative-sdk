#import "LCQScreenLoadingView.h"
#import "../LuciqReactBridge.h"

@interface LCQScreenLoadingView ()
@property (nonatomic, assign) BOOL hasReportedDisplay;
@property (nonatomic, strong) NSNumber *startTime;
@end

@implementation LCQScreenLoadingView

- (instancetype)initWithBridge:(RCTBridge *)bridge {
    if (self = [super init]) {
        self.hasReportedDisplay = NO;
        self.startTime = @(CACurrentMediaTime() * 1000);
        self.backgroundColor = [UIColor clearColor];
        self.userInteractionEnabled = NO;
    }
    return self;
}

- (void)drawRect:(CGRect)rect {
    [super drawRect:rect];

    if (!self.hasReportedDisplay && self.record) {
        self.hasReportedDisplay = YES;

        // Use main queue to ensure thread safety
        dispatch_async(dispatch_get_main_queue(), ^{
            [self reportDisplayComplete];
        });
    }
}

- (void)reportDisplayComplete {
    if (self.onDisplay) {
        NSNumber *endTime = @(CACurrentMediaTime() * 1000);
        NSNumber *duration = @([endTime doubleValue] - [self.startTime doubleValue]);

        self.onDisplay(@{
            @"type": @(self.displayType),
            @"screenName": self.screenName ?: @"",
            @"startTime": self.startTime,
            @"endTime": endTime,
            @"duration": duration
        });
    }

    // Report to native SDK
    NSString *spanName = self.displayType == LCQScreenLoadingTypeInitialDisplay
        ? @"ui.load.initial_display"
        : @"ui.load.full_display";

    // Call native SDK method (will be connected in Phase 3)
    // [LCQAPM reportScreenLoadingSpan:spanName duration:duration screenName:self.screenName];
}

@end