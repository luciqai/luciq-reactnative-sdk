#import <LuciqSDK/LuciqSDK.h>
#import <React/RCTLog.h>
#import "RNLuciq.h"
#import "Util/LCQNetworkLogger+CP.h"
#import "Util/Luciq+CP.h"

@implementation RNLuciq

static BOOL didInit = NO;

/// Resets `didInit` allowing re-initialization, it should not be added to the header file and is there for testing purposes.
+ (void)reset {
    didInit = NO;
}

+ (void)initWithToken:(NSString *)token
     invocationEvents:(LCQInvocationEvent)invocationEvents
useNativeNetworkInterception:(BOOL)useNativeNetworkInterception {

    didInit = YES;

    [Luciq setCurrentPlatform:LCQPlatformReactNative];

    if (!useNativeNetworkInterception) {
        // Disable automatic network logging in the iOS SDK to avoid duplicate network logs coming
        // from both the iOS and React Native SDKs
        [LCQNetworkLogger disableAutomaticCapturingOfNetworkLogs];
    }

    [Luciq startWithToken:token invocationEvents:invocationEvents];

    // Setup automatic capturing of JavaScript console logs
    RCTAddLogFunction(LuciqReactLogFunction);
    RCTSetLogThreshold(RCTLogLevelInfo);

    // Even though automatic network logging is disabled in the iOS SDK, the network logger itself
    // is still needed since network logs captured by the React Native SDK need to be logged through it
    LCQNetworkLogger.enabled = YES;

    // Temporarily disabling APM hot launches
    LCQAPM.hotAppLaunchEnabled = NO;
}

+ (void)initWithToken:(NSString *)token invocationEvents:(LCQInvocationEvent)invocationEvents {
    [self initWithToken:token invocationEvents:invocationEvents useNativeNetworkInterception:NO];
}

+ (void)initWithToken:(NSString *)token invocationEvents:(LCQInvocationEvent)invocationEvents debugLogsLevel:(LCQSDKDebugLogsLevel)debugLogsLevel useNativeNetworkInterception:(BOOL)useNativeNetworkInterception {
    [Luciq setSdkDebugLogsLevel:debugLogsLevel];
    [self initWithToken:token invocationEvents:invocationEvents useNativeNetworkInterception:useNativeNetworkInterception];
}

+ (void)initWithToken:(NSString *)token
     invocationEvents:(LCQInvocationEvent)invocationEvents
       debugLogsLevel:(LCQSDKDebugLogsLevel)debugLogsLevel {
    [Luciq setSdkDebugLogsLevel:debugLogsLevel];
    [self initWithToken:token invocationEvents:invocationEvents];
}

+ (void)setCodePushVersion:(NSString *)codePushVersion {
    [Luciq setCodePushVersion:codePushVersion];
}

+ (void)setOverAirVersion:(NSDictionary *)overAirVersion {
    [Luciq setOverAirVersion:overAirVersion[@"version"] withType:[overAirVersion[@"service"] intValue]];
}


// Note: This function is used to bridge LCQNSLog with RCTLogFunction.
// This log function should not be used externally and is only an implementation detail.
void RNLCQLog(LCQLogLevel logLevel, NSString *format,  ...) {
    va_list arg_list;
    va_start(arg_list, format);
    LCQNSLogWithLevel(format, arg_list, logLevel);
    va_end(arg_list);
}

RCTLogFunction LuciqReactLogFunction = ^(RCTLogLevel level,
                                            __unused RCTLogSource source,
                                            NSString *fileName,
                                            NSNumber *lineNumber,
                                            NSString *message)
{
    NSString *formatString = @"Luciq - REACT LOG: %@";
    NSString *log = RCTFormatLog([NSDate date], level, fileName, lineNumber, message);

    switch(level) {
        case RCTLogLevelTrace:
            RNLCQLog(LCQLogLevelVerbose, formatString, log);
            break;
        case RCTLogLevelInfo:
            RNLCQLog(LCQLogLevelInfo, formatString, log);
            break;
        case RCTLogLevelWarning:
            RNLCQLog(LCQLogLevelWarning, formatString, log);
            break;
        case RCTLogLevelError:
            RNLCQLog(LCQLogLevelError, formatString, log);
            break;
        case RCTLogLevelFatal:
            RNLCQLog(LCQLogLevelError, formatString, log);
            break;
    }
};

@end

