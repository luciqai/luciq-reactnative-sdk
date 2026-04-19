//
//  LuciqFeatureRequestsTests.m
//  LuciqSampleTests
//
//  Created by Salma Ali on 7/31/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import "LuciqFeatureRequestsBridge.h"
#import <LuciqSDK/LCQTypes.h>
#import "LuciqSDK/LuciqSDK.h"
#import "LCQConstants.h"

@interface LuciqFeatureRequestsTests : XCTestCase
@property (nonatomic, retain) LuciqFeatureRequestsBridge *luciqBridge;
@end

@implementation LuciqFeatureRequestsTests

- (void)setUp {
  // Put setup code here. This method is called before the invocation of each test method in the class.
  self.luciqBridge = [[LuciqFeatureRequestsBridge alloc] init];
}

/*
 +------------------------------------------------------------------------+
 |                              Feature Requets Module                    |
 +------------------------------------------------------------------------+
 */

- (void) testgivenArgs$setEmailFieldRequiredForFeatureRequests_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQFeatureRequests class]);
  BOOL required = true;
  NSArray *actionTypesArray = [NSArray arrayWithObjects:  @(LCQActionReportBug), nil];
  LCQAction actionTypes = 0;
  for (NSNumber *boxedValue in actionTypesArray) {
    actionTypes |= [boxedValue intValue];
  }
  OCMStub([mock setEmailFieldRequired:required forAction:actionTypes]);
  [self.luciqBridge setEmailFieldRequiredForFeatureRequests:required types:actionTypesArray];
  OCMVerify([mock setEmailFieldRequired:required forAction:actionTypes]);
}

- (void) testgive$show_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQFeatureRequests class]);
  OCMStub([mock show]);
  [self.luciqBridge show];
  XCTestExpectation *expectation = [self expectationWithDescription:@"Test ME PLX"];

  [[NSRunLoop mainRunLoop] performBlock:^{
    OCMVerify([mock show]);
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:EXPECTATION_TIMEOUT handler:nil];
}

- (void) testgivenBoolean$setEnabled_whenQuery_thenShouldCallNativeApi {
  BOOL enabled = false;
  [self.luciqBridge setEnabled:enabled];
  XCTAssertFalse(LCQFeatureRequests.enabled);
}


@end

