//
//  LuciqSurveysBridge.m
//  RNLuciq
//
//  Created by Salma Ali on 7/30/19.
//  Copyright © 2019 luciq. All rights reserved.
//

#import "LuciqSurveysBridge.h"
#import <LuciqSDK/LCQSurveys.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>

@implementation LuciqSurveysBridge

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
             @"LCQWillShowSurvey",
             @"LCQDidDismissSurvey"
             ];
}

RCT_EXPORT_MODULE(LCQSurveys)

RCT_EXPORT_METHOD(showSurvey:(NSString *)surveyToken) {
    [LCQSurveys showSurveyWithToken:surveyToken];
}

RCT_EXPORT_METHOD(hasRespondedToSurvey:(NSString *)surveyToken :(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    [LCQSurveys hasRespondedToSurveyWithToken:surveyToken
                            completionHandler:^(BOOL hasResponded) {
        resolve(@(hasResponded));
    }];
}

RCT_EXPORT_METHOD(getAvailableSurveys:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    [LCQSurveys availableSurveysWithCompletionHandler:^(NSArray<LCQSurvey *> *availableSurveys) {
        NSMutableArray<NSDictionary*>* mappedSurveys = [[NSMutableArray alloc] init];
        for (LCQSurvey* survey in availableSurveys) {
            [mappedSurveys addObject:@{@"title": survey.title }];
        }
        resolve(mappedSurveys);
    }];
}

RCT_EXPORT_METHOD(setEnabled:(BOOL)surveysEnabled) {
    LCQSurveys.enabled = surveysEnabled;
}

RCT_EXPORT_METHOD(showSurveysIfAvailable) {
    [LCQSurveys showSurveyIfAvailable];
}

RCT_EXPORT_METHOD(setOnShowHandler:(RCTResponseSenderBlock)callBack) {
    if (callBack != nil) {
        LCQSurveys.willShowSurveyHandler = ^{
            [self sendEventWithName:@"LCQWillShowSurvey" body:nil];
        };
    } else {
        LCQSurveys.willShowSurveyHandler = ^{};
    }
}

RCT_EXPORT_METHOD(setOnDismissHandler:(RCTResponseSenderBlock)callBack) {
    if (callBack != nil) {
        LCQSurveys.didDismissSurveyHandler = ^{
            [self sendEventWithName:@"LCQDidDismissSurvey" body:nil];
        };
    } else {
        LCQSurveys.didDismissSurveyHandler = ^{};
    }
}

RCT_EXPORT_METHOD(setAutoShowingEnabled:(BOOL)autoShowingSurveysEnabled) {
    LCQSurveys.autoShowingEnabled = autoShowingSurveysEnabled;
}

RCT_EXPORT_METHOD(setShouldShowWelcomeScreen:(BOOL)shouldShowWelcomeScreen) {
    LCQSurveys.shouldShowWelcomeScreen = shouldShowWelcomeScreen;
}

RCT_EXPORT_METHOD(setAppStoreURL:(NSString *)appStoreURL) {
    LCQSurveys.appStoreURL = appStoreURL;
}

@synthesize description;

@synthesize hash;

@synthesize superclass;

@end



