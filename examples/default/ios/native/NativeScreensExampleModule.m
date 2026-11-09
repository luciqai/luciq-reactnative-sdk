#import <UIKit/UIKit.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

/// A plain native screen inside the React Native example, used to check `trackNativeScreens`:
/// it should be reported under its own name, with its own repro steps, user steps and APM traces.
@interface NativeScreenViewController : UIViewController
@property (nonatomic, strong) UILabel *titleLabel;
@end

@implementation NativeScreenViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = UIColor.systemBackgroundColor;

    self.titleLabel = [UILabel new];
    self.titleLabel.text = @"Native screen";
    self.titleLabel.font = [UIFont systemFontOfSize:22];

    UITextField *field = [UITextField new];
    field.placeholder = @"Native text field";
    field.borderStyle = UITextBorderStyleRoundedRect;

    UIButton *tapMe = [UIButton buttonWithType:UIButtonTypeSystem];
    [tapMe setTitle:@"Native button" forState:UIControlStateNormal];
    [tapMe addTarget:self action:@selector(tapped) forControlEvents:UIControlEventTouchUpInside];

    UIButton *back = [UIButton buttonWithType:UIButtonTypeSystem];
    [back setTitle:@"Back to React Native" forState:UIControlStateNormal];
    [back addTarget:self action:@selector(close) forControlEvents:UIControlEventTouchUpInside];

    UIStackView *stack = [[UIStackView alloc] initWithArrangedSubviews:@[self.titleLabel, field, tapMe, back]];
    stack.axis = UILayoutConstraintAxisVertical;
    stack.spacing = 16;
    stack.translatesAutoresizingMaskIntoConstraints = NO;
    [self.view addSubview:stack];
    [NSLayoutConstraint activateConstraints:@[
        [stack.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:24],
        [stack.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor constant:24],
        [stack.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor constant:-24],
    ]];
}

- (void)tapped {
    self.titleLabel.text = @"Native button tapped";
}

- (void)close {
    [self dismissViewControllerAnimated:YES completion:nil];
}

@end

/// Opens the example's native screen from JS.
@interface NativeScreensExampleModule : NSObject <RCTBridgeModule>
@end

@implementation NativeScreensExampleModule

RCT_EXPORT_MODULE(NativeScreensExampleModule)

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(openNativeScreen) {
    // The app's own window, not the key window: Luciq's floating button lives in a separate window.
    UIViewController *presenter = UIApplication.sharedApplication.delegate.window.rootViewController;
    while (presenter.presentedViewController != nil) {
        presenter = presenter.presentedViewController;
    }
    if (presenter == nil) {
        return;
    }
    NativeScreenViewController *screen = [NativeScreenViewController new];
    screen.modalPresentationStyle = UIModalPresentationFullScreen;
    [presenter presentViewController:screen animated:YES completion:nil];
}

@end
