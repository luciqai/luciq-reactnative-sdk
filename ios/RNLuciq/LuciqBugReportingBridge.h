//
//  LuciqBugReportingBridge.h
//  RNLuciq
//
//  Created by Salma Ali on 7/30/19.
//  Copyright © 2019 luciq. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LCQTypes.h>
#import <LuciqSDK/LCQBugReporting.h>

@interface LuciqBugReportingBridge : RCTEventEmitter <RCTBridgeModule>
/*
 +------------------------------------------------------------------------+
 |                            BugReporting Module                         |
 +------------------------------------------------------------------------+
 */

- (void)setEnabled:(BOOL)isEnabled;

- (void)setInvocationEvents:(NSArray *)invocationEventsArray;

- (void)setOptions:(NSArray *)optionsArray;

- (void)setFloatingButtonEdge:(NSString *)edge offset:(double)offset;

- (void)setOnInvokeHandler;

- (void)setOnSDKDismissedHandler;

- (void)setShakingThresholdForiPhone:(double)iPhoneShakingThreshold;

- (void)setShakingThresholdForiPad:(double)iPadShakingThreshold;

- (void)setExtendedBugReportMode:(NSString *)mode;

- (void)setReportTypes:(NSArray *)types;

- (void)show:(NSString *)type options:(NSArray *)options;

- (void)setAutoScreenRecordingEnabled:(BOOL)enabled;

- (void)setAutoScreenRecordingDuration:(CGFloat)duration;

- (void)setViewHierarchyEnabled:(BOOL)viewHirearchyEnabled;

- (void)setDisclaimerText:(NSString *)text;

- (void)setCommentMinimumCharacterCount:(NSNumber *)limit reportTypes:(NSArray *)reportTypes;

- (void)addUserConsent:(NSString *)key
                  description:(NSString *)description
                    mandatory:(BOOL)mandatory
                      checked:(BOOL)checked
                   actionType:(id)actionType;

- (void)setProactiveReportingConfigurations:(BOOL)enabled gapBetweenModals:(double)gapBetweenModals modalDelayAfterDetection:(double)modalDelayAfterDetection;

@end
