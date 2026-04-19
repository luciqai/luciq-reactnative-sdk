#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import "LuciqSessionReplayBridge.h"
#import <LuciqSDK/LCQTypes.h>
#import "LuciqSDK/LuciqSDK.h"
#import "LCQConstants.h"

@interface LuciqSessionReplayTests : XCTestCase

@property (nonatomic, strong) id mSessionReplay;
@property (nonatomic, strong) LuciqSessionReplayBridge *bridge;

@end

@implementation LuciqSessionReplayTests


- (void)setUp {
  self.mSessionReplay = OCMClassMock([LCQSessionReplay class]);
  self.bridge = [[LuciqSessionReplayBridge alloc] init];
}

- (void)testSetEnabled {
  BOOL enabled = NO;

  [self.bridge setEnabled:enabled];

  OCMVerify([self.mSessionReplay setEnabled:enabled]);
}

- (void)testSetLuciqLogsEnabled {
  BOOL enabled = NO;

  [self.bridge setLuciqLogsEnabled:enabled];

  OCMVerify([self.mSessionReplay setLCQLogsEnabled:enabled]);
}

- (void)testSetNetworkLogsEnabled {
  BOOL enabled = NO;

  [self.bridge setNetworkLogsEnabled:enabled];

  OCMVerify([self.mSessionReplay setNetworkLogsEnabled:enabled]);
}

- (void)testSetUserStepsEnabled {
  BOOL enabled = NO;

  [self.bridge setUserStepsEnabled:enabled];

  OCMVerify([self.mSessionReplay setUserStepsEnabled:enabled]);
}

- (void)testGetSessionReplayLink {
    NSString *link = @"link";
    XCTestExpectation *expectation = [self expectationWithDescription:@"Call completion handler"];

    RCTPromiseResolveBlock resolve = ^(NSString *result) {
        [expectation fulfill];
        XCTAssertEqualObjects(result, link);
    };

    RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {
    };
    OCMStub([self.mSessionReplay sessionReplayLink]).andReturn(link);
    [self.bridge getSessionReplayLink:resolve reject:reject];
    OCMVerify([self.mSessionReplay sessionReplayLink]);
    [self waitForExpectations:@[expectation] timeout:5.0];
}

- (void)testSetSyncCallback {
    id mockMetadata = OCMClassMock([LCQSessionMetadata class]);
    id mockNetworkLog = OCMClassMock([LCQSessionMetadataNetworkLogs class]);
    id partialMock = OCMPartialMock(self.bridge);

    XCTestExpectation *completionExpectation = [self expectationWithDescription:@"Completion block should be called with the expected value"];

    BOOL expectedValue = YES;
    __block BOOL actualValue = NO;

    OCMStub([mockNetworkLog url]).andReturn(@"http://example.com");
    OCMStub([mockNetworkLog statusCode]).andReturn(200);

    OCMStub([mockMetadata device]).andReturn(@"ipohne");
    OCMStub([mockMetadata os]).andReturn(@"ios");
    OCMStub([mockMetadata appVersion]).andReturn(@"13.4.1");
    OCMStub([mockMetadata sessionDuration]).andReturn(20);
    OCMStub([mockMetadata hasLinkToAppReview]).andReturn(NO);
    OCMStub([mockMetadata launchType]).andReturn(LaunchTypeCold);
    OCMStub([mockMetadata launchDuration]).andReturn(20);
    OCMStub([mockMetadata bugsCount]).andReturn(10);
    OCMStub([mockMetadata fatalCrashCount]).andReturn(10);
    OCMStub([mockMetadata oomCrashCount]).andReturn(10);
    OCMStub([mockMetadata networkLogs]).andReturn(@[mockNetworkLog]);

    SessionEvaluationCompletion sessionEvaluationCompletion = ^(BOOL shouldSync) {
        actualValue = shouldSync;
        [completionExpectation fulfill];
    };

  OCMStub([self.mSessionReplay setSyncCallbackWithHandler:[OCMArg checkWithBlock: ^BOOL(void(^handler)(LCQSessionMetadata *metadataObject, SessionEvaluationCompletion completion)) {
      handler(mockMetadata, sessionEvaluationCompletion);
      return YES;
  }]]);

    OCMStub([partialMock sendEventWithName:@"LCQSessionReplayOnSyncCallback" body:OCMArg.any]).andDo(^(NSInvocation *invocation) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.3 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self.bridge evaluateSync:expectedValue];

      });
    });




    RCTPromiseResolveBlock syncResolve = ^(id result) {};
    RCTPromiseRejectBlock syncReject = ^(NSString *code, NSString *message, NSError *error) {};
    [self.bridge setSyncCallback:syncResolve reject:syncReject];
    [self waitForExpectationsWithTimeout:2 handler:nil];

    OCMVerify([partialMock sendEventWithName:@"LCQSessionReplayOnSyncCallback" body:OCMArg.any]);
    OCMVerifyAll(self.mSessionReplay);
    XCTAssertEqual(actualValue, expectedValue);
  }

- (void)testSetCapturingModeNavigation {
  [self.bridge setCapturingMode:[NSString stringWithFormat:@"%ld", (long)LCQScreenshotCapturingModeNavigation]];

  OCMVerify([self.mSessionReplay setScreenshotCapturingMode:LCQScreenshotCapturingModeNavigation]);
}

- (void)testSetCapturingModeInteractions {
  [self.bridge setCapturingMode:[NSString stringWithFormat:@"%ld", (long)LCQScreenshotCapturingModeInteraction]];

  OCMVerify([self.mSessionReplay setScreenshotCapturingMode:LCQScreenshotCapturingModeInteraction]);
}

- (void)testSetCapturingModeFrequency {
  [self.bridge setCapturingMode:[NSString stringWithFormat:@"%ld", (long)LCQScreenshotCapturingModeFrequency]];

  OCMVerify([self.mSessionReplay setScreenshotCapturingMode:LCQScreenshotCapturingModeFrequency]);
}

- (void)testSetScreenshotQualityHigh {
  [self.bridge setScreenshotQuality:[NSString stringWithFormat:@"%ld", (long)LCQScreenshotQualityModeHigh]];

  OCMVerify([self.mSessionReplay setScreenshotQualityMode:LCQScreenshotQualityModeHigh]);
}

- (void)testSetScreenshotQualityNormal {
  [self.bridge setScreenshotQuality:[NSString stringWithFormat:@"%ld", (long)LCQScreenshotQualityModeNormal]];

  OCMVerify([self.mSessionReplay setScreenshotQualityMode:LCQScreenshotQualityModeNormal]);
}

- (void)testSetScreenshotQualityGreyscale {
  [self.bridge setScreenshotQuality:[NSString stringWithFormat:@"%ld", (long)LCQScreenshotQualityModeGreyScale]];

  OCMVerify([self.mSessionReplay setScreenshotQualityMode:LCQScreenshotQualityModeGreyScale]);
}

- (void)testSetScreenshotCaptureInterval {
  NSInteger interval = 1000;

  [self.bridge setScreenshotCaptureInterval:(double)interval];

  Class sdkClassMock = self.mSessionReplay;
  OCMVerify([sdkClassMock setScreenshotCaptureInterval:interval]);
}

- (void)testSetScreenshotCaptureIntervalMinimum {
  NSInteger interval = 500;

  [self.bridge setScreenshotCaptureInterval:(double)interval];

  Class sdkClassMock = self.mSessionReplay;
  OCMVerify([sdkClassMock setScreenshotCaptureInterval:interval]);
}

@end
