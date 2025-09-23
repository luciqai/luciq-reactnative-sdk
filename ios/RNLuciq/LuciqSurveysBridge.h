//
//  LuciqSurveysBridge.h
//  RNLuciq
//
//  Created by Salma Ali on 7/30/19.
//  Copyright © 2019 luciq. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LCQTypes.h>

@interface LuciqSurveysBridge : RCTEventEmitter <RCTBridgeModule>
/*
 +------------------------------------------------------------------------+
 |                            Surveys Module                             |
 +------------------------------------------------------------------------+
 */

- (void)showSurvey:(NSString *)surveyToken;

- (void)showSurveysIfAvailable;

- (void)setOnShowHandler:(RCTResponseSenderBlock)callBack;

- (void)setOnDismissHandler:(RCTResponseSenderBlock)callBack;

- (void)setAutoShowingEnabled:(BOOL)autoShowingSurveysEnabled;

- (void)setShouldShowWelcomeScreen:(BOOL)shouldShowWelcomeScreen;

- (void)hasRespondedToSurvey:(NSString *)surveyToken
                            :(RCTPromiseResolveBlock)resolve
                            :(RCTPromiseRejectBlock)reject;

- (void)getAvailableSurveys:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject;

- (void)setEnabled:(BOOL)surveysEnabled;

- (void)setAppStoreURL:(NSString *)appStoreURL;


@end


