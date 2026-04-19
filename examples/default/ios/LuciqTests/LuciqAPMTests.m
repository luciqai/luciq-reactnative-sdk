//
//  LuciqAPMTests.m
//  LuciqSampleTests
//
//  Created by Ali Abdelfattah on 12/12/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import <React/RCTBridgeModule.h>
#import "LuciqAPMBridge.h"
#import <LuciqSDK/LCQTypes.h>
#import <LuciqSDK/LCQAPM.h>
#import "LuciqSDK/LuciqSDK.h"
#import "LCQConstants.h"
#import "RNLuciq/LCQAPM+PrivateAPIs.h"

@interface LuciqAPMTests : XCTestCase
@property (nonatomic, retain) LuciqAPMBridge *luciqBridge;
@end

@protocol APMCPTestProtocol <NSObject>
/**
 * This protocol helps in correctly mapping APM mocked methods
 * when their method name matches another method in a different
 * module that differs in method signature.
 */
- (void)setEnabled:(BOOL)isEnabled;

@end

@protocol ExecutionTraceCPTestProtocol <NSObject>
/**
 * This protocol helps in correctly mapping LCQExecutionTrace mocked methods
 * when their method name matches another method in a different
 * module that differs in method signature.
 */
- (void)end;
@end

@implementation LuciqAPMTests

- (void)setUp {
    // Put setup code here. This method is called before the invocation of each test method in the class.
    self.luciqBridge = [[LuciqAPMBridge alloc] init];
}

/*
+------------------------------------------------------------------------+
|                            APM Module                              |
+------------------------------------------------------------------------+
*/

- (void) testSetAPMEnabled {
  id mock = OCMClassMock([LCQAPM class]);
  BOOL isEnabled = YES;

  OCMStub([mock setEnabled:isEnabled]);
  [self.luciqBridge setEnabled:isEnabled];
  OCMVerify([mock setEnabled:isEnabled]);
}

- (void) testSetAppLaunchEnabled {
  id mock = OCMClassMock([LCQAPM class]);
  BOOL isEnabled = YES;

  OCMStub([mock setColdAppLaunchEnabled:isEnabled]);
  [self.luciqBridge setAppLaunchEnabled:isEnabled];
  OCMVerify([mock setColdAppLaunchEnabled:isEnabled]);
}

- (void) testEndAppLaunch {
  id mock = OCMClassMock([LCQAPM class]);

  OCMStub([mock endAppLaunch]);
  [self.luciqBridge endAppLaunch];
  OCMVerify([mock endAppLaunch]);
}

- (void) testSetAutoUITraceEnabled {
  id mock = OCMClassMock([LCQAPM class]);
  BOOL isEnabled = YES;

  OCMStub([mock setAutoUITraceEnabled:isEnabled]);
  [self.luciqBridge setAutoUITraceEnabled:isEnabled];
  OCMVerify([mock setAutoUITraceEnabled:isEnabled]);
}


- (void) testStartFlow {
  id mock = OCMClassMock([LCQAPM class]);
  NSString* appFlowName = @"APP_Flow_1";

  [self.luciqBridge startFlow:appFlowName];
  OCMVerify([mock startFlowWithName:appFlowName]);
}

- (void) testEndFlow {
  id mock = OCMClassMock([LCQAPM class]);
  NSString* appFlowName = @"APP_Flow_1";

  [self.luciqBridge endFlow:appFlowName];
  OCMVerify([mock endFlowWithName:appFlowName]);
}

- (void) testSetFlowAttribute {
  id mock = OCMClassMock([LCQAPM class]);
  NSString* appFlowName = @"APP_Flow_1";
  NSString* attributeKey = @"Attribute_Key_1";
  NSString* attributeValue = @"Attribute_Value_1";

  [self.luciqBridge setFlowAttribute:appFlowName key:attributeKey value:attributeValue];
  OCMVerify([mock setAttributeForFlowWithName:appFlowName key:attributeKey value:attributeValue]);
}

- (void) testStartUITrace {
  id mock = OCMClassMock([LCQAPM class]);
  NSString* traceName = @"UITrace_1";

  OCMStub([mock startUITraceWithName:traceName]);
  [self.luciqBridge startUITrace:traceName];
  OCMVerify([mock startUITraceWithName:traceName]);
}

- (void) testEndUITrace {
  id mock = OCMClassMock([LCQAPM class]);

  OCMStub([mock endUITrace]);
  [self.luciqBridge endUITrace];
  OCMVerify([mock endUITrace]);
}

- (void) testSetScreenRenderEnabled {
    id mock = OCMClassMock([LCQAPM class]);
    BOOL isEnabled = YES;

    [self.luciqBridge setScreenRenderingEnabled:isEnabled];

    OCMVerify([mock setScreenRenderingEnabled:YES]);
}

- (void) testSetScreenRenderDisabled {
    id mock = OCMClassMock([LCQAPM class]);
    BOOL isEnabled = NO;

    [self.luciqBridge setScreenRenderingEnabled:isEnabled];

    OCMVerify([mock setScreenRenderingEnabled:NO]);
}

/*
+------------------------------------------------------------------------+
|                        Custom Span Tests                               |
+------------------------------------------------------------------------+
*/

- (void) testSyncCustomSpan {
    id mock = OCMClassMock([LCQAPM class]);
    NSString *spanName = @"TestCustomSpan";
    double startTimestamp = 1000000.0;  // 1 second in microseconds
    double endTimestamp = 2000000.0;    // 2 seconds in microseconds

    __block BOOL resolveWasCalled = NO;
    __block id resolvedValue = nil;

    RCTPromiseResolveBlock resolve = ^(id result) {
        resolveWasCalled = YES;
        resolvedValue = result;
    };

    RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {
        XCTFail(@"Reject should not be called");
    };

    [self.luciqBridge syncCustomSpan:spanName
                      startTimestamp:startTimestamp
                        endTimestamp:endTimestamp
                             resolve:resolve
                              reject:reject];

    OCMVerify([mock addCompletedCustomSpanWithName:spanName
                                         startDate:[OCMArg any]
                                           endDate:[OCMArg any]]);

    XCTAssertTrue(resolveWasCalled);
    XCTAssertEqualObjects(resolvedValue, @YES);
}

- (void) testSyncCustomSpanWithCorrectTimestampConversion {
    id mock = OCMClassMock([LCQAPM class]);
    NSString *spanName = @"TimestampConversionSpan";
    // 1609459200 seconds = Jan 1, 2021 00:00:00 UTC
    double startTimestamp = 1609459200000000.0;  // in microseconds
    double endTimestamp = 1609459205000000.0;    // 5 seconds later in microseconds

    __block NSDate *capturedStartDate = nil;
    __block NSDate *capturedEndDate = nil;

    OCMStub([mock addCompletedCustomSpanWithName:[OCMArg any]
                                       startDate:[OCMArg checkWithBlock:^BOOL(NSDate *date) {
        capturedStartDate = date;
        return YES;
    }]
                                         endDate:[OCMArg checkWithBlock:^BOOL(NSDate *date) {
        capturedEndDate = date;
        return YES;
    }]]);

    RCTPromiseResolveBlock resolve = ^(id result) {};
    RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};

    [self.luciqBridge syncCustomSpan:spanName
                      startTimestamp:startTimestamp
                        endTimestamp:endTimestamp
                             resolve:resolve
                              reject:reject];

    // Verify the timestamp conversion (microseconds to seconds)
    XCTAssertEqualWithAccuracy([capturedStartDate timeIntervalSince1970], 1609459200.0, 0.001);
    XCTAssertEqualWithAccuracy([capturedEndDate timeIntervalSince1970], 1609459205.0, 0.001);
}

- (void) testSyncCustomSpanWithZeroTimestamps {
    id mock = OCMClassMock([LCQAPM class]);
    NSString *spanName = @"ZeroTimestampSpan";
    double startTimestamp = 0.0;
    double endTimestamp = 0.0;

    __block BOOL resolveWasCalled = NO;

    RCTPromiseResolveBlock resolve = ^(id result) {
        resolveWasCalled = YES;
    };

    RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};

    [self.luciqBridge syncCustomSpan:spanName
                      startTimestamp:startTimestamp
                        endTimestamp:endTimestamp
                             resolve:resolve
                              reject:reject];

    OCMVerify([mock addCompletedCustomSpanWithName:spanName
                                         startDate:[OCMArg any]
                                           endDate:[OCMArg any]]);

    XCTAssertTrue(resolveWasCalled);
}

- (void) testIsCustomSpanEnabledReturnsTrue {
    id mock = OCMClassMock([LCQAPM class]);

    OCMStub([mock customSpansEnabled]).andReturn(YES);

    __block BOOL resolveWasCalled = NO;
    __block id resolvedValue = nil;

    RCTPromiseResolveBlock resolve = ^(id result) {
        resolveWasCalled = YES;
        resolvedValue = result;
    };

    RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {
        XCTFail(@"Reject should not be called");
    };

    [self.luciqBridge isCustomSpanEnabled:resolve reject:reject];

    XCTAssertTrue(resolveWasCalled);
    XCTAssertEqualObjects(resolvedValue, @YES);
}

- (void) testIsCustomSpanEnabledReturnsFalse {
    id mock = OCMClassMock([LCQAPM class]);

    OCMStub([mock customSpansEnabled]).andReturn(NO);

    __block BOOL resolveWasCalled = NO;
    __block id resolvedValue = nil;

    RCTPromiseResolveBlock resolve = ^(id result) {
        resolveWasCalled = YES;
        resolvedValue = result;
    };

    RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {
        XCTFail(@"Reject should not be called");
    };

    [self.luciqBridge isCustomSpanEnabled:resolve reject:reject];

    XCTAssertTrue(resolveWasCalled);
    XCTAssertEqualObjects(resolvedValue, @NO);
}

- (void) testIsAPMEnabledReturnsTrue {
    id mock = OCMClassMock([LCQAPM class]);

    OCMStub([mock enabled]).andReturn(YES);

    __block BOOL resolveWasCalled = NO;
    __block id resolvedValue = nil;

    RCTPromiseResolveBlock resolve = ^(id result) {
        resolveWasCalled = YES;
        resolvedValue = result;
    };

    RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {
        XCTFail(@"Reject should not be called");
    };

    [self.luciqBridge isAPMEnabled:resolve reject:reject];

    XCTAssertTrue(resolveWasCalled);
    XCTAssertEqualObjects(resolvedValue, @YES);
}

- (void) testIsAPMEnabledReturnsFalse {
    id mock = OCMClassMock([LCQAPM class]);

    OCMStub([mock enabled]).andReturn(NO);

    __block BOOL resolveWasCalled = NO;
    __block id resolvedValue = nil;

    RCTPromiseResolveBlock resolve = ^(id result) {
        resolveWasCalled = YES;
        resolvedValue = result;
    };

    RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {
        XCTFail(@"Reject should not be called");
    };

    [self.luciqBridge isAPMEnabled:resolve reject:reject];

    XCTAssertTrue(resolveWasCalled);
    XCTAssertEqualObjects(resolvedValue, @NO);
}

@end
