#import <XCTest/XCTest.h>
#import "InstabugSDK/InstabugSDK.h"
#import "LuciqCrashReportingBridge.h"
#import "OCMock/OCMock.h"
#import "Util/LCQCrashReporting+CP.h"

@interface LuciqCrashReportingTests : XCTestCase
@property (nonatomic, retain) LuciqCrashReportingBridge *bridge;
@property (nonatomic, strong) id mCrashReporting;

@end

@implementation LuciqCrashReportingTests

- (void)setUp {
  self.bridge = [[LuciqCrashReportingBridge alloc] init];
  self.mCrashReporting = OCMClassMock([IBGCrashReporting class]);

}

- (void)testSetEnabled {

  [self.bridge setEnabled:NO];
  XCTAssertFalse(IBGCrashReporting.enabled);

  [self.bridge setEnabled:YES];
  XCTAssertTrue(IBGCrashReporting.enabled);

}

- (void)testSendJSCrash {
  NSDictionary *stackTrace = @{};

  XCTestExpectation *expectation = [self expectationWithDescription:@"Expected resolve to be called."];

  RCTPromiseResolveBlock resolve = ^(id result) {
    [expectation fulfill];
  };
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};

  [self.bridge sendJSCrash:stackTrace resolver:resolve rejecter:reject];

  [self waitForExpectations:@[expectation] timeout:1];
  OCMVerify([self.mCrashReporting cp_reportFatalCrashWithStackTrace:stackTrace]);
}

- (void)testSendNonFatalErrorJsonCrash {
  NSDictionary<NSString *,NSString * > *jsonCrash = @{};
  NSString *fingerPrint = @"fingerprint";
  RCTPromiseResolveBlock resolve = ^(id result) {};
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};
  NSDictionary *userAttributes = @{ @"key" : @"value",  };
  IBGNonFatalLevel LCQNonFatalLevel = IBGNonFatalLevelInfo;


  [self.bridge sendHandledJSCrash:jsonCrash userAttributes:userAttributes  fingerprint:fingerPrint nonFatalExceptionLevel:LCQNonFatalLevel resolver:resolve rejecter:reject];

    OCMVerify([self.mCrashReporting cp_reportNonFatalCrashWithStackTrace:jsonCrash
           level:IBGNonFatalLevelInfo
         groupingString:fingerPrint
        userAttributes:userAttributes
              ]);
}

@end
