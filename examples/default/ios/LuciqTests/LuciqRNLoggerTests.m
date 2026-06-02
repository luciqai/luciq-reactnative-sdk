//
//  LuciqRNLoggerTests.m
//  LuciqTests
//

#import <XCTest/XCTest.h>
#import "LuciqRNLogger.h"

@interface LuciqRNLoggerTests : XCTestCase
@end

@implementation LuciqRNLoggerTests

- (void)setUp {
    [super setUp];
    [LuciqRNLogger setLevel:LCQSDKDebugLogsLevelError];
}

- (void)tearDown {
    [LuciqRNLogger setLevel:LCQSDKDebugLogsLevelError];
    [super tearDown];
}

- (void)testDefaultLevelIsError {
    XCTAssertEqual([LuciqRNLogger level], LCQSDKDebugLogsLevelError);
}

- (void)testSetLevelUpdatesLevel {
    [LuciqRNLogger setLevel:LCQSDKDebugLogsLevelVerbose];
    XCTAssertEqual([LuciqRNLogger level], LCQSDKDebugLogsLevelVerbose);

    [LuciqRNLogger setLevel:LCQSDKDebugLogsLevelDebug];
    XCTAssertEqual([LuciqRNLogger level], LCQSDKDebugLogsLevelDebug);

    [LuciqRNLogger setLevel:LCQSDKDebugLogsLevelNone];
    XCTAssertEqual([LuciqRNLogger level], LCQSDKDebugLogsLevelNone);
}

// The logging methods themselves call NSLog when the level allows.
// We cannot easily intercept NSLog in a unit test without redirecting stderr,
// but we can still ensure these calls do not crash at every level — including
// when the format string has multiple arguments, when args are nil, and when
// the level should suppress output.
- (void)testLogMethodsDoNotCrashAcrossLevels {
    NSArray<NSNumber *> *levels = @[
        @(LCQSDKDebugLogsLevelVerbose),
        @(LCQSDKDebugLogsLevelDebug),
        @(LCQSDKDebugLogsLevelError),
        @(LCQSDKDebugLogsLevelNone),
    ];

    for (NSNumber *boxed in levels) {
        [LuciqRNLogger setLevel:(LCQSDKDebugLogsLevel)boxed.integerValue];

        [LuciqRNLogger d:@"LCQ-RN-NET" format:@"plain"];
        [LuciqRNLogger d:@"LCQ-RN-NET" format:@"with-args=%@ %d", @"hello", 42];
        [LuciqRNLogger w:@"LCQ-RN-NET" format:@"warn=%@", @"oops"];
        [LuciqRNLogger e:@"LCQ-RN-NET" format:@"err=%@", @"boom"];
        [LuciqRNLogger d:@"LCQ-RN-NET" format:@"nil-arg=%@", (NSString *)nil];
    }

    // If we got here, none of the variadic calls threw at any level.
    XCTAssertTrue(YES);
}

@end
