//
//  LuciqRepliesTests.m
//  LuciqSampleTests
//
//  Created by Salma Ali on 7/31/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import "LuciqRepliesBridge.h"
#import <LuciqSDK/LCQTypes.h>
#import "LuciqSDK/LuciqSDK.h"
#import "LCQConstants.h"

@interface LuciqRepliesTests : XCTestCase
@property (nonatomic, retain) LuciqRepliesBridge *luciqBridge;
@end

@implementation LuciqRepliesTests

- (void)setUp {
  // Put setup code here. This method is called before the invocation of each test method in the class.
  self.luciqBridge = [[LuciqRepliesBridge alloc] init];
}

/*
 +------------------------------------------------------------------------+
 |                              Replies module                            |
 +------------------------------------------------------------------------+
 */


- (void) testgivenBoolean$setEnabled_whenQuery_thenShouldCallNativeApi {
  BOOL enabled = false;
  [self.luciqBridge setEnabled:enabled];
  XCTAssertFalse(LCQReplies.enabled);
}

// Since there is no way to check the invocation of the block 'callback' inside the block, 'LCQReplies.enabled' is set to false
// and the value is checked after callback execution to verify.
- (void) testgivenCallback$hasChats_whenQuery_thenShouldCallNativeApi {
  LCQReplies.enabled = true;
  RCTPromiseResolveBlock resolve = ^(id result) { LCQReplies.enabled = false; };
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};
  [self.luciqBridge hasChats:resolve :reject];
  XCTAssertFalse(LCQReplies.enabled);
}


- (void) testgiven$show_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQReplies class]);
  OCMStub([mock show]);
  [self.luciqBridge show];
  XCTestExpectation *expectation = [self expectationWithDescription:@"Test ME PLX"];

  [[NSRunLoop mainRunLoop] performBlock:^{
    OCMVerify([mock show]);
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:EXPECTATION_TIMEOUT handler:nil];
}

- (void) testgivenOnNewReplyReceivedHandler$setOnNewReplyReceivedCallback_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  [partialMock setOnNewReplyReceivedHandler];
  XCTAssertNotNil(LCQReplies.didReceiveReplyHandler);

  OCMStub([partialMock sendEventWithName:@"LCQOnNewReplyReceivedCallback" body:nil]);
  LCQReplies.didReceiveReplyHandler();
  OCMVerify([partialMock sendEventWithName:@"LCQOnNewReplyReceivedCallback" body:nil]);
}

- (void) testgivenCallback$getUnreadRepliesCount_whenQuery_thenShouldCallNativeApi {
  LCQReplies.enabled = true;
  RCTPromiseResolveBlock resolve = ^(id result) { LCQReplies.enabled = false; };
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};
  [self.luciqBridge getUnreadRepliesCount:resolve :reject];
  XCTAssertFalse(LCQReplies.enabled);
}

- (void) testgivenBoolean$setInAppNotificationEnabled_whenQuery_thenShouldCallNativeApi {
  BOOL enabled = false;
  [self.luciqBridge setInAppNotificationEnabled:enabled];
  XCTAssertFalse(LCQReplies.inAppNotificationsEnabled);
}

- (void)testSetPushNotificationsEnabled {
  id mock = OCMClassMock([LCQReplies class]);
  BOOL isPushNotificationEnabled = true;

  OCMStub([mock setPushNotificationsEnabled:isPushNotificationEnabled]);
  [self.luciqBridge setPushNotificationsEnabled:isPushNotificationEnabled];
  OCMVerify([mock setPushNotificationsEnabled:isPushNotificationEnabled]);
}


@end

