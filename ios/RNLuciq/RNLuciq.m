#import <LuciqSDK/LuciqSDK.h>
#import <LuciqSDK/LCQBugReporting.h>
#import <React/RCTLog.h>
#import "RNLuciq.h"
#import "Util/LCQNetworkLogger+CP.h"
#import "Util/Luciq+CP.h"
#import "Util/LuciqRNDebugTags.h"
#import "Util/LuciqRNLogger.h"

// Info.plist keys written at build time (by the Expo config plugin or manually for bare RN) used to
// start the SDK before the JS bundle loads. See +startPreInit.
static NSString *const kLuciqPreInitEnabledKey = @"LuciqPreInitEnabled";
static NSString *const kLuciqPreInitTokenKey = @"LuciqToken";
static NSString *const kLuciqPreInitLogLevelKey = @"LuciqPreInitLogLevel";

@implementation RNLuciq

static BOOL didInit = NO;
static BOOL isPreInitialized = NO;

/// Resets `didInit` allowing re-initialization, it should not be added to the header file and is there for testing purposes.
+ (void)reset {
    didInit = NO;
    isPreInitialized = NO;
}

+ (BOOL)isPreInitialized {
    return isPreInitialized;
}

+ (void)initWithToken:(NSString *)token
     invocationEvents:(LCQInvocationEvent)invocationEvents
useNativeNetworkInterception:(BOOL)useNativeNetworkInterception {

    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[initWithToken] called tokenPresent=%@, tokenLength=%lu, invocationEvents=%lu, useNativeNetworkInterception=%@", (token.length > 0 ? @"YES" : @"NO"), (unsigned long)token.length, (unsigned long)invocationEvents, (useNativeNetworkInterception ? @"YES" : @"NO")];

    BOOL alreadyStarted = didInit;
    didInit = YES;

    [Luciq setCurrentPlatform:LCQPlatformReactNative];

    if (!useNativeNetworkInterception) {
        // Disable automatic network logging in the iOS SDK to avoid duplicate network logs coming
        // from both the iOS and React Native SDKs
        [LCQNetworkLogger disableAutomaticCapturingOfNetworkLogs];
    }

    if (alreadyStarted && isPreInitialized) {
        // The SDK was already started by pre-init (before the JS bundle loaded), so re-starting it
        // would be a no-op and would drop the JS-provided invocation events. Apply them at runtime
        // instead of calling startWithToken again.
        [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[initWithToken] reconciling JS config with pre-initialized SDK"];
        LCQBugReporting.invocationEvents = invocationEvents;
    } else {
        [Luciq startWithToken:token invocationEvents:invocationEvents];
    }

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
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[initWithToken:invocationEvents] called tokenPresent=%@, tokenLength=%lu, invocationEvents=%lu", (token.length > 0 ? @"YES" : @"NO"), (unsigned long)token.length, (unsigned long)invocationEvents];
    [self initWithToken:token invocationEvents:invocationEvents useNativeNetworkInterception:NO];
}

+ (void)initWithToken:(NSString *)token invocationEvents:(LCQInvocationEvent)invocationEvents debugLogsLevel:(LCQSDKDebugLogsLevel)debugLogsLevel useNativeNetworkInterception:(BOOL)useNativeNetworkInterception {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[initWithToken:invocationEvents:debugLogsLevel:useNativeNetworkInterception] called tokenPresent=%@, tokenLength=%lu, invocationEvents=%lu, debugLogsLevel=%lu, useNativeNetworkInterception=%@", (token.length > 0 ? @"YES" : @"NO"), (unsigned long)token.length, (unsigned long)invocationEvents, (unsigned long)debugLogsLevel, (useNativeNetworkInterception ? @"YES" : @"NO")];
    [Luciq setSdkDebugLogsLevel:debugLogsLevel];
    [self initWithToken:token invocationEvents:invocationEvents useNativeNetworkInterception:useNativeNetworkInterception];
}

+ (void)initWithToken:(NSString *)token
     invocationEvents:(LCQInvocationEvent)invocationEvents
       debugLogsLevel:(LCQSDKDebugLogsLevel)debugLogsLevel {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[initWithToken:invocationEvents:debugLogsLevel] called tokenPresent=%@, tokenLength=%lu, invocationEvents=%lu, debugLogsLevel=%lu", (token.length > 0 ? @"YES" : @"NO"), (unsigned long)token.length, (unsigned long)invocationEvents, (unsigned long)debugLogsLevel];
    [Luciq setSdkDebugLogsLevel:debugLogsLevel];
    [self initWithToken:token invocationEvents:invocationEvents];
}

+ (void)setCodePushVersion:(NSString *)codePushVersion {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setCodePushVersion] called codePushVersionPresent=%@, codePushVersionLength=%lu", (codePushVersion.length > 0 ? @"YES" : @"NO"), (unsigned long)codePushVersion.length];
    [Luciq setCodePushVersion:codePushVersion];
}

+ (void)setOverAirVersion:(NSDictionary *)overAirVersion {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setOverAirVersion] called overAirVersionCount=%lu", (unsigned long)overAirVersion.count];
    [Luciq setOverAirVersion:overAirVersion[@"version"] withType:[overAirVersion[@"service"] intValue]];
}

+ (void)startPreInit {
    if (didInit) {
        [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[startPreInit] SDK already initialized, skipping pre-init"];
        return;
    }

    NSBundle *mainBundle = [NSBundle mainBundle];

    NSNumber *enabled = [mainBundle objectForInfoDictionaryKey:kLuciqPreInitEnabledKey];
    if (![enabled boolValue]) {
        return;
    }

    NSString *token = [mainBundle objectForInfoDictionaryKey:kLuciqPreInitTokenKey];
    if (token.length == 0) {
        [LuciqRNLogger e:[LuciqRNDebugTags core] format:@"[startPreInit] pre-init enabled but no %@ found in Info.plist; skipping", kLuciqPreInitTokenKey];
        return;
    }

    NSNumber *logLevelNumber = [mainBundle objectForInfoDictionaryKey:kLuciqPreInitLogLevelKey];
    LCQSDKDebugLogsLevel logLevel = logLevelNumber != nil ? (LCQSDKDebugLogsLevel)[logLevelNumber integerValue] : LCQSDKDebugLogsLevelError;

    // Mark before starting so the SDK knows it was pre-initialized when the JS init() reconciles.
    isPreInitialized = YES;
    [Luciq setSdkDebugLogsLevel:logLevel];

    // Start with no invocation event. Invocation events are not needed to capture native startup
    // crashes; the real invocation events are applied at runtime when the JS init() call reconciles.
    [self initWithToken:token invocationEvents:LCQInvocationEventNone];

    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[startPreInit] native pre-init complete"];
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

