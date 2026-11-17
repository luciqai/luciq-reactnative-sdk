#import <LuciqSDK/LuciqSDK.h>
#import <LuciqSDK/LCQTypes.h>

NS_ASSUME_NONNULL_BEGIN

@interface Luciq (CP)

+ (void)setCurrentPlatform:(LCQPlatform)platform;

/// Available in native iOS SDKs that support hybrid apps; check `respondsToSelector:` before calling.
+ (void)registerCrossPlatformHosts:(NSArray<Class> *)hosts platform:(LCQPlatform)platform;

/// Records a screen React Native reported. In a hybrid app, a screen reported while a native screen is on top is
/// held for the next React Native host instead of renaming that native screen; otherwise it is recorded as
/// `logViewDidAppearEvent:` records it, without the APM UI trace. Available in native iOS SDKs that support hybrid
/// apps; check `respondsToSelector:` before calling.
+ (void)logCrossPlatformViewDidAppearEvent:(NSString *)viewName;

@end

NS_ASSUME_NONNULL_END
