//
//  LuciqBugReportingTests.m
//  LuciqSampleTests
//
//  Created by Salma Ali on 7/30/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import "LuciqBugReportingBridge.h"
#import <LuciqSDK/LCQTypes.h>
#import "LuciqSDK/LuciqSDK.h"
#import "LCQConstants.h"

@interface LuciqBugReportingTests : XCTestCase
@property (nonatomic, retain) LuciqBugReportingBridge *luciqBridge;
@end

@implementation LuciqBugReportingTests

- (void)setUp {
  // Put setup code here. This method is called before the invocation of each test method in the class.
  self.luciqBridge = [[LuciqBugReportingBridge alloc] init];
}

/*
 +------------------------------------------------------------------------+
 |                          Bug Reporting Module                          |
 +------------------------------------------------------------------------+
 */

- (void) testgivenBoolean$setBugReportingEnabled_whenQuery_thenShouldCallNativeApi {
  BOOL enabled = true;
  [self.luciqBridge setEnabled:enabled];
  XCTAssertTrue(LCQBugReporting.enabled);
}

- (void) testgivenInvocationEvent$setInvocationEvents_whenQuery_thenShouldCallNativeApiWithArgs {
  NSArray *invocationEventsArr;
  invocationEventsArr = [NSArray arrayWithObjects:  @(LCQInvocationEventScreenshot), nil];

  [self.luciqBridge setInvocationEvents:invocationEventsArr];
  LCQInvocationEvent invocationEvents = 0;
  for (NSNumber *boxedValue in invocationEventsArr) {
    invocationEvents |= [boxedValue intValue];
  }
  XCTAssertEqual(LCQBugReporting.invocationEvents, invocationEvents);
}

- (void) testgivenHandler$setOnInvokeHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  RCTResponseSenderBlock callback = ^(NSArray *response) {};
  [partialMock setOnInvokeHandler:callback];
  XCTAssertNotNil(LCQBugReporting.willInvokeHandler);
  OCMStub([partialMock sendEventWithName:@"LCQpreInvocationHandler" body:nil]);
  LCQBugReporting.willInvokeHandler();
  OCMVerify([partialMock sendEventWithName:@"LCQpreInvocationHandler" body:nil]);
}


- (void) testgivenHandlerCANCEL$setOnSDKDismissedHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  RCTResponseSenderBlock callback = ^(NSArray *response) {};
  [partialMock setOnSDKDismissedHandler:callback];
  XCTAssertNotNil(LCQBugReporting.didDismissHandler);
  NSDictionary *result = @{ @"dismissType": @"CANCEL",
                            @"reportType": @"bug"};
  OCMStub([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
  LCQBugReporting.didDismissHandler(LCQDismissTypeCancel,LCQReportCategoryBug);
  OCMVerify([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
}

- (void) testgivenHandlerSUBMIT$setOnSDKDismissedHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  RCTResponseSenderBlock callback = ^(NSArray *response) {};
  [partialMock setOnSDKDismissedHandler:callback];
  XCTAssertNotNil(LCQBugReporting.didDismissHandler);

  NSDictionary *result = @{ @"dismissType": @"SUBMIT",
                            @"reportType": @"feedback"};
  OCMStub([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
  LCQBugReporting.didDismissHandler(LCQDismissTypeSubmit,LCQReportCategoryFeedback);
  OCMVerify([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
}

- (void) testgivenHandlerADD_ATTACHMENT$setOnSDKDismissedHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  RCTResponseSenderBlock callback = ^(NSArray *response) {};
  [partialMock setOnSDKDismissedHandler:callback];
  XCTAssertNotNil(LCQBugReporting.didDismissHandler);
  NSDictionary *result = @{ @"dismissType": @"ADD_ATTACHMENT",
                            @"reportType": @"feedback"};
  OCMStub([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
  LCQBugReporting.didDismissHandler(LCQDismissTypeAddAttachment,LCQReportCategoryFeedback);
  OCMVerify([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
}

- (void) skip_testgivenDouble$setShakingThresholdForiPhone_whenQuery_thenShouldCallNativeApi {
  double threshold = 12;
  [self.luciqBridge setShakingThresholdForiPhone:threshold];
  XCTAssertEqual(LCQBugReporting.shakingThresholdForiPhone, threshold);
}

- (void) skip_testgivenDouble$setShakingThresholdForiPad_whenQuery_thenShouldCallNativeApi {
  double threshold = 12;
  [self.luciqBridge setShakingThresholdForiPad:threshold];
  XCTAssertEqual(LCQBugReporting.shakingThresholdForiPad, threshold);
}

- (void) testgivenExtendedBugReportMode$setExtendedBugReportMode_whenQuery_thenShouldCallNativeApi {
  LCQExtendedBugReportMode extendedBugReportMode = LCQExtendedBugReportModeEnabledWithOptionalFields;
  [self.luciqBridge setExtendedBugReportMode:extendedBugReportMode];
  XCTAssertEqual(LCQBugReporting.extendedBugReportMode, extendedBugReportMode);
}

- (void) testgivenArray$setReportTypes_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQBugReporting class]);
  NSArray *reportTypesArr = [NSArray arrayWithObjects:  @(LCQReportCategoryBug), nil];
  LCQBugReportingReportType reportTypes = 0;
  for (NSNumber *boxedValue in reportTypesArr) {
    reportTypes |= [boxedValue intValue];
  }
  OCMStub([mock setPromptOptionsEnabledReportTypes:reportTypes]);
  [self.luciqBridge setReportTypes:reportTypesArr];
  OCMVerify([mock setPromptOptionsEnabledReportTypes:reportTypes]);
}


- (void) testgivenArgs$showBugReportingWithReportTypeAndOptions_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQBugReporting class]);
  LCQBugReportingReportType reportType = LCQBugReportingReportTypeBug;
  NSArray *options = [NSArray arrayWithObjects:  @(LCQBugReportingOptionEmailFieldOptional), nil];
  LCQBugReportingOption parsedOptions = 0;
  for (NSNumber *boxedValue in options) {
    parsedOptions |= [boxedValue intValue];
  }
  OCMStub([mock showWithReportType:reportType options:parsedOptions]);
  [self.luciqBridge show:reportType options:options];

  XCTestExpectation *expectation = [self expectationWithDescription:@"Test ME PLX"];

  [[NSRunLoop mainRunLoop] performBlock:^{
    OCMVerify([mock showWithReportType:reportType options:parsedOptions]);
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:EXPECTATION_TIMEOUT handler:nil];
}

- (void) testgivenBoolean$setAutoScreenRecordingEnabled_whenQuery_thenShouldCallNativeApi {
  BOOL enabled = true;
  [self.luciqBridge setAutoScreenRecordingEnabled:enabled];
  XCTAssertTrue(LCQBugReporting.autoScreenRecordingEnabled);
}

- (void) testgivenArgs$setAutoScreenRecordingDuration_whenQuery_thenShouldCallNativeApi {
  CGFloat duration = 12.3;
  [self.luciqBridge setAutoScreenRecordingDuration:duration];
  XCTAssertEqual(LCQBugReporting.autoScreenRecordingDuration, duration);
}

- (void) testgivenBoolean$setViewHierarchyEnabled_whenQuery_thenShouldCallNativeApi {
  BOOL enabled = true;
  [self.luciqBridge setViewHierarchyEnabled:enabled];
  XCTAssertTrue(LCQBugReporting.shouldCaptureViewHierarchy);
}

- (void) testSetDisclaimerText {
  id mock = OCMClassMock([LCQBugReporting class]);
  NSString *text = @"This is a disclaimer text!";

  OCMStub([mock setDisclaimerText:text]);
  [self.luciqBridge setDisclaimerText:text];
  OCMVerify([mock setDisclaimerText:text]);
}

- (void)testAddUserConsentWithKey {
  id mock = OCMClassMock([LCQBugReporting class]);

  NSString *key = @"testKey";
  NSString *description = @"Consent description";
  BOOL mandatory = YES;
  BOOL checked = NO;
  NSNumber *actionType = @2;
  LCQConsentAction mappedActionType = (LCQConsentAction)[actionType integerValue];

  [self.luciqBridge addUserConsent:key
                                  description:description
                                    mandatory:mandatory
                                      checked:checked
                                   actionType:actionType];

  OCMVerify([mock addUserConsentWithKey:key
                                        description:description
                                          mandatory:mandatory
                                            checked:checked
                                         actionType:mappedActionType]);
}

- (void) testSetProactiveReportingConfigurations {
  id mock = OCMClassMock([LCQBugReporting class]);
  BOOL enabled = true;
  NSNumber* gap = @2;
  NSNumber* delay = @4;

  LCQProactiveReportingConfigurations *configurations = [[LCQProactiveReportingConfigurations alloc] init];
  configurations.enabled = enabled; //Enable/disable
  configurations.gapBetweenModals = gap; // Time in seconds
  configurations.modalDelayAfterDetection = delay; // Time in seconds

  OCMStub([mock setProactiveReportingConfigurations:OCMOCK_ANY]);

  [self.instabugBridge setProactiveReportingConfigurations:enabled gap:gap model:delay];

  // Verify that the method is called with the correct properties (using OCMArg to match properties)
  OCMVerify([mock setProactiveReportingConfigurations:[OCMArg checkWithBlock:^BOOL(id obj) {
      LCQProactiveReportingConfigurations *config = (LCQProactiveReportingConfigurations *)obj;
      return config.enabled == enabled &&
             [config.gapBetweenModals isEqualToNumber:gap] &&
             [config.modalDelayAfterDetection isEqualToNumber:delay];
    }]]);
}
@end

