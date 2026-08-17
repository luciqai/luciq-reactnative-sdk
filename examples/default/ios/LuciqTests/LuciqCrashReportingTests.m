#import <XCTest/XCTest.h>
#import "LuciqSDK/LuciqSDK.h"
#import "LuciqCrashReportingBridge.h"
#import "LuciqJSHangProfiler.h"
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

  [self.bridge sendJSCrash:stackTrace resolver:resolve rejecter:reject];

  [self waitForExpectations:@[expectation] timeout:1];
  OCMVerify([self.mCrashReporting cp_reportFatalCrashWithStackTrace:stackTrace]);
}

- (void)testSendNonFatalErrorJsonCrash {
  NSDictionary<NSString *,NSString * > *jsonCrash = @{};
  NSString *fingerPrint = @"fingerprint";
  NSDictionary *userAttributes = @{ @"key" : @"value",  };
  LCQNonFatalLevel LCQNonFatalLevel = LCQNonFatalLevelInfo;

  XCTestExpectation *expectation = [self expectationWithDescription:@"Expected resolve to be called."];
  RCTPromiseResolveBlock resolve = ^(id result) {
    [expectation fulfill];
  };
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};

  [self.bridge sendHandledJSCrash:jsonCrash userAttributes:userAttributes  fingerprint:fingerPrint nonFatalExceptionLevel:LCQNonFatalLevel resolver:resolve rejecter:reject];

  [self waitForExpectations:@[expectation] timeout:1];
  OCMVerify([self.mCrashReporting cp_reportNonFatalCrashWithStackTrace:jsonCrash
           level:LCQNonFatalLevelInfo
         groupingString:fingerPrint
        userAttributes:userAttributes
              ]);
}

- (void)testJSHangCapabilitiesAreHonest {
  NSDictionary *capabilities = [self.bridge constantsToExport][@"jsHangCapabilities"];

  XCTAssertEqualObjects(capabilities[@"detection"], @"classic_bridge_only");
  XCTAssertEqualObjects(capabilities[@"bridgeless"], @"unavailable_no_verified_js_dispatch_contract");
  XCTAssertTrue([capabilities[@"stackCapture"] hasPrefix:@"available_"] ||
                [capabilities[@"stackCapture"] hasPrefix:@"unavailable_"]);
}

- (void)testJSHangProfileParsingIsBoundedAndDeletesIntermediate {
  NSString *path = [NSTemporaryDirectory() stringByAppendingPathComponent:NSUUID.UUID.UUIDString];
  NSDictionary *trace = @{
    @"samples" : @[ @{ @"sf" : @1 } ],
    @"stackFrames" : @{
      @"1" : @{ @"name" : @"blocked(main.jsbundle:12:34)", @"category" : @"JavaScript" },
    },
  };
  NSData *data = [NSJSONSerialization dataWithJSONObject:trace options:0 error:nil];
  XCTAssertTrue([data writeToFile:path atomically:YES]);

  NSArray<NSDictionary *> *frames =
      [LuciqJSHangProfiler culpritFramesFromTraceAtPath:path
                                             bundleName:@"main.jsbundle"
                                    sampleWindowSeconds:0];

  XCTAssertEqual(frames.count, 1);
  XCTAssertEqualObjects(frames.firstObject[@"methodName"], @"blocked");
  XCTAssertFalse([[NSFileManager defaultManager] fileExistsAtPath:path]);
}

- (void)testJSHangProfileParsingFiltersPostRecoverySamples {
  NSString *path = [NSTemporaryDirectory() stringByAppendingPathComponent:NSUUID.UUID.UUIDString];
  // Timestamps are microsecond deltas: the recovery frame is sampled more
  // often but falls outside the 1 s window, so the blocked frame must win.
  NSDictionary *trace = @{
    @"samples" : @[
      @{ @"sf" : @1, @"ts" : @0 },
      @{ @"sf" : @1, @"ts" : @500000 },
      @{ @"sf" : @2, @"ts" : @1500000 },
      @{ @"sf" : @2, @"ts" : @1600000 },
      @{ @"sf" : @2, @"ts" : @1700000 },
    ],
    @"stackFrames" : @{
      @"1" : @{ @"name" : @"blocked(main.jsbundle:12:34)", @"category" : @"JavaScript" },
      @"2" : @{ @"name" : @"recovery(main.jsbundle:56:78)", @"category" : @"JavaScript" },
    },
  };
  NSData *data = [NSJSONSerialization dataWithJSONObject:trace options:0 error:nil];
  XCTAssertTrue([data writeToFile:path atomically:YES]);

  NSArray<NSDictionary *> *frames =
      [LuciqJSHangProfiler culpritFramesFromTraceAtPath:path
                                             bundleName:@"main.jsbundle"
                                    sampleWindowSeconds:1];

  XCTAssertEqual(frames.count, 1);
  XCTAssertEqualObjects(frames.firstObject[@"methodName"], @"blocked");
}

@end
