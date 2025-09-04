#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <InstabugSDK/IBGTypes.h>
#import <InstabugSDK/IBGSessionReplay.h>

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

- (void)getSessionReplayLink:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject;

- (void)setSyncCallback;

- (void)evaluateSync:(BOOL)result;

@property (atomic, copy) SessionEvaluationCompletion sessionEvaluationCompletion;

@end


