#import "LuciqSurveysBridge.h"
#import <LuciqSDK/LCQSurveys.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNLuciqSpec/RNLuciqSpec.h>

@interface LuciqSurveysBridge () <NativeSurveysSpec>
@end
#endif

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

RCT_EXPORT_METHOD(hasRespondedToSurvey:(NSString *)surveyToken
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    [LCQSurveys hasRespondedToSurveyWithToken:surveyToken
                            completionHandler:^(BOOL hasResponded) {
        resolve(@(hasResponded));
    }];
}

RCT_EXPORT_METHOD(getAvailableSurveys:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    [LCQSurveys availableSurveysWithCompletionHandler:^(NSArray<LCQSurvey *> *availableSurveys) {
        NSMutableArray<NSDictionary*>* mappedSurveys = [[NSMutableArray alloc] init];
        for (LCQSurvey* survey in availableSurveys) {
            [mappedSurveys addObject:@{@"title": survey.title}];
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

RCT_EXPORT_METHOD(setOnShowHandler) {
    __weak LuciqSurveysBridge *weakSelf = self;
    LCQSurveys.willShowSurveyHandler = ^{
        [weakSelf sendEventWithName:@"LCQWillShowSurvey" body:nil];
    };
}

RCT_EXPORT_METHOD(setOnDismissHandler) {
    __weak LuciqSurveysBridge *weakSelf = self;
    LCQSurveys.didDismissSurveyHandler = ^{
        [weakSelf sendEventWithName:@"LCQDidDismissSurvey" body:nil];
    };
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

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeSurveysSpecJSI>(params);
}
#endif

@synthesize description;
@synthesize hash;
@synthesize superclass;

@end
