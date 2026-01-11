//
//  LuciqAPMTests.m
//  LuciqSampleTests
//
//  Created by Ali Abdelfattah on 12/12/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
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

  [self.luciqBridge setFlowAttribute:appFlowName :attributeKey :attributeValue];
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

@end
