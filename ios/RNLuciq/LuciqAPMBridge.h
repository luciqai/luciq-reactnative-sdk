
#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LCQTypes.h>

@interface LuciqAPMBridge : RCTEventEmitter <RCTBridgeModule>
/*
 +------------------------------------------------------------------------+
 |                             APM Module                                 |
 +------------------------------------------------------------------------+
 */

- (void)setEnabled:(BOOL)isEnabled;
- (void)setAppLaunchEnabled:(BOOL)isEnabled;
- (void)endAppLaunch;
- (void)setAutoUITraceEnabled:(BOOL)isEnabled;
- (void)startFlow:(NSString *)name;
- (void)endFlow:(NSString *)name;
- (void)setFlowAttribute:(NSString *)name :(NSString *)key :(NSString *_Nullable)value;
- (void)startUITrace:(NSString *)name;
- (void)endUITrace;

- (void)setScreenRenderingEnabled:(BOOL)isEnabled;

// Custom Span methods
- (void)syncCustomSpan:(NSString *)name
        startTimestamp:(double)startTimestamp
          endTimestamp:(double)endTimestamp
              resolver:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject;

- (void)isCustomSpanEnabled:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject;

- (void)isAPMEnabled:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject;

@end
