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
#import "Util/LuciqRNDebugTags.h"
#import "Util/LuciqRNLogger.h"

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
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[showSurvey] called surveyTokenLength=%lu, present=%@", (unsigned long)surveyToken.length, (surveyToken != nil ? @"YES" : @"NO")];
    [LCQSurveys showSurveyWithToken:surveyToken];
}

RCT_EXPORT_METHOD(hasRespondedToSurvey:(NSString *)surveyToken :(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[hasRespondedToSurvey] called surveyTokenLength=%lu, present=%@", (unsigned long)surveyToken.length, (surveyToken != nil ? @"YES" : @"NO")];
    [LCQSurveys hasRespondedToSurveyWithToken:surveyToken
                            completionHandler:^(BOOL hasResponded) {
        [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[hasRespondedToSurvey] success result=%@", (hasResponded ? @"YES" : @"NO")];
        resolve(@(hasResponded));
    }];
}

RCT_EXPORT_METHOD(getAvailableSurveys:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[getAvailableSurveys] called"];
    [LCQSurveys availableSurveysWithCompletionHandler:^(NSArray<LCQSurvey *> *availableSurveys) {
        NSMutableArray<NSDictionary*>* mappedSurveys = [[NSMutableArray alloc] init];
        for (LCQSurvey* survey in availableSurveys) {
            [mappedSurveys addObject:@{@"title": survey.title }];
        }
        [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[getAvailableSurveys] success count=%lu", (unsigned long)mappedSurveys.count];
        resolve(mappedSurveys);
    }];
}

RCT_EXPORT_METHOD(setEnabled:(BOOL)surveysEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[setEnabled] called surveysEnabled=%@", (surveysEnabled ? @"YES" : @"NO")];
    LCQSurveys.enabled = surveysEnabled;
}

RCT_EXPORT_METHOD(showSurveysIfAvailable) {
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[showSurveysIfAvailable] called"];
    [LCQSurveys showSurveyIfAvailable];
}

RCT_EXPORT_METHOD(setOnShowHandler:(RCTResponseSenderBlock)callBack) {
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[setOnShowHandler] called present=%@", (callBack != nil ? @"YES" : @"NO")];
    if (callBack != nil) {
        LCQSurveys.willShowSurveyHandler = ^{
            [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[LCQWillShowSurvey] emitted"];
            [self sendEventWithName:@"LCQWillShowSurvey" body:nil];
        };
    } else {
        LCQSurveys.willShowSurveyHandler = ^{};
    }
}

RCT_EXPORT_METHOD(setOnDismissHandler:(RCTResponseSenderBlock)callBack) {
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[setOnDismissHandler] called present=%@", (callBack != nil ? @"YES" : @"NO")];
    if (callBack != nil) {
        LCQSurveys.didDismissSurveyHandler = ^{
            [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[LCQDidDismissSurvey] emitted"];
            [self sendEventWithName:@"LCQDidDismissSurvey" body:nil];
        };
    } else {
        LCQSurveys.didDismissSurveyHandler = ^{};
    }
}

RCT_EXPORT_METHOD(setAutoShowingEnabled:(BOOL)autoShowingSurveysEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[setAutoShowingEnabled] called autoShowingSurveysEnabled=%@", (autoShowingSurveysEnabled ? @"YES" : @"NO")];
    LCQSurveys.autoShowingEnabled = autoShowingSurveysEnabled;
}

RCT_EXPORT_METHOD(setShouldShowWelcomeScreen:(BOOL)shouldShowWelcomeScreen) {
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[setShouldShowWelcomeScreen] called shouldShowWelcomeScreen=%@", (shouldShowWelcomeScreen ? @"YES" : @"NO")];
    LCQSurveys.shouldShowWelcomeScreen = shouldShowWelcomeScreen;
}

RCT_EXPORT_METHOD(setAppStoreURL:(NSString *)appStoreURL) {
    [LuciqRNLogger d:[LuciqRNDebugTags surveys] format:@"[setAppStoreURL] called url=%@", [LuciqRNLogger redactURL:appStoreURL]];
    LCQSurveys.appStoreURL = appStoreURL;
}

@synthesize description;

@synthesize hash;

@synthesize superclass;

@end



