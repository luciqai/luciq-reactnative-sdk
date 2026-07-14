//
//  LuciqRNLogger.h
//  RNLuciq
//
//  Bridge-side logger that gates NSLog output on the same debugLogsLevel
//  the host app passes to Luciq.init(), so the native RN bridge diagnostic
//  logs do not leak in production builds when the JS-side Logger is silent.
//
//  Mirrors the level hierarchy in src/utils/logger.ts:
//    Verbose > Debug > Error > None
//
//  Note: LCQSDKDebugLogsLevel uses smaller-is-more-verbose ordering
//  (Verbose=1, Debug=2, Error=3, None=4), which is inverted vs Android.
//

#import <Foundation/Foundation.h>
#import <LuciqSDK/LCQTypes.h>

NS_ASSUME_NONNULL_BEGIN

@interface LuciqRNLogger : NSObject

+ (void)setLevel:(LCQSDKDebugLogsLevel)level;
+ (LCQSDKDebugLogsLevel)level;

+ (void)d:(NSString *)tag format:(NSString *)format, ... NS_FORMAT_FUNCTION(2, 3);
+ (void)w:(NSString *)tag format:(NSString *)format, ... NS_FORMAT_FUNCTION(2, 3);
+ (void)e:(NSString *)tag format:(NSString *)format, ... NS_FORMAT_FUNCTION(2, 3);

/**
 * Returns @c url with its userinfo, query string, and fragment stripped for
 * safe logging. Mirrors @c redactUrlForLog in src/utils/LuciqUtils.ts:
 *
 * - Userinfo (@c scheme://user:pass@host/... ) is removed from the authority.
 *   Only @c @ characters inside the authority (between @c :// and the next
 *   @c / , @c ? , or @c # ) are treated as userinfo - @c @ in a path is
 *   preserved.
 * - When a query was present (a @c ? preceded any @c # ), the result has
 *   @c ?<redacted> appended.
 * - Fragment-only cutoff is silent.
 * - nil/empty input returns @c "" .
 */
+ (NSString *)redactURL:(nullable NSString *)url;

@end

NS_ASSUME_NONNULL_END
