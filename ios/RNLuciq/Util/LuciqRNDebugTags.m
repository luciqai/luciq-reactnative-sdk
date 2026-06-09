//
//  LuciqRNDebugTags.m
//  RNLuciq
//

#import "LuciqRNDebugTags.h"

@implementation LuciqRNDebugTags

+ (NSString *)core               { return @"LCQ-RN-iOS-CORE:"; }
+ (NSString *)screenTracking     { return @"LCQ-RN-iOS-SCREEN:"; }
+ (NSString *)apmScreenLoading   { return @"LCQ-RN-iOS-APM-SL:"; }
+ (NSString *)apmScreenRendering { return @"LCQ-RN-iOS-APM-SR:"; }
+ (NSString *)apmUITrace         { return @"LCQ-RN-iOS-APM-UI:"; }
+ (NSString *)apmAppLaunch       { return @"LCQ-RN-iOS-APM-LAUNCH:"; }
+ (NSString *)apm                { return @"LCQ-RN-iOS-APM:"; }
+ (NSString *)apmCustomSpan      { return @"LCQ-RN-iOS-APM-SPAN:"; }
+ (NSString *)apmFlow            { return @"LCQ-RN-iOS-APM-FLOW:"; }
+ (NSString *)apmNetwork         { return @"LCQ-RN-iOS-APM-NET:"; }
+ (NSString *)bugReporting       { return @"LCQ-RN-iOS-BR:"; }
+ (NSString *)crashReporting     { return @"LCQ-RN-iOS-CRASH:"; }
+ (NSString *)sessionReplay      { return @"LCQ-RN-iOS-SR:"; }
+ (NSString *)privateView        { return @"LCQ-RN-iOS-PRIV:"; }
+ (NSString *)featureFlags       { return @"LCQ-RN-iOS-FF:"; }
+ (NSString *)network            { return @"LCQ-RN-iOS-NET:"; }
+ (NSString *)xhr                { return @"LCQ-RN-iOS-XHR:"; }
+ (NSString *)surveys            { return @"LCQ-RN-iOS-SUR:"; }
+ (NSString *)replies            { return @"LCQ-RN-iOS-REP:"; }
+ (NSString *)featureRequests    { return @"LCQ-RN-iOS-FR:"; }
+ (NSString *)appState           { return @"LCQ-RN-iOS-STATE:"; }

@end
