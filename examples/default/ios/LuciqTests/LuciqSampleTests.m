/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import "LuciqSDK/LuciqSDK.h"
#import "LuciqReactBridge.h"
#import <LuciqSDK/LCQTypes.h>
#import "LCQConstants.h"
#import "RNLuciq.h"
#import <RNLuciq/LCQNetworkLogger+CP.h>

@protocol LuciqCPTestProtocol <NSObject>
/**
 * This protocol helps in correctly mapping Luciq mocked methods
 * when their method name matches another method in a different
 * module that differs in method signature.
 */
- (void)startWithToken:(NSString *)token invocationEvents:(LCQInvocationEvent)invocationEvents;
- (void)setLocale:(LCQLocale)locale;

@end

@protocol SurveysCPTestProtocol <NSObject>
/**
 * This protocol helps in correctly mapping Surveys mocked methods
 * when their method name matches another method in a different
 * module that differs in method signature.
 */
- (void)setEnabled:(BOOL)isEnabled;

@end

@interface LuciqSampleTests : XCTestCase
@property (nonatomic, retain) LuciqReactBridge *luciqBridge;
@property (nonatomic, retain) id mRNLuciq;
@end

@implementation LuciqSampleTests


- (void)setUp {
  // Put setup code here. This method is called before the invocation of each test method in the class.
  self.luciqBridge = [[LuciqReactBridge alloc] init];
  self.mRNLuciq = OCMClassMock([RNLuciq class]);
}

/*
 +------------------------------------------------------------------------+
 |                            Luciq Module                             |
 +------------------------------------------------------------------------+
 */

- (void)testSetEnabled {
  id mock = OCMClassMock([Luciq class]);
  BOOL isEnabled = true;

  OCMStub([mock setEnabled:isEnabled]);
  [self.luciqBridge setEnabled:isEnabled];
  OCMVerify([mock setEnabled:isEnabled]);
}

- (void)testInit {
  id mock = OCMClassMock([Luciq class]);
  LCQInvocationEvent floatingButtonInvocationEvent = LCQInvocationEventFloatingButton;
  NSString *appToken = @"app_token";
  NSString *codePushVersion = @"1.0.0(1)";
  NSString *appVariant = @"variant 1";

  NSArray *invocationEvents = [NSArray arrayWithObjects:[NSNumber numberWithInteger:floatingButtonInvocationEvent], nil];
  NSDictionary *overAirVersion = @{
    @"service":@"expo",
    @"version":@"D0A12345-6789-4B3C-A123-4567ABCDEF01"
  };
  BOOL useNativeNetworkInterception = YES;
  LCQSDKDebugLogsLevel sdkDebugLogsLevel = LCQSDKDebugLogsLevelDebug;
  LCQOverAirType service = [ArgsRegistry.overAirServices[overAirVersion[@"service"]] intValue];

  OCMStub([mock setCodePushVersion:codePushVersion]);
  OCMStub([mock setOverAirVersion:overAirVersion[@"version"] withType:service]);

  [self.luciqBridge init:appToken invocationEvents:invocationEvents debugLogsLevel:sdkDebugLogsLevel useNativeNetworkInterception:useNativeNetworkInterception codePushVersion:codePushVersion appVariant:appVariant  options:nil  overAirVersion:overAirVersion ];
  OCMVerify([mock setCodePushVersion:codePushVersion]);

  OCMVerify([mock setOverAirVersion:overAirVersion[@"version"] withType:[overAirVersion[@"service"] intValue]]);


  XCTAssertEqual(Luciq.appVariant, appVariant);

  OCMVerify([self.mRNLuciq initWithToken:appToken invocationEvents:floatingButtonInvocationEvent debugLogsLevel:sdkDebugLogsLevel useNativeNetworkInterception:useNativeNetworkInterception]);
}

- (void)test {
  id mock = OCMClassMock([Luciq class]);
  NSString *codePushVersion = @"123";

  [self.luciqBridge setCodePushVersion:codePushVersion];

  OCMVerify([mock setCodePushVersion:codePushVersion]);
}

- (void)testSetOverAirVersion {
  id mock = OCMClassMock([Luciq class]);
  NSDictionary *overAirVersion = @{
    @"service":@"expo",
    @"version":@"D0A12345-6789-4B3C-A123-4567ABCDEF01"
  };

  [self.luciqBridge setOverAirVersion:overAirVersion];

  LCQOverAirType service = [ArgsRegistry.overAirServices[overAirVersion[@"service"]] intValue];

  OCMVerify([mock setOverAirVersion:overAirVersion[@"version"] withType:[overAirVersion[@"service"] intValue]]);
}

- (void)testSetUserData {
  id mock = OCMClassMock([Luciq class]);
  NSString *userData = @"user_data";

  OCMStub([mock setUserData:userData]);
  [self.luciqBridge setUserData:userData];
  OCMVerify([mock setUserData:userData]);
}

- (void)testSetAppVariant {
  id mock = OCMClassMock([Luciq class]);
  NSString *appVariant = @"appVariant";

  [self.luciqBridge setAppVariant: appVariant];
  XCTAssertEqual(Luciq.appVariant, appVariant);
}

- (void)testSetTrackUserSteps {
  id mock = OCMClassMock([Luciq class]);
  BOOL isEnabled = true;

  OCMStub([mock setTrackUserSteps:isEnabled]);
  [self.luciqBridge setTrackUserSteps:isEnabled];
  OCMVerify([mock setTrackUserSteps:isEnabled]);
}

- (void)testSetSessionProfilerEnabled {
  id mock = OCMClassMock([Luciq class]);
  BOOL sessionProfilerEnabled = true;

  OCMStub([mock setSessionProfilerEnabled:sessionProfilerEnabled]);
  [self.luciqBridge setSessionProfilerEnabled:sessionProfilerEnabled];
  OCMVerify([mock setSessionProfilerEnabled:sessionProfilerEnabled]);
}

- (void)testSetLocale {
  id<LuciqCPTestProtocol> mock = OCMClassMock([Luciq class]);

  OCMStub([mock setLocale:LCQLocaleCzech]);
  [self.luciqBridge setLocale:LCQLocaleCzech];
  OCMVerify([mock setLocale:LCQLocaleCzech]);
}

- (void)testSetColorTheme {
  id mock = OCMClassMock([Luciq class]);
  LCQColorTheme colorTheme = LCQColorThemeLight;
  XCTestExpectation *expectation = [self expectationWithDescription:@"Testing [Luciq setColorTheme]"];

  OCMStub([mock setColorTheme:colorTheme]);
  [self.luciqBridge setColorTheme:colorTheme];

  [[NSRunLoop mainRunLoop] performBlock:^{
    OCMVerify([mock setColorTheme:colorTheme]);
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:EXPECTATION_TIMEOUT handler:nil];
}

- (void)testAppendTags {
  id mock = OCMClassMock([Luciq class]);
  NSArray *tags = @[@"tag1", @"tag2"];

  OCMStub([mock appendTags:tags]);
  [self.luciqBridge appendTags:tags];
  OCMVerify([mock appendTags:tags]);
}

- (void)testResetTags {
  id mock = OCMClassMock([Luciq class]);

  OCMStub([mock resetTags]);
  [self.luciqBridge resetTags];
  OCMVerify([mock resetTags]);
}

- (void)testGetTags {
  id mock = OCMClassMock([Luciq class]);
  RCTPromiseResolveBlock resolve = ^(id result) {};
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};
  NSDictionary *dictionary = @{ @"someKey" : @"someValue" };

  OCMStub([mock getTags]).andReturn(dictionary);
  [self.luciqBridge getTags:resolve :reject];
  OCMVerify([mock getTags]);
}

- (void)testSetString {
  id mock = OCMClassMock([Luciq class]);
  NSString *value = @"string_value";
  NSString *key = @"KEY";

  OCMStub([mock setValue:value forStringWithKey:key]);
  [self.luciqBridge setString:value toKey:key];
  OCMVerify([mock setValue:value forStringWithKey:key]);
}

- (void)testIdentifyUser {
  id mock = OCMClassMock([Luciq class]);
  NSString *email = @"em@il.com";
  NSString *name = @"this is my name";

  OCMStub([mock identifyUserWithID:nil email:email name:name]);
  [self.luciqBridge identifyUser:email name:name userId:nil];
  OCMVerify([mock identifyUserWithID:nil email:email name:name]);
}

- (void)testIdentifyUserWithID {
  id mock = OCMClassMock([Luciq class]);
  NSString *email = @"em@il.com";
  NSString *name = @"this is my name";
  NSString *userId = @"this is my id";

  OCMStub([mock identifyUserWithID:userId email:email name:name]);
  [self.luciqBridge identifyUser:email name:name userId:userId];
  OCMVerify([mock identifyUserWithID:userId email:email name:name]);
}

- (void)testLogOut {
  id mock = OCMClassMock([Luciq class]);

  OCMStub([mock logOut]);
  [self.luciqBridge logOut];
  OCMVerify([mock logOut]);
}

- (void)testLogUserEvent {
  id mock = OCMClassMock([Luciq class]);
  NSString *name = @"event name";

  OCMStub([mock logUserEventWithName:name]);
  [self.luciqBridge logUserEvent:name];
  OCMVerify([mock logUserEventWithName:name]);
}

- (void)testSetReproStepsConfig {
  id mock = OCMClassMock([Luciq class]);
  LCQUserStepsMode bugMode = LCQUserStepsModeDisable;
  LCQUserStepsMode crashMode = LCQUserStepsModeEnable;
  LCQUserStepsMode sessionReplayMode = LCQUserStepsModeEnabledWithNoScreenshots;

  [self.luciqBridge setReproStepsConfig:bugMode :crashMode :sessionReplayMode];

  OCMVerify([mock setReproStepsFor:LCQIssueTypeBug withMode:bugMode]);
  OCMVerify([mock setReproStepsFor:LCQIssueTypeAllCrashes withMode:crashMode]);
 OCMVerify([mock setReproStepsFor:LCQIssueTypeSessionReplay withMode:sessionReplayMode]);
}

- (void)testSetUserAttribute {
  id mock = OCMClassMock([Luciq class]);
  NSString *key = @"key";
  NSString *value = @"value";

  OCMStub([mock setUserAttribute:value withKey:key]);
  [self.luciqBridge setUserAttribute:key withValue:value];
  OCMVerify([mock setUserAttribute:value withKey:key]);
}

- (void)testGetUserAttribute {
  id mock = OCMClassMock([Luciq class]);
  NSString *key = @"someKey";
  RCTPromiseResolveBlock resolve = ^(id result) {};
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};

  OCMStub([mock userAttributeForKey:key]).andReturn(@"someValue");
  [self.luciqBridge getUserAttribute:key :resolve :reject];
  OCMVerify([mock userAttributeForKey:key]);
}

- (void)testRemoveUserAttribute {
  id mock = OCMClassMock([Luciq class]);
  NSString *key = @"someKey";

  OCMStub([mock removeUserAttributeForKey:key]);
  [self.luciqBridge removeUserAttribute:key];
  OCMVerify([mock removeUserAttributeForKey:key]);
}

- (void)testGetAllUserAttributes {
  id mock = OCMClassMock([Luciq class]);
  RCTPromiseResolveBlock resolve = ^(id result) {};
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {};
  NSDictionary *dictionary = @{ @"someKey" : @"someValue" };

  OCMStub([mock userAttributes]).andReturn(dictionary);
  [self.luciqBridge getAllUserAttributes:resolve :reject];
  OCMVerify([mock userAttributes]);
}

- (void)testClearAllUserAttributes {
  id mock = OCMClassMock([Luciq class]);
  NSString *key = @"someKey";
  NSDictionary *dictionary = @{ @"someKey" : @"someValue" };

  OCMStub([mock userAttributes]).andReturn(dictionary);
  OCMStub([mock removeUserAttributeForKey:key]);
  [self.luciqBridge clearAllUserAttributes];
  OCMVerify([mock removeUserAttributeForKey:key]);
}

- (void)testShowWelcomeMessageWithMode {
  id mock = OCMClassMock([Luciq class]);
  LCQWelcomeMessageMode welcomeMessageMode = LCQWelcomeMessageModeBeta;

  OCMStub([mock showWelcomeMessageWithMode:welcomeMessageMode]);
  [self.luciqBridge showWelcomeMessageWithMode:welcomeMessageMode];
  OCMVerify([mock showWelcomeMessageWithMode:welcomeMessageMode]);
}

- (void)testSetWelcomeMessageMode {
  id mock = OCMClassMock([Luciq class]);
  LCQWelcomeMessageMode welcomeMessageMode = LCQWelcomeMessageModeBeta;

  OCMStub([mock setWelcomeMessageMode:welcomeMessageMode]);
  [self.luciqBridge setWelcomeMessageMode:welcomeMessageMode];
  OCMVerify([mock setWelcomeMessageMode:welcomeMessageMode]);
}

- (void)testNetworkLogIOS {
  id mLCQNetworkLogger = OCMClassMock([LCQNetworkLogger class]);

  NSString *url = @"https://api.luciq.ai";
  NSString *method = @"GET";
  NSString *requestBody = @"requestBody";
  double requestBodySize = 10;
  NSString *responseBody = @"responseBody";
  double responseBodySize = 15;
  double responseCode = 200;
  NSDictionary *requestHeaders = @{ @"accept": @"application/json" };
  NSDictionary *responseHeaders = @{ @"cache-control": @"no-store" };
  NSString *contentType = @"application/json";
  double errorCode = 0;
  NSString *errorDomain = nil;
  double startTime = 1719847101199;
  double duration = 150;
  NSString *gqLCQueryName = nil;
  NSString *serverErrorMessage = nil;
  NSDictionary* w3cExternalTraceAttributes = nil;
  NSNumber *isW3cCaughted = nil;
  NSNumber *partialID = nil;
  NSNumber *timestamp= nil;
  NSString *generatedW3CTraceparent= nil;
  NSString *caughtedW3CTraceparent= nil;
  [self.luciqBridge networkLogIOS:url
                              method:method
                         requestBody:requestBody
                     requestBodySize:requestBodySize
                        responseBody:responseBody
                    responseBodySize:responseBodySize
                        responseCode:responseCode
                      requestHeaders:requestHeaders
                     responseHeaders:responseHeaders
                         contentType:contentType
                         errorDomain:errorDomain
                           errorCode:errorCode
                           startTime:startTime
                            duration:duration
                     gqlQueryName:gqLCQueryName
                  serverErrorMessage:serverErrorMessage
                 w3cExternalTraceAttributes:w3cExternalTraceAttributes

                  ];

  OCMVerify([mLCQNetworkLogger addNetworkLogWithUrl:url
                                            method:method
                                       requestBody:requestBody
                                   requestBodySize:requestBodySize
                                      responseBody:responseBody
                                  responseBodySize:responseBodySize
                                      responseCode:responseCode
                                    requestHeaders:requestHeaders
                                   responseHeaders:responseHeaders
                                       contentType:contentType
                                       errorDomain:errorDomain
                                         errorCode:errorCode
                                         startTime:startTime * 1000
                                          duration:duration * 1000
                                      gqlQueryName:gqLCQueryName
                                serverErrorMessage:serverErrorMessage
                                    isW3cCaughted:isW3cCaughted
                                   partialID:partialID
                                    timestamp:timestamp
                                  generatedW3CTraceparent:generatedW3CTraceparent
                               caughtedW3CTraceparent:caughtedW3CTraceparent
                                ]);
}

- (void)testSetFileAttachment {
  id mock = OCMClassMock([Luciq class]);
  NSString *fileLocation = @"test";
  NSURL *url = [NSURL URLWithString:fileLocation];

  OCMStub([mock addFileAttachmentWithURL:url]);
  [self.luciqBridge setFileAttachment:fileLocation];
  OCMVerify([mock addFileAttachmentWithURL:url]);
}

- (void)testShow {
  id mock = OCMClassMock([Luciq class]);

  OCMStub([mock show]);
  [self.luciqBridge show];

  XCTestExpectation *expectation = [self expectationWithDescription:@"Testing [Luciq show]"];

  [[NSRunLoop mainRunLoop] performBlock:^{
    OCMVerify([mock show]);
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:EXPECTATION_TIMEOUT handler:nil];
}


- (void)testWillRedirectToStore {

    id mock = OCMClassMock([Luciq class]);

    [self.luciqBridge willRedirectToStore];

    OCMVerify([mock willRedirectToAppStore]);

    [mock stopMocking];
}



/*
 +------------------------------------------------------------------------+
 |                              Log Module                                |
 +------------------------------------------------------------------------+
 */

- (void)testSetLCQLogPrintsToConsole {
  [self.luciqBridge setLQLogPrintsToConsole:YES];
  XCTAssertTrue(LCQLog.printsToConsole);
}

- (void)testLogVerbose {
  id mock = OCMClassMock([LCQLog class]);
  NSString *log = @"some log";

  OCMStub([mock logVerbose:log]);
  [self.luciqBridge logVerbose:log];
  OCMVerify([mock logVerbose:log]);
}

- (void)testLogDebug {
  id mock = OCMClassMock([LCQLog class]);
  NSString *log = @"some log";

  OCMStub([mock logDebug:log]);
  [self.luciqBridge logDebug:log];
  OCMVerify([mock logDebug:log]);
}

- (void)testLogInfo {
  id mock = OCMClassMock([LCQLog class]);
  NSString *log = @"some log";

  OCMStub([mock logInfo:log]);
  [self.luciqBridge logInfo:log];
  OCMVerify([mock logInfo:log]);
}

- (void)testLogWarn {
  id mock = OCMClassMock([LCQLog class]);
  NSString *log = @"some log";

  OCMStub([mock logWarn:log]);
  [self.luciqBridge logWarn:log];
  OCMVerify([mock logWarn:log]);
}

- (void)testLogError {
  id mock = OCMClassMock([LCQLog class]);
  NSString *log = @"some log";

  OCMStub([mock logError:log]);
  [self.luciqBridge logError:log];
  OCMVerify([mock logError:log]);
}

- (void)testClearLogs {
  id mock = OCMClassMock([LCQLog class]);

  OCMStub([mock clearAllLogs]);
  [self.luciqBridge clearLogs];
  OCMVerify([mock clearAllLogs]);
}


- (void)testAddFeatureFlags {
  id mock = OCMClassMock([Luciq class]);
  NSDictionary *featureFlagsMap = @{ @"key13" : @"value1", @"key2" : @"value2"};

  OCMStub([mock addFeatureFlags :[OCMArg any]]);
  [self.luciqBridge addFeatureFlags:featureFlagsMap];
  OCMVerify([mock addFeatureFlags: [OCMArg checkWithBlock:^(id value) {
    NSArray<LCQFeatureFlag *> *featureFlags = value;
    NSString* firstFeatureFlagName = [featureFlags objectAtIndex:0 ].name;
    NSString* firstFeatureFlagKey = [[featureFlagsMap allKeys] objectAtIndex:0] ;
    if([ firstFeatureFlagKey isEqualToString: firstFeatureFlagName]){
      return YES;
    }
    return  NO;
  }]]);
}

- (void)testRemoveFeatureFlags {
  id mock = OCMClassMock([Luciq class]);
  NSArray *featureFlags = @[@"exp1", @"exp2"];
  [self.luciqBridge removeFeatureFlags:featureFlags];
     OCMVerify([mock removeFeatureFlags: [OCMArg checkWithBlock:^(id value) {
        NSArray<LCQFeatureFlag *> *featureFlagsObJ = value;
        NSString* firstFeatureFlagName = [featureFlagsObJ objectAtIndex:0 ].name;
        NSString* firstFeatureFlagKey = [featureFlags firstObject] ;
        if([ firstFeatureFlagKey isEqualToString: firstFeatureFlagName]){
          return YES;
        }
        return  NO;
      }]]);
}

- (void)testRemoveAllFeatureFlags {
  id mock = OCMClassMock([Luciq class]);
  OCMStub([mock removeAllFeatureFlags]);
  [self.luciqBridge removeAllFeatureFlags];
  OCMVerify([mock removeAllFeatureFlags]);
}


- (void) testIsW3ExternalTraceIDEnabled {
    id mock = OCMClassMock([LCQNetworkLogger class]);
    NSNumber *expectedValue = @(YES);

    OCMStub([mock w3ExternalTraceIDEnabled]).andReturn([expectedValue boolValue]);

    XCTestExpectation *expectation = [self expectationWithDescription:@"Call completion handler"];
    RCTPromiseResolveBlock resolve = ^(NSNumber *result) {
        XCTAssertEqualObjects(result, expectedValue);
        [expectation fulfill];
    };

    [self.luciqBridge isW3ExternalTraceIDEnabled:resolve :nil];

    [self waitForExpectationsWithTimeout:1.0 handler:nil];

    OCMVerify([mock w3ExternalTraceIDEnabled]);
}

- (void) testIsW3ExternalGeneratedHeaderEnabled {
    id mock = OCMClassMock([LCQNetworkLogger class]);
    NSNumber *expectedValue = @(YES);

    OCMStub([mock w3ExternalGeneratedHeaderEnabled]).andReturn([expectedValue boolValue]);

    XCTestExpectation *expectation = [self expectationWithDescription:@"Call completion handler"];
    RCTPromiseResolveBlock resolve = ^(NSNumber *result) {
        XCTAssertEqualObjects(result, expectedValue);
        [expectation fulfill];
    };

    [self.luciqBridge isW3ExternalGeneratedHeaderEnabled:resolve :nil];

    [self waitForExpectationsWithTimeout:1.0 handler:nil];

    OCMVerify([mock w3ExternalGeneratedHeaderEnabled]);
}

- (void) testIsW3CaughtHeaderEnabled {
    id mock = OCMClassMock([LCQNetworkLogger class]);
    NSNumber *expectedValue = @(YES);

    OCMStub([mock w3CaughtHeaderEnabled]).andReturn([expectedValue boolValue]);

    XCTestExpectation *expectation = [self expectationWithDescription:@"Call completion handler"];
    RCTPromiseResolveBlock resolve = ^(NSNumber *result) {
        XCTAssertEqualObjects(result, expectedValue);
        [expectation fulfill];
    };

    [self.luciqBridge isW3CaughtHeaderEnabled:resolve :nil];

    [self waitForExpectationsWithTimeout:1.0 handler:nil];

    OCMVerify([mock w3CaughtHeaderEnabled]);
}

- (void)testEnableAutoMasking {
    id mock = OCMClassMock([Luciq class]);

    NSArray *autoMaskingTypes = [NSArray arrayWithObjects:
         [NSNumber numberWithInteger:LCQAutoMaskScreenshotOptionLabels],
         [NSNumber numberWithInteger:LCQAutoMaskScreenshotOptionTextInputs],
         [NSNumber numberWithInteger:LCQAutoMaskScreenshotOptionMedia],
         [NSNumber numberWithInteger:LCQAutoMaskScreenshotOptionMaskNothing],
         nil];

     OCMStub([mock setAutoMaskScreenshots:LCQAutoMaskScreenshotOptionLabels | LCQAutoMaskScreenshotOptionTextInputs | LCQAutoMaskScreenshotOptionMedia | LCQAutoMaskScreenshotOptionMaskNothing]);

     [self.luciqBridge enableAutoMasking:autoMaskingTypes];

     OCMVerify([mock setAutoMaskScreenshots:LCQAutoMaskScreenshotOptionLabels | LCQAutoMaskScreenshotOptionTextInputs | LCQAutoMaskScreenshotOptionMedia | LCQAutoMaskScreenshotOptionMaskNothing]);
}

- (void)testSetNetworkLogBodyEnabled {
    id mock = OCMClassMock([LCQNetworkLogger class]);
    BOOL isEnabled = YES;

    OCMStub([mock setLogBodyEnabled:isEnabled]);
    [self.luciqBridge setNetworkLogBodyEnabled:isEnabled];
    OCMVerify([mock setLogBodyEnabled:isEnabled]);
}

- (void)testGetNetworkBodyMaxSize {
    id mock = OCMClassMock([LCQNetworkLogger class]);
    double expectedValue = 10240.0;

    OCMStub([mock getNetworkBodyMaxSize]).andReturn(expectedValue);

    XCTestExpectation *expectation = [self expectationWithDescription:@"Call resolve block"];
    RCTPromiseResolveBlock resolve = ^(NSNumber *result) {
        XCTAssertEqual(result.doubleValue, expectedValue);
        [expectation fulfill];
    };

    [self.luciqBridge getNetworkBodyMaxSize:resolve :nil];
    [self waitForExpectationsWithTimeout:1.0 handler:nil];

    OCMVerify(ClassMethod([mock getNetworkBodyMaxSize]));
}
- (void)testSetTheme {
    id mock = OCMClassMock([Luciq class]);
    id mockTheme = OCMClassMock([LCQTheme class]);

    // Create theme configuration dictionary
    NSDictionary *themeConfig = @{
        @"primaryColor": @"#FF0000",
        @"backgroundColor": @"#00FF00",
        @"titleTextColor": @"#0000FF",
        @"subtitleTextColor": @"#FFFF00",
        @"primaryTextColor": @"#FF00FF",
        @"secondaryTextColor": @"#00FFFF",
        @"callToActionTextColor": @"#800080",
        @"headerBackgroundColor": @"#808080",
        @"footerBackgroundColor": @"#C0C0C0",
        @"rowBackgroundColor": @"#FFFFFF",
        @"selectedRowBackgroundColor": @"#E6E6FA",
        @"rowSeparatorColor": @"#D3D3D3",
        @"primaryFontPath": @"TestFont.ttf",
        @"secondaryFontPath": @"fonts/AnotherFont.ttf",
        @"ctaFontPath": @"./assets/fonts/CTAFont.ttf"
    };

    // Mock LCQTheme creation and configuration
    OCMStub([mockTheme primaryColor]).andReturn([UIColor redColor]);
    OCMStub([mockTheme backgroundColor]).andReturn([UIColor greenColor]);
    OCMStub([mockTheme titleTextColor]).andReturn([UIColor blueColor]);
    OCMStub([mockTheme subtitleTextColor]).andReturn([UIColor yellowColor]);
    OCMStub([mockTheme primaryTextColor]).andReturn([UIColor magentaColor]);
    OCMStub([mockTheme secondaryTextColor]).andReturn([UIColor cyanColor]);
    OCMStub([mockTheme callToActionTextColor]).andReturn([UIColor purpleColor]);
    OCMStub([mockTheme headerBackgroundColor]).andReturn([UIColor grayColor]);
    OCMStub([mockTheme footerBackgroundColor]).andReturn([UIColor lightGrayColor]);
    OCMStub([mockTheme rowBackgroundColor]).andReturn([UIColor whiteColor]);
    OCMStub([mockTheme selectedRowBackgroundColor]).andReturn([UIColor redColor]);
    OCMStub([mockTheme rowSeparatorColor]).andReturn([UIColor lightGrayColor]);
    OCMStub([mockTheme primaryTextFont]).andReturn([UIFont systemFontOfSize:17.0]);
    OCMStub([mockTheme secondaryTextFont]).andReturn([UIFont systemFontOfSize:17.0]);
    OCMStub([mockTheme callToActionTextFont]).andReturn([UIFont systemFontOfSize:17.0]);

    // Mock theme property setting
    OCMStub([mockTheme setPrimaryColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setBackgroundColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setTitleTextColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setSubtitleTextColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setPrimaryTextColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setSecondaryTextColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setCallToActionTextColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setHeaderBackgroundColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setFooterBackgroundColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setRowBackgroundColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setSelectedRowBackgroundColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setRowSeparatorColor:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setPrimaryTextFont:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setSecondaryTextFont:[OCMArg any]]).andReturn(mockTheme);
    OCMStub([mockTheme setCallToActionTextFont:[OCMArg any]]).andReturn(mockTheme);

    // Mock Luciq.theme property
    OCMStub([mock theme]).andReturn(mockTheme);
    OCMStub([mock setTheme:[OCMArg any]]);

    // Call the method
    [self.luciqBridge setTheme:themeConfig];

    // Verify that setTheme was called
    OCMVerify([mock setTheme:[OCMArg any]]);
}


@end
