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

- (void)setOnShowHandler;

- (void)setOnDismissHandler;

- (void)setAutoShowingEnabled:(BOOL)autoShowingSurveysEnabled;

- (void)setShouldShowWelcomeScreen:(BOOL)shouldShowWelcomeScreen;

- (void)hasRespondedToSurvey:(NSString *)surveyToken
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject;

- (void)getAvailableSurveys:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

- (void)setEnabled:(BOOL)surveysEnabled;

- (void)setAppStoreURL:(NSString *)appStoreURL;


@end


