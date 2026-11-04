#import <LuciqSDK/LuciqSDK.h>
#import <LuciqSDK/LCQTypes.h>

NS_ASSUME_NONNULL_BEGIN

@interface Luciq (CP)

+ (void)setCurrentPlatform:(LCQPlatform)platform;

/// Available in native iOS SDKs that support hybrid apps; check `respondsToSelector:` before calling.
+ (void)registerCrossPlatformHosts:(NSArray<Class> *)hosts platform:(LCQPlatform)platform;

@end

NS_ASSUME_NONNULL_END
