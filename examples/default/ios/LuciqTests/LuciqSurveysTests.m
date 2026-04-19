//
//  LuciqSurveysTests.m
//  LuciqSampleTests
//
//  Created by Salma Ali on 7/31/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import "LuciqSurveysBridge.h"
#import <LuciqSDK/LCQTypes.h>
#import "LuciqSDK/LuciqSDK.h"
#import "LCQConstants.h"

@interface LuciqSurveysTests : XCTestCase
@property (nonatomic, retain) LuciqSurveysBridge *luciqBridge;
@end

@protocol SurveysCPTestProtocol <NSObject>
/**
 * This protocol helps in correctly mapping Surveys mocked methods
 * when their method name matches another method in a different
 * module that differs in method signature.
 */
- (void)setEnabled:(BOOL)isEnabled;

@end

// typedef void (^AvailableSurveysWithCompletionBlock)(NSArray<LCQSurveys *> *availableSurveys);

@implementation LuciqSurveysTests

- (void)setUp {
  // Put setup code here. This method is called before the invocation of each test method in the class.
  self.luciqBridge = [[LuciqSurveysBridge alloc] init];
}

/*
 +------------------------------------------------------------------------+
 |                            Surveys Module                              |
 +------------------------------------------------------------------------+
 */

- (void)testShowingSurvey {
  id mock = OCMClassMock([LCQSurveys class]);
  NSString *token = @"token";

  OCMStub([mock showSurveyWithToken:token]);
  [self.luciqBridge showSurvey:token];
  OCMVerify([mock showSurveyWithToken:token]);
}


- (void) testShowSurveyIfAvailable {
  id mock = OCMClassMock([LCQSurveys class]);

  OCMStub([mock showSurveyIfAvailable]);
  [self.luciqBridge showSurveysIfAvailable];
  OCMVerify([mock showSurveyIfAvailable]);
}

- (void) testAutoShowingSurveysEnabled {
  id mock = OCMClassMock([LCQSurveys class]);
  BOOL isEnabled = YES;

  OCMStub([mock setAutoShowingEnabled:isEnabled]);
  [self.luciqBridge setAutoShowingEnabled:isEnabled];
  OCMVerify([mock setAutoShowingEnabled:isEnabled]);
}

- (void) testSetShouldShowSurveysWelcomeScreen {
  id mock = OCMClassMock([LCQSurveys class]);
  BOOL isEnabled = YES;

  OCMStub([mock setShouldShowWelcomeScreen:isEnabled]);
  [self.luciqBridge setShouldShowWelcomeScreen:isEnabled];
  OCMVerify([mock setShouldShowWelcomeScreen:isEnabled]);
}

- (void) testSetSurveysEnabled {
  BOOL isEnabled = YES;

  [self.luciqBridge setEnabled:isEnabled];
  XCTAssertTrue(LCQSurveys.enabled);
}

- (void) testHasRespondedToSurveyWithToken {
  id mock = OCMClassMock([LCQSurveys class]);
  NSString *surveyToken = @"survey_token";
  XCTestExpectation *expectation = [self expectationWithDescription:@"Testing hasRespondedToSurveyWithToken callback"];
  RCTPromiseResolveBlock resolve = ^(id result) {
    BOOL actualValue = [result boolValue];
    XCTAssertFalse(actualValue);
    [expectation fulfill];
  };
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};

  OCMStub([mock hasRespondedToSurveyWithToken:surveyToken completionHandler:[OCMArg invokeBlock]]);
  [self.luciqBridge hasRespondedToSurvey:surveyToken resolve:resolve reject:reject];
  OCMVerify([mock hasRespondedToSurveyWithToken:surveyToken completionHandler:[OCMArg isNotNil]]);
  [self waitForExpectationsWithTimeout:EXPECTATION_TIMEOUT handler:nil];
}

// - (void) testGetAvailableSurveys {
//   id mock = OCMClassMock([LCQSurveys class]);
//   RCTPromiseResolveBlock resolve = ^(id result) {};
//   RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};
//   AvailableSurveysWithCompletionBlock deeperCallback = ^(NSArray<LCQSurveys *> *availableSurveys) {};

//   OCMStub([mock availableSurveysWithCompletionHandler:deeperCallback]);
//   [self.luciqBridge getAvailableSurveys:resolve :reject];
//   OCMVerify([mock availableSurveysWithCompletionHandler:deeperCallback]);
// }

- (void) testSetWillShowSurveyHandler {
  id partialMock = OCMPartialMock(self.luciqBridge);
  [partialMock setOnShowHandler];
  XCTAssertNotNil(LCQSurveys.willShowSurveyHandler);
  OCMStub([partialMock sendEventWithName:OCMOCK_ANY body:nil]);
  LCQSurveys.willShowSurveyHandler();
  OCMVerify([partialMock sendEventWithName:@"LCQWillShowSurvey" body:nil]);
}

- (void) testSetDidDismissSurveyHandler {
  id partialMock = OCMPartialMock(self.luciqBridge);
  [partialMock setOnDismissHandler];
  XCTAssertNotNil(LCQSurveys.didDismissSurveyHandler);
  OCMStub([partialMock sendEventWithName:OCMOCK_ANY body:nil]);
  LCQSurveys.didDismissSurveyHandler();
  OCMVerify([partialMock sendEventWithName:@"LCQDidDismissSurvey" body:nil]);
}


- (void) testSetAppStoreURL {
  NSString *appStoreURL = @"http://test";

  [self.luciqBridge setAppStoreURL:appStoreURL];
  XCTAssertEqual(LCQSurveys.appStoreURL, appStoreURL);
}


@end

