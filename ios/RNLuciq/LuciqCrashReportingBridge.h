#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LCQBugReporting.h>
#import <LuciqSDK/LCQTypes.h>
#import <LuciqSDK/LCQCrashReporting.h>
#import <LuciqSDK/LuciqSDK.h>
#import "ArgsRegistry.h"

@interface LuciqCrashReportingBridge : RCTEventEmitter <RCTBridgeModule>

- (void)setEnabled:(BOOL) isEnabled;
- (void)sendJSCrash:(NSDictionary *_Nonnull )stackTrace resolver:(RCTPromiseResolveBlock _Nullable )resolve
           rejecter:(RCTPromiseRejectBlock _Nullable )reject;
- (void)sendHandledJSCrash:(NSDictionary *_Nonnull)stackTrace userAttributes:(nullable NSDictionary *)userAttributes fingerprint:(nullable NSString *)fingerprint nonFatalExceptionLevel:(LCQNonFatalLevel) nonFatalExceptionLevel resolver:(RCTPromiseResolveBlock _Nullable )resolve
                  rejecter:(RCTPromiseRejectBlock _Nullable )reject;

@end
