#import "LCQScreenLoadingViewManager.h"
#import "LCQScreenLoadingView.h"
#import <React/RCTBridge.h>

@implementation LCQScreenLoadingViewManager

RCT_EXPORT_MODULE(LCQScreenLoadingView)

- (UIView *)view {
    return [[LCQScreenLoadingView alloc] initWithBridge:self.bridge];
}

RCT_EXPORT_VIEW_PROPERTY(displayType, LCQScreenLoadingType)
RCT_EXPORT_VIEW_PROPERTY(record, BOOL)
RCT_EXPORT_VIEW_PROPERTY(screenName, NSString)
RCT_EXPORT_VIEW_PROPERTY(onDisplay, RCTDirectEventBlock)

@end