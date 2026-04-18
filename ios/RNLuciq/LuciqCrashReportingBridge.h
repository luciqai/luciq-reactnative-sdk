#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LCQBugReporting.h>
#import <LuciqSDK/LCQTypes.h>
#import <LuciqSDK/LCQCrashReporting.h>
#import <LuciqSDK/LuciqSDK.h>
#import "ArgsRegistry.h"

@interface LuciqCrashReportingBridge : RCTEventEmitter <RCTBridgeModule>

- (void)setEnabled:(BOOL)isEnabled;

- (void)sendJSCrash:(NSDictionary * _Nonnull)data
            resolve:(RCTPromiseResolveBlock _Nullable)resolve
             reject:(RCTPromiseRejectBlock _Nullable)reject;

- (void)sendHandledJSCrash:(NSDictionary * _Nonnull)data
            userAttributes:(NSDictionary * _Nullable)userAttributes
               fingerprint:(NSString * _Nullable)fingerprint
    nonFatalExceptionLevel:(NSString * _Nullable)nonFatalExceptionLevel
                   resolve:(RCTPromiseResolveBlock _Nullable)resolve
                    reject:(RCTPromiseRejectBlock _Nullable)reject;

- (void)setNDKCrashesEnabled:(BOOL)isEnabled
                     resolve:(RCTPromiseResolveBlock _Nullable)resolve
                      reject:(RCTPromiseRejectBlock _Nullable)reject;

@end
