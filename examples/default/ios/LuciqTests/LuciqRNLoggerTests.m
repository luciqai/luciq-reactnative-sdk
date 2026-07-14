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

// redactURL: mirrors test/utils/redactUrlForLog.spec.ts so the JS and iOS
// implementations stay observable through equivalent unit tests.

- (void)testRedactURL_returnsEmptyForNil {
    XCTAssertEqualObjects(@"", [LuciqRNLogger redactURL:nil]);
}

- (void)testRedactURL_returnsEmptyForEmpty {
    XCTAssertEqualObjects(@"", [LuciqRNLogger redactURL:@""]);
}

- (void)testRedactURL_preservesUrlWithoutQueryOrFragment {
    XCTAssertEqualObjects(@"https://api.example.com/users/123",
                          [LuciqRNLogger redactURL:@"https://api.example.com/users/123"]);
    XCTAssertEqualObjects(@"https://api.example.com/v1/users/123/orders/456",
                          [LuciqRNLogger redactURL:@"https://api.example.com/v1/users/123/orders/456"]);
    XCTAssertEqualObjects(@"http://localhost:8081/symbolicate",
                          [LuciqRNLogger redactURL:@"http://localhost:8081/symbolicate"]);
}

- (void)testRedactURL_stripsSimpleQueryAndAppendsMarker {
    XCTAssertEqualObjects(@"https://api.example.com/users?<redacted>",
                          [LuciqRNLogger redactURL:@"https://api.example.com/users?email=u@x.com"]);
}

- (void)testRedactURL_stripsMultiParamQuery {
    XCTAssertEqualObjects(@"https://api.example.com/auth?<redacted>",
                          [LuciqRNLogger redactURL:@"https://api.example.com/auth?token=abc&user=12345&hash=xyz"]);
}

- (void)testRedactURL_stripsTrailingQuestionMark {
    XCTAssertEqualObjects(@"https://api.example.com/users?<redacted>",
                          [LuciqRNLogger redactURL:@"https://api.example.com/users?"]);
}

- (void)testRedactURL_neverLeaksSensitiveQueryValue {
    NSString *sensitive = @"super-secret-token-value-9876";
    NSString *input = [NSString stringWithFormat:@"https://api.example.com/users?token=%@", sensitive];
    NSString *result = [LuciqRNLogger redactURL:input];
    XCTAssertFalse([result containsString:sensitive]);
    XCTAssertFalse([result containsString:@"token="]);
}

- (void)testRedactURL_stripsFragmentSilently {
    XCTAssertEqualObjects(@"https://app.example.com/page",
                          [LuciqRNLogger redactURL:@"https://app.example.com/page#section-2"]);
}

- (void)testRedactURL_stripsFragmentWithSensitiveData {
    NSString *result = [LuciqRNLogger redactURL:@"https://app.example.com/page#access_token=abc"];
    XCTAssertEqualObjects(@"https://app.example.com/page", result);
    XCTAssertFalse([result containsString:@"abc"]);
    XCTAssertFalse([result containsString:@"access_token"]);
}

- (void)testRedactURL_cutsAtQueryWhenQueryComesFirst {
    XCTAssertEqualObjects(@"https://api.example.com/users?<redacted>",
                          [LuciqRNLogger redactURL:@"https://api.example.com/users?email=u@x.com#anchor"]);
}

- (void)testRedactURL_cutsAtFragmentWhenFragmentComesFirst {
    // Pathological but technically possible: fragment before query.
    XCTAssertEqualObjects(@"https://app.example.com/page",
                          [LuciqRNLogger redactURL:@"https://app.example.com/page#frag?fake"]);
}

- (void)testRedactURL_stripsUserPasswordFromAuthority {
    XCTAssertEqualObjects(@"https://api.example.com/users/123",
                          [LuciqRNLogger redactURL:@"https://user:pass@api.example.com/users/123"]);
}

- (void)testRedactURL_stripsUsernameOnlyUserinfo {
    XCTAssertEqualObjects(@"https://api.example.com/users",
                          [LuciqRNLogger redactURL:@"https://alice@api.example.com/users"]);
}

- (void)testRedactURL_neverLeaksPassword {
    NSString *secret = @"p@ssw0rd-do-not-leak";
    NSString *input = [NSString stringWithFormat:@"https://user:%@@api.example.com/x", secret];
    NSString *result = [LuciqRNLogger redactURL:input];
    XCTAssertFalse([result containsString:secret]);
    XCTAssertFalse([result containsString:@"user:"]);
}

- (void)testRedactURL_stripsUserinfoAndQueryTogether {
    XCTAssertEqualObjects(@"https://api.example.com/users?<redacted>",
                          [LuciqRNLogger redactURL:@"https://u:p@api.example.com/users?token=abc"]);
}

- (void)testRedactURL_doesNotStripAtInPath {
    // No userinfo present; the `@` is part of the path segment.
    XCTAssertEqualObjects(@"https://api.example.com/users/@me/profile",
                          [LuciqRNLogger redactURL:@"https://api.example.com/users/@me/profile"]);
}

- (void)testRedactURL_noSchemeIsNoOpForUserinfo {
    // No `://`, so no authority parsing happens.
    XCTAssertEqualObjects(@"user@host/path",
                          [LuciqRNLogger redactURL:@"user@host/path"]);
}

- (void)testRedactURL_neverReturnsUnredactedQueryParamValue {
    NSArray<NSString *> *inputs = @[
        @"https://x.com/p?a=1",
        @"https://x.com/p?a=1&b=2",
        @"https://x.com/p#frag",
        @"https://x.com/p?a=1#frag",
        @"http://localhost:1234/foo?bar=baz",
    ];
    for (NSString *url in inputs) {
        NSString *out = [LuciqRNLogger redactURL:url];
        XCTAssertFalse([out containsString:@"="], @"query '=' should not leak: %@", url);
        XCTAssertFalse([out containsString:@"#"], @"fragment '#' should not leak: %@", url);
    }
}

@end
