#import <Foundation/Foundation.h>
#import <LuciqSDK/LCQTypes.h>
#import <LuciqSDK/LuciqSDK.h>

typedef NSDictionary<NSString*, NSNumber*> ArgsDictionary;

@interface ArgsRegistry : NSObject

+ (NSMutableDictionary *) getAll;

+ (ArgsDictionary *) sdkLogLevels;
+ (ArgsDictionary *) invocationEvents;
+ (ArgsDictionary *) invocationOptions;
+ (ArgsDictionary *) colorThemes;
+ (ArgsDictionary *) floatingButtonEdges;
+ (ArgsDictionary *) recordButtonPositions;
+ (ArgsDictionary *) welcomeMessageStates;
+ (ArgsDictionary *) reportTypes;
+ (ArgsDictionary *) dismissTypes;
+ (ArgsDictionary *) actionTypes;
+ (ArgsDictionary *) extendedBugReportStates;
+ (ArgsDictionary *) reproStates;
+ (ArgsDictionary *) locales;
+ (ArgsDictionary *)nonFatalExceptionLevel;
+ (ArgsDictionary *) launchType;
+ (ArgsDictionary *) overAirServices;
+ (ArgsDictionary *) userConsentActionTypes;

+ (NSDictionary<NSString *, NSString *> *) placeholders;
+ (ArgsDictionary *)autoMaskingTypes;
+ (ArgsDictionary *)capturingModes;
+ (ArgsDictionary *)screenshotQualities;

@end
