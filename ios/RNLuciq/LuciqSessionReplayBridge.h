#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LCQTypes.h>
#import <LuciqSDK/LCQSessionReplay.h>

@interface LuciqSessionReplayBridge : RCTEventEmitter <RCTBridgeModule>
/*
 +------------------------------------------------------------------------+
 |                            Session Replay Module                       |
 +------------------------------------------------------------------------+
 */

- (void)setEnabled:(BOOL)isEnabled;

- (void)setLuciqLogsEnabled:(BOOL)isEnabled;

- (void)setNetworkLogsEnabled:(BOOL)isEnabled;

- (void)setUserStepsEnabled:(BOOL)isEnabled;

- (void)getSessionReplayLink:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

- (void)setSyncCallback:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

- (void)evaluateSync:(BOOL)result;

- (void)setCapturingMode:(NSString *)mode;

- (void)setScreenshotQuality:(NSString *)quality;

- (void)setScreenshotCaptureInterval:(double)intervalMs;

@property (atomic, copy) SessionEvaluationCompletion sessionEvaluationCompletion;

@end


