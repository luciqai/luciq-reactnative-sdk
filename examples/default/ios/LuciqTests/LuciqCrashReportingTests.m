#import <XCTest/XCTest.h>
#import "LuciqSDK/LuciqSDK.h"
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
  self.mCrashReporting = OCMClassMock([LCQCrashReporting class]);

}

- (void)testSetEnabled {

  [self.bridge setEnabled:NO];
  XCTAssertFalse(LCQCrashReporting.enabled);

  [self.bridge setEnabled:YES];
  XCTAssertTrue(LCQCrashReporting.enabled);

}

- (void)testSendJSCrash {
  NSDictionary *stackTrace = @{};

  XCTestExpectation *expectation = [self expectationWithDescription:@"Expected resolve to be called."];

  RCTPromiseResolveBlock resolve = ^(id result) {
    [expectation fulfill];
  };
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};

  [self.bridge sendJSCrash:stackTrace resolve:resolve reject:reject];

  [self waitForExpectations:@[expectation] timeout:1];
  OCMVerify([self.mCrashReporting cp_reportFatalCrashWithStackTrace:stackTrace]);
}

- (void)testSendNonFatalErrorJsonCrash {
  NSDictionary<NSString *,NSString * > *jsonCrash = @{};
  NSString *fingerPrint = @"fingerprint";
  RCTPromiseResolveBlock resolve = ^(id result) {};
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};
  NSDictionary *userAttributes = @{ @"key" : @"value",  };
  NSString *nonFatalLevel = [NSString stringWithFormat:@"%d", LCQNonFatalLevelInfo];


  [self.bridge sendHandledJSCrash:jsonCrash userAttributes:userAttributes  fingerprint:fingerPrint nonFatalExceptionLevel:nonFatalLevel resolve:resolve reject:reject];

    OCMVerify([self.mCrashReporting cp_reportNonFatalCrashWithStackTrace:jsonCrash
           level:LCQNonFatalLevelInfo
         groupingString:fingerPrint
        userAttributes:userAttributes
              ]);
}

@end
