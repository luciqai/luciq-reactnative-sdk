#ifndef RNLuciq_h
#define RNLuciq_h

#import <InstabugSDK/InstabugSDK.h>
#import "ArgsRegistry.h"

@interface RNLuciq : NSObject

+ (void)initWithToken:(NSString *)token invocationEvents:(IBGInvocationEvent)invocationEvents debugLogsLevel:(IBGSDKDebugLogsLevel)debugLogsLevel;

+ (void)initWithToken:(NSString *)token invocationEvents:(IBGInvocationEvent)invocationEvents debugLogsLevel:(IBGSDKDebugLogsLevel)debugLogsLevel
useNativeNetworkInterception:(BOOL)useNativeNetworkInterception;

+ (void)initWithToken:(NSString *)token
     invocationEvents:(IBGInvocationEvent)invocationEvents
useNativeNetworkInterception:(BOOL)useNativeNetworkInterception;

+ (void)initWithToken:(NSString *)token invocationEvents:(IBGInvocationEvent)invocationEvents;

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
