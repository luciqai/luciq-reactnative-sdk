#import <LuciqSDK/LuciqSDK.h>


@interface LCQCrashReporting (CP)

+ (void)cp_reportFatalCrashWithStackTrace:(NSDictionary*)stackTrace;

+ (void)cp_reportNonFatalCrashWithStackTrace:(NSDictionary*)stackTrace
                                       level:(LCQNonFatalLevel)level
                              groupingString:(NSString *)groupingString
                              userAttributes:(NSDictionary<NSString *, NSString*> *)userAttributes;
@end

