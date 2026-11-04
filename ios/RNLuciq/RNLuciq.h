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
 @brief Hooks React Native into a Luciq SDK the native app already started (hybrid apps).

 @discussion Never starts the SDK and never changes what the native app configured: the token, app variant,
 invocation events, APM hot launches and network capture stay as the native app set them. It marks the
 process as running React Native, which JavaScript crash reports and the masking of React Native text
 need, and captures JavaScript console logs. The native app must start Luciq before React Native loads.

 Which screens are React Native is declared natively with `+[Luciq registerCrossPlatformHosts:platform:]`;
 without it, every screen keeps today's whole-app React Native handling.
 */
+ (void)attachToNativeApp;

/**
 @brief Reports screens that aren't React Native under their own names.

 @discussion Declares React Native's root views (`RCTRootView`, `RCTSurfaceHostingView`) as the screens
 React Native renders, so the native SDK resolves the platform per screen: React Native screens keep the
 JavaScript route names and every other view controller is reported as a native screen. Call it before
 the SDK starts. On a native SDK without hybrid app support it logs a warning and does nothing.
 */
+ (void)trackNativeScreens;

/**
 @brief Set codePush version before starting the SDK.

 @discussion Sets Code Push version to be used for all reports.
 should be called from `-[UIApplicationDelegate application:didFinishLaunchingWithOptions:]`
 and before `startWithToken`.

 @param codePushVersion the Code Push version to be used for all reports.
 */
+ (void)setCodePushVersion:(NSString *)codePushVersion;

+ (void)setOverAirVersion:(NSDictionary *)overAirVersion;

@end

#endif /* RNLuciq_h */
