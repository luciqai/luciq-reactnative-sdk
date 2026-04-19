//
//  LuciqReactBridge.h
//  luciqDemo
//
//  Created by Yousef Hamza on 9/29/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LuciqSDK.h>
#import <LuciqSDK/LCQBugReporting.h>
#import <LuciqSDK/LCQCrashReporting.h>
#import <LuciqSDK/LCQLog.h>
#import <LuciqSDK/LCQTypes.h>
#import "ArgsRegistry.h"

@interface LuciqReactBridge : RCTEventEmitter <RCTBridgeModule>

/*
 +------------------------------------------------------------------------+
 |                            Luciq Module                             |
 +------------------------------------------------------------------------+
 */

- (void)setEnabled:(BOOL)isEnabled;

- (void)init:(NSString *)token invocationEvents:(NSArray *)invocationEventsArray debugLogsLevel:(LCQSDKDebugLogsLevel)sdkDebugLogsLevel useNativeNetworkInterception:(BOOL)useNativeNetworkInterception codePushVersion:(NSString *)codePushVersion appVariant:(NSString *)appVariant options:(nullable NSDictionary *)options  overAirVersion:(NSDictionary *)overAirVersion;

- (void)setCodePushVersion:(NSString *)version;

- (void)setOverAirVersion:(NSDictionary *)overAirVersion;

- (void)setUserData:(NSString *)userData;

- (void)setAppVariant:(NSString *)appVariant;

- (void)setTrackUserSteps:(BOOL)isEnabled;

- (void)setSessionProfilerEnabled:(BOOL)sessionProfilerEnabled;

- (void)setLocale:(LCQLocale)locale;

- (void)setColorTheme:(LCQColorTheme)colorTheme;

- (void)setPrimaryColor:(UIColor *)color;

- (void)setTheme:(NSDictionary *)themeConfig;

- (void)appendTags:(NSArray *)tags;

- (void)resetTags;

- (void)getTags:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

- (void)setString:(NSString *)value key:(NSString *)key;

- (void)identifyUser:(NSString *)email name:(NSString *)name id:(nullable NSString *)userId;

- (void)logOut;

- (void)logUserEvent:(NSString *)name;

- (void)logVerbose:(NSString *)log;

- (void)setReproStepsConfig:(NSString *)bugMode crashMode:(NSString *)crashMode sessionReplay:(NSString *)sessionReplayMode;

- (void)setUserAttribute:(NSString *)key value:(NSString *)value;

- (void)getUserAttribute:(NSString *)key
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject;

- (void)removeUserAttribute:(NSString *)key;

- (void)getAllUserAttributes:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject;

- (void)clearAllUserAttributes;

- (void)showWelcomeMessageWithMode:(LCQWelcomeMessageMode)welcomeMessageMode;

- (void)setWelcomeMessageMode:(LCQWelcomeMessageMode)welcomeMessageMode;

- (void)setFileAttachment:(NSString *)fileLocation fileName:(NSString * _Nullable)fileName;

- (void)show;

- (void) willRedirectToStore;


/*
 +------------------------------------------------------------------------+
 |                              Log Module                                |
 +------------------------------------------------------------------------+
 */

- (void)setLCQLogPrintsToConsole:(BOOL)printsToConsole;
- (void)logVerbose:(NSString *)log;
- (void)logDebug:(NSString *)log;
- (void)logInfo:(NSString *)log;
- (void)logWarn:(NSString *)log;
- (void)logError:(NSString *)log;
- (void)clearLogs;

/*
 +------------------------------------------------------------------------+
 |                           Network Logging                              |
 +------------------------------------------------------------------------+
 */

- (void)setNetworkLoggingEnabled:(BOOL)isEnabled;
- (void)isW3ExternalTraceIDEnabled:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)isW3ExternalGeneratedHeaderEnabled:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)isW3CaughtHeaderEnabled:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)networkLogIOS:(NSString * _Nonnull)url
               method:(NSString * _Nonnull)method
          requestBody:(NSString * _Nonnull)requestBody
      requestBodySize:(double)requestBodySize
         responseBody:(NSString * _Nonnull)responseBody
     responseBodySize:(double)responseBodySize
         responseCode:(double)responseCode
       requestHeaders:(NSDictionary * _Nonnull)requestHeaders
      responseHeaders:(NSDictionary * _Nonnull)responseHeaders
          contentType:(NSString * _Nonnull)contentType
          errorDomain:(NSString * _Nullable)errorDomain
            errorCode:(double)errorCode
            startTime:(double)startTime
             duration:(double)duration
         gqlQueryName:(NSString * _Nullable)gqlQueryName
   serverErrorMessage:(NSString * _Nullable)serverErrorMessage
w3cExternalTraceAttributes:(NSDictionary * _Nullable)w3cExternalTraceAttributes;

/*
 +------------------------------------------------------------------------+
 |                              Experiments                               |
 +------------------------------------------------------------------------+
 */

- (void)addExperiments:(NSArray *)experiments;
- (void)removeExperiments:(NSArray *)experiments;
- (void)clearAllExperiments;
- (void)addFeatureFlags:(NSDictionary *)featureFlagsMap;
- (void)removeFeatureFlags:(NSArray *)featureFlags;
- (void)removeAllFeatureFlags;
- (void)setNetworkLogBodyEnabled:(BOOL)isEnabled;
- (void)enableAutoMasking:(NSArray *)autoMaskingTypes;
- (void)getNetworkBodyMaxSize:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

@end
