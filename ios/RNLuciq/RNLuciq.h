#ifndef RNLuciq_h
#define RNLuciq_h

#import <LuciqSDK/LuciqSDK.h>
#import "ArgsRegistry.h"

@interface RNLuciq : NSObject

+ (void)initWithToken:(NSString *)token invocationEvents:(LCQInvocationEvent)invocationEvents debugLogsLevel:(LCQSDKDebugLogsLevel)debugLogsLevel;

+ (void)initWithToken:(NSString *)token invocationEvents:(LCQInvocationEvent)invocationEvents debugLogsLevel:(LCQSDKDebugLogsLevel)debugLogsLevel
useNativeNetworkInterception:(BOOL)useNativeNetworkInterception;

+ (void)initWithToken:(NSString *)token
     invocationEvents:(LCQInvocationEvent)invocationEvents
useNativeNetworkInterception:(BOOL)useNativeNetworkInterception;

+ (void)initWithToken:(NSString *)token invocationEvents:(LCQInvocationEvent)invocationEvents;

/**
 @brief Set codePush version before starting the SDK.

 @discussion Sets Code Push version to be used for all reports.
 should be called from `-[UIApplicationDelegate application:didFinishLaunchingWithOptions:]`
 and before `startWithToken`.

 @param codePushVersion the Code Push version to be used for all reports.
 */
+ (void)setCodePushVersion:(NSString *)codePushVersion;

+ (void)setOverAirVersion:(NSDictionary *)overAirVersion;

/**
 @brief Starts the native SDK before the React Native bridge and JS bundle load.

 @discussion Reads build-time configuration (token + log level) from the app's Info.plist and starts
 the SDK so crashes that happen during native startup (AppDelegate, native module init, the window
 before @c Luciq.init() runs from JS) are captured. No-op unless pre-init is enabled in Info.plist.

 Call this as early as possible from
 @c -[UIApplicationDelegate application:didFinishLaunchingWithOptions:]. The Expo config plugin
 injects this call automatically; bare React Native apps call it manually.
 */
+ (void)startPreInit;

@end

#endif /* RNLuciq_h */
