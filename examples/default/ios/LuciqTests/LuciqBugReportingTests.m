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
#import <InstabugSDK/IBGTypes.h>
#import "InstabugSDK/InstabugSDK.h"
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
  XCTAssertTrue(IBGBugReporting.enabled);
}

- (void) testgivenInvocationEvent$setInvocationEvents_whenQuery_thenShouldCallNativeApiWithArgs {
  NSArray *invocationEventsArr;
  invocationEventsArr = [NSArray arrayWithObjects:  @(IBGInvocationEventScreenshot), nil];

  [self.luciqBridge setInvocationEvents:invocationEventsArr];
  IBGInvocationEvent invocationEvents = 0;
  for (NSNumber *boxedValue in invocationEventsArr) {
    invocationEvents |= [boxedValue intValue];
  }
  XCTAssertEqual(IBGBugReporting.invocationEvents, invocationEvents);
}

- (void) testgivenHandler$setOnInvokeHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  RCTResponseSenderBlock callback = ^(NSArray *response) {};
  [partialMock setOnInvokeHandler:callback];
  XCTAssertNotNil(IBGBugReporting.willInvokeHandler);
  OCMStub([partialMock sendEventWithName:@"LCQpreInvocationHandler" body:nil]);
  IBGBugReporting.willInvokeHandler();
  OCMVerify([partialMock sendEventWithName:@"LCQpreInvocationHandler" body:nil]);
}


- (void) testgivenHandlerCANCEL$setOnSDKDismissedHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  RCTResponseSenderBlock callback = ^(NSArray *response) {};
  [partialMock setOnSDKDismissedHandler:callback];
  XCTAssertNotNil(IBGBugReporting.didDismissHandler);
  NSDictionary *result = @{ @"dismissType": @"CANCEL",
                            @"reportType": @"bug"};
  OCMStub([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
  IBGBugReporting.didDismissHandler(IBGDismissTypeCancel,IBGReportTypeBug);
  OCMVerify([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
}

- (void) testgivenHandlerSUBMIT$setOnSDKDismissedHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  RCTResponseSenderBlock callback = ^(NSArray *response) {};
  [partialMock setOnSDKDismissedHandler:callback];
  XCTAssertNotNil(IBGBugReporting.didDismissHandler);

  NSDictionary *result = @{ @"dismissType": @"SUBMIT",
                            @"reportType": @"feedback"};
  OCMStub([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
  IBGBugReporting.didDismissHandler(IBGDismissTypeSubmit,IBGReportTypeFeedback);
  OCMVerify([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
}

- (void) testgivenHandlerADD_ATTACHMENT$setOnSDKDismissedHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  RCTResponseSenderBlock callback = ^(NSArray *response) {};
  [partialMock setOnSDKDismissedHandler:callback];
  XCTAssertNotNil(IBGBugReporting.didDismissHandler);
  NSDictionary *result = @{ @"dismissType": @"ADD_ATTACHMENT",
                            @"reportType": @"feedback"};
  OCMStub([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
  IBGBugReporting.didDismissHandler(IBGDismissTypeAddAttachment,IBGReportTypeFeedback);
  OCMVerify([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
}

- (void) skip_testgivenDouble$setShakingThresholdForiPhone_whenQuery_thenShouldCallNativeApi {
  double threshold = 12;
  [self.luciqBridge setShakingThresholdForiPhone:threshold];
  XCTAssertEqual(IBGBugReporting.shakingThresholdForiPhone, threshold);
}

- (void) skip_testgivenDouble$setShakingThresholdForiPad_whenQuery_thenShouldCallNativeApi {
  double threshold = 12;
  [self.luciqBridge setShakingThresholdForiPad:threshold];
  XCTAssertEqual(IBGBugReporting.shakingThresholdForiPad, threshold);
}

- (void) testgivenExtendedBugReportMode$setExtendedBugReportMode_whenQuery_thenShouldCallNativeApi {
  IBGExtendedBugReportMode extendedBugReportMode = IBGExtendedBugReportModeEnabledWithOptionalFields;
  [self.luciqBridge setExtendedBugReportMode:extendedBugReportMode];
  XCTAssertEqual(IBGBugReporting.extendedBugReportMode, extendedBugReportMode);
}

- (void) testgivenArray$setReportTypes_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([IBGBugReporting class]);
  NSArray *reportTypesArr = [NSArray arrayWithObjects:  @(IBGReportTypeBug), nil];
  IBGBugReportingReportType reportTypes = 0;
  for (NSNumber *boxedValue in reportTypesArr) {
    reportTypes |= [boxedValue intValue];
  }
  OCMStub([mock setPromptOptionsEnabledReportTypes:reportTypes]);
  [self.luciqBridge setReportTypes:reportTypesArr];
  OCMVerify([mock setPromptOptionsEnabledReportTypes:reportTypes]);
}


- (void) testgivenArgs$showBugReportingWithReportTypeAndOptions_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([IBGBugReporting class]);
  IBGBugReportingReportType reportType = IBGBugReportingReportTypeBug;
  NSArray *options = [NSArray arrayWithObjects:  @(IBGBugReportingOptionEmailFieldOptional), nil];
  IBGBugReportingOption parsedOptions = 0;
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
  XCTAssertTrue(IBGBugReporting.autoScreenRecordingEnabled);
}

- (void) testgivenArgs$setAutoScreenRecordingDuration_whenQuery_thenShouldCallNativeApi {
  CGFloat duration = 12.3;
  [self.luciqBridge setAutoScreenRecordingDuration:duration];
  XCTAssertEqual(IBGBugReporting.autoScreenRecordingDuration, duration);
}

- (void) testgivenBoolean$setViewHierarchyEnabled_whenQuery_thenShouldCallNativeApi {
  BOOL enabled = true;
  [self.luciqBridge setViewHierarchyEnabled:enabled];
  XCTAssertTrue(IBGBugReporting.shouldCaptureViewHierarchy);
}

- (void) testSetDisclaimerText {
  id mock = OCMClassMock([IBGBugReporting class]);
  NSString *text = @"This is a disclaimer text!";

  OCMStub([mock setDisclaimerText:text]);
  [self.luciqBridge setDisclaimerText:text];
  OCMVerify([mock setDisclaimerText:text]);
}

- (void)testAddUserConsentWithKey {
  id mock = OCMClassMock([IBGBugReporting class]);

  NSString *key = @"testKey";
  NSString *description = @"Consent description";
  BOOL mandatory = YES;
  BOOL checked = NO;
  NSNumber *actionType = @2;
  IBGActionType mappedActionType = (IBGActionType)[actionType integerValue];

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
@end

