#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>
#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, LCQScreenLoadingType) {
    LCQScreenLoadingTypeInitialDisplay = 0,
    LCQScreenLoadingTypeFullDisplay = 1
};

@interface LCQScreenLoadingView : UIView

@property (nonatomic, assign) LCQScreenLoadingType displayType;
@property (nonatomic, assign) BOOL record;
@property (nonatomic, copy, nullable) NSString *screenName;
@property (nonatomic, copy) RCTDirectEventBlock onDisplay;

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END