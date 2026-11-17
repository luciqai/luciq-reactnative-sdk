//
//  LuciqBugReportingTests.m
//  LuciqSampleTests
//
//  Created by Salma Ali on 7/30/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import "LuciqBugReportingBridge.h"
#import "LCQCustomReport+RN.h"
#import "LCQReportConfiguration+RN.h"
#import <LuciqSDK/LCQTypes.h>
#import "LuciqSDK/LuciqSDK.h"
#import "LCQConstants.h"

@interface LuciqBugReportingTests : XCTestCase
@property (nonatomic, retain) LuciqBugReportingBridge *luciqBridge;
@end

@implementation LuciqBugReportingTests

- (void)setUp {
  // Put setup code here. This method is called before the invocation of each test method in the class.
  self.luciqBridge = [[LuciqBugReportingBridge alloc] init];
}

/*
 +------------------------------------------------------------------------+
 |                          Bug Reporting Module                          |
 +------------------------------------------------------------------------+
 */

- (void) testgivenBoolean$setBugReportingEnabled_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQBugReporting class]);
  BOOL enabled = YES;
  [self.luciqBridge setEnabled:enabled];
  OCMVerify([mock setEnabled:enabled]);
}

- (void) testgivenInvocationEvent$setInvocationEvents_whenQuery_thenShouldCallNativeApiWithArgs {
  NSArray *invocationEventsArr;
  invocationEventsArr = [NSArray arrayWithObjects:  @(LCQInvocationEventScreenshot), nil];

  [self.luciqBridge setInvocationEvents:invocationEventsArr];
  LCQInvocationEvent invocationEvents = 0;
  for (NSNumber *boxedValue in invocationEventsArr) {
    invocationEvents |= [boxedValue intValue];
  }
  XCTAssertEqual(LCQBugReporting.invocationEvents, invocationEvents);
}

- (void) testgivenHandler$setOnInvokeHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  [partialMock setOnInvokeHandler];
  XCTAssertNotNil(LCQBugReporting.willInvokeHandler);
  OCMStub([partialMock sendEventWithName:@"LCQpreInvocationHandler" body:nil]);
  LCQBugReporting.willInvokeHandler();
  OCMVerify([partialMock sendEventWithName:@"LCQpreInvocationHandler" body:nil]);
}


- (void) testgivenHandlerCANCEL$setOnSDKDismissedHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  [partialMock setOnSDKDismissedHandler];
  XCTAssertNotNil(LCQBugReporting.didDismissHandler);
  NSDictionary *result = @{ @"dismissType": @"CANCEL",
                            @"reportType": @"bug"};
  OCMStub([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
  LCQBugReporting.didDismissHandler(LCQDismissTypeCancel,LCQReportCategoryBug);
  OCMVerify([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
}

- (void) testgivenHandlerSUBMIT$setOnSDKDismissedHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  [partialMock setOnSDKDismissedHandler];
  XCTAssertNotNil(LCQBugReporting.didDismissHandler);

  NSDictionary *result = @{ @"dismissType": @"SUBMIT",
                            @"reportType": @"feedback"};
  OCMStub([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
  LCQBugReporting.didDismissHandler(LCQDismissTypeSubmit,LCQReportCategoryFeedback);
  OCMVerify([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
}

- (void) testgivenHandlerADD_ATTACHMENT$setOnSDKDismissedHandler_whenQuery_thenShouldCallNativeApi {
  id partialMock = OCMPartialMock(self.luciqBridge);
  [partialMock setOnSDKDismissedHandler];
  XCTAssertNotNil(LCQBugReporting.didDismissHandler);
  NSDictionary *result = @{ @"dismissType": @"ADD_ATTACHMENT",
                            @"reportType": @"feedback"};
  OCMStub([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
  LCQBugReporting.didDismissHandler(LCQDismissTypeAddAttachment,LCQReportCategoryFeedback);
  OCMVerify([partialMock sendEventWithName:@"LCQpostInvocationHandler" body:result]);
}

- (void) skip_testgivenDouble$setShakingThresholdForiPhone_whenQuery_thenShouldCallNativeApi {
  double threshold = 12;
  [self.luciqBridge setShakingThresholdForiPhone:threshold];
  XCTAssertEqual(LCQBugReporting.shakingThresholdForiPhone, threshold);
}

- (void) skip_testgivenDouble$setShakingThresholdForiPad_whenQuery_thenShouldCallNativeApi {
  double threshold = 12;
  [self.luciqBridge setShakingThresholdForiPad:threshold];
  XCTAssertEqual(LCQBugReporting.shakingThresholdForiPad, threshold);
}

- (void) testgivenExtendedBugReportMode$setExtendedBugReportMode_whenQuery_thenShouldCallNativeApi {
  LCQExtendedBugReportMode extendedBugReportMode = LCQExtendedBugReportModeEnabledWithOptionalFields;
  [self.luciqBridge setExtendedBugReportMode:extendedBugReportMode];
  XCTAssertEqual(LCQBugReporting.extendedBugReportMode, extendedBugReportMode);
}

- (void) testgivenArray$setReportTypes_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQBugReporting class]);
  NSArray *reportTypesArr = [NSArray arrayWithObjects:  @(LCQReportCategoryBug), nil];
  LCQBugReportingReportType reportTypes = 0;
  for (NSNumber *boxedValue in reportTypesArr) {
    reportTypes |= [boxedValue intValue];
  }
  OCMStub([mock setPromptOptionsEnabledReportTypes:reportTypes]);
  [self.luciqBridge setReportTypes:reportTypesArr];
  OCMVerify([mock setPromptOptionsEnabledReportTypes:reportTypes]);
}


- (void) testgivenArgs$showBugReportingWithReportTypeAndOptions_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQBugReporting class]);
  LCQBugReportingReportType reportType = LCQBugReportingReportTypeBug;
  NSArray *options = [NSArray arrayWithObjects:  @(LCQBugReportingOptionEmailFieldOptional), nil];
  LCQBugReportingOption parsedOptions = 0;
  for (NSNumber *boxedValue in options) {
    parsedOptions |= [boxedValue intValue];
  }
  OCMStub([mock showWithReportType:reportType options:parsedOptions]);
  [self.luciqBridge show:reportType options:options];

  XCTestExpectation *expectation = [self expectationWithDescription:@"Test ME PLX"];

  [[NSRunLoop mainRunLoop] performBlock:^{
    OCMVerify([mock showWithReportType:reportType options:parsedOptions]);
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:EXPECTATION_TIMEOUT handler:nil];
}

- (void) testgivenBoolean$setAutoScreenRecordingEnabled_whenQuery_thenShouldCallNativeApi {
  BOOL enabled = true;
  [self.luciqBridge setAutoScreenRecordingEnabled:enabled];
  XCTAssertTrue(LCQBugReporting.autoScreenRecordingEnabled);
}

- (void) testgivenArgs$setAutoScreenRecordingDuration_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQBugReporting class]);
  CGFloat duration = 12.3;
  [self.luciqBridge setAutoScreenRecordingDuration:duration];
  OCMVerify([mock setAutoScreenRecordingDuration:duration]);
}

- (void) testgivenBoolean$setViewHierarchyEnabled_whenQuery_thenShouldCallNativeApi {
  id mock = OCMClassMock([LCQBugReporting class]);
  BOOL enabled = true;
  [self.luciqBridge setViewHierarchyEnabled:enabled];
  OCMVerify([mock setShouldCaptureViewHierarchy:enabled]);
}

- (void) testSetDisclaimerText {
  id mock = OCMClassMock([LCQBugReporting class]);
  NSString *text = @"This is a disclaimer text!";

  OCMStub([mock setDisclaimerText:text]);
  [self.luciqBridge setDisclaimerText:text];
  OCMVerify([mock setDisclaimerText:text]);
}

- (void)testAddUserConsentWithKey {
  id mock = OCMClassMock([LCQBugReporting class]);

  NSString *key = @"testKey";
  NSString *description = @"Consent description";
  BOOL mandatory = YES;
  BOOL checked = NO;
  NSNumber *actionType = @2;
  LCQConsentAction mappedActionType = (LCQConsentAction)[actionType integerValue];

  [self.luciqBridge addUserConsent:key
                                  description:description
                                    mandatory:mandatory
                                      checked:checked
                                   actionType:actionType];

  OCMVerify([mock addUserConsentWithKey:key
                                        description:description
                                          mandatory:mandatory
                                            checked:checked
                                         actionType:mappedActionType]);
}

- (void) testSetProactiveReportingConfigurations {
  id mock = OCMClassMock([LCQBugReporting class]);
  BOOL enabled = true;
  NSNumber* gap = @2;
  NSNumber* delay = @4;

  LCQProactiveReportingConfigurations *configurations = [[LCQProactiveReportingConfigurations alloc] init];
  configurations.enabled = enabled; //Enable/disable
  configurations.gapBetweenModals = gap; // Time in seconds
  configurations.modalDelayAfterDetection = delay; // Time in seconds

  OCMStub([mock setProactiveReportingConfigurations:OCMOCK_ANY]);

  [self.luciqBridge setProactiveReportingConfigurations:enabled gap:gap model:delay];

  // Verify that the method is called with the correct properties (using OCMArg to match properties)
  OCMVerify([mock setProactiveReportingConfigurations:[OCMArg checkWithBlock:^BOOL(id obj) {
      LCQProactiveReportingConfigurations *config = (LCQProactiveReportingConfigurations *)obj;
      return config.enabled == enabled &&
             [config.gapBetweenModals isEqualToNumber:gap] &&
             [config.modalDelayAfterDetection isEqualToNumber:delay];
    }]]);
}

/*
 +------------------------------------------------------------------------+
 |                            Custom reports                              |
 |  Mirrors test/fixtures/customReport/*.json (the test bundle carries    |
 |  no resources, so the expected values are written out by hand).        |
 +------------------------------------------------------------------------+
 */

- (void)testgivenIdentifiers$setReportCategoriesScope_whenQuery_thenShouldSetNativeProperty {
  id mock = OCMClassMock([LCQBugReporting class]);
  NSArray *identifiers = @[@"checkout", @"refund"];
  [self.luciqBridge setReportCategoriesScope:identifiers];
  OCMVerify([mock setReportCategoriesScope:identifiers]);
}

- (void)testgivenNil$setReportCategoriesScope_whenQuery_thenShouldClearNativeProperty {
  id mock = OCMClassMock([LCQBugReporting class]);
  [self.luciqBridge setReportCategoriesScope:nil];
  OCMVerify([mock setReportCategoriesScope:nil]);
}

- (void)testgivenNSNull$setReportCategoriesScope_whenQuery_thenShouldClearNativeProperty {
  id mock = OCMClassMock([LCQBugReporting class]);
  [self.luciqBridge setReportCategoriesScope:(NSArray *)[NSNull null]];
  OCMVerify([mock setReportCategoriesScope:nil]);
}

- (void)testgivenFullDictionary$lcq_reportWithType_thenShouldBuildReport {
  // report.full.json
  NSDictionary *dictionary = @{
    @"comment": @"Refund was for the wrong amount",
    @"email": @"reporter@example.com",
    @"categoryIdentifier": @"checkout-refund",
    @"answers": @{
      @"f_reason": @[@"o_wrong_amount"],
      @"f_items": @[@"o_item_a", @"o_item_b"],
      @"f_details": @[@"Charged twice on the same order"],
    },
    @"consents": @{@"c_share_logs": @YES, @"c_contact_me": @NO},
    @"extendedFields": @{
      @"repro_steps": @"1. Pay 2. Request a refund",
      @"actual_result": @"Refund of 0.00",
      @"expected_result": @"Full refund",
    },
    @"screenshot": @"currentScreen",
    @"attachments": @[@"file:///data/user/0/com.example/files/report.log", @"content://media/external/images/media/42"],
  };
  NSError *error = nil;

  LCQCustomReport *report = [LCQCustomReport lcq_reportWithType:LCQBugReportingReportTypeBug dictionary:dictionary error:&error];

  XCTAssertNil(error);
  XCTAssertNotNil(report);
  XCTAssertEqual(report.reportType, LCQBugReportingReportTypeBug);
  XCTAssertEqualObjects(report.comment, @"Refund was for the wrong amount");
  XCTAssertEqualObjects(report.email, @"reporter@example.com");
  XCTAssertEqualObjects(report.categoryIdentifier, @"checkout-refund");
  XCTAssertNotNil(report.screenshot);
  // Answers, consents, extended fields and attachments have no public getters; they are covered by
  // testgivenMalformedDictionary... (shape errors) and by the native SDK's own validation.
}

- (void)testgivenMinimalDictionary$lcq_reportWithType_thenShouldBuildReportWithDefaults {
  // report.minimal.json
  NSError *error = nil;

  LCQCustomReport *report = [LCQCustomReport lcq_reportWithType:LCQBugReportingReportTypeFeedback dictionary:@{@"screenshot": @"none"} error:&error];

  XCTAssertNil(error);
  XCTAssertEqual(report.reportType, LCQBugReportingReportTypeFeedback);
  XCTAssertNil(report.comment);
  XCTAssertNil(report.email);
  XCTAssertNil(report.categoryIdentifier);
}

- (void)testgivenNilDictionary$lcq_reportWithType_thenShouldBuildEmptyReport {
  NSError *error = nil;
  LCQCustomReport *report = [LCQCustomReport lcq_reportWithType:LCQBugReportingReportTypeQuestion dictionary:nil error:&error];
  XCTAssertNil(error);
  XCTAssertNotNil(report);
}

- (void)testgivenMalformedDictionary$lcq_reportWithType_thenShouldReturnError {
  NSArray<NSDictionary *> *malformed = @[
    @{@"screenshot": @"fromGallery"},
    @{@"comment": @42},
    @{@"answers": @"o_wrong_amount"},
    @{@"answers": @{@"f_reason": @"o_wrong_amount"}},
    @{@"answers": @{@"f_reason": @[@1]}},
    @{@"consents": @{@"c_share_logs": @"yes"}},
    @{@"extendedFields": @{@"repro_steps": @YES}},
    @{@"attachments": @[@1]},
  ];
  for (NSDictionary *dictionary in malformed) {
    NSError *error = nil;
    LCQCustomReport *report = [LCQCustomReport lcq_reportWithType:LCQBugReportingReportTypeBug dictionary:dictionary error:&error];
    XCTAssertNil(report, @"%@ should be rejected", dictionary);
    XCTAssertEqualObjects(error.domain, LCQRNCustomReportErrorDomain);
  }
}

- (LCQCustomReportFieldError *)fieldErrorWithField:(LCQCustomReportField)field key:(NSString *)key problem:(LCQCustomReportProblem)problem {
  id error = OCMClassMock([LCQCustomReportFieldError class]);
  OCMStub([error field]).andReturn(field);
  OCMStub([error key]).andReturn(key);
  OCMStub([error problem]).andReturn(problem);
  return error;
}

- (id)resultWithStatus:(LCQCustomReportStatus)status reason:(LCQCustomReportNotSentReason)reason errors:(NSArray *)errors {
  id result = OCMClassMock([LCQCustomReportResult class]);
  OCMStub([result status]).andReturn(status);
  OCMStub([result notSentReason]).andReturn(reason);
  OCMStub([result errors]).andReturn(errors);
  return result;
}

- (void)testgivenQueuedResult$lcq_dictionaryRepresentation_thenShouldMatchFixture {
  // result.queued.json
  id result = [self resultWithStatus:LCQCustomReportStatusQueued reason:LCQCustomReportNotSentReasonNone errors:@[]];
  NSDictionary *expected = @{@"status": @"queued", @"errors": @[]};
  XCTAssertEqualObjects([result lcq_dictionaryRepresentation], expected);
}

- (void)testgivenNotSentResult$lcq_dictionaryRepresentation_thenShouldMatchFixture {
  // result.notSent.tryLater.json
  id result = [self resultWithStatus:LCQCustomReportStatusNotSent reason:LCQCustomReportNotSentReasonTryLater errors:@[]];
  NSDictionary *expected = @{@"status": @"notSent", @"notSentReason": @"tryLater", @"errors": @[]};
  XCTAssertEqualObjects([result lcq_dictionaryRepresentation], expected);
}

- (void)testgivenInvalidResult$lcq_dictionaryRepresentation_thenShouldMatchFixture {
  // result.invalid.json
  NSArray *errors = @[
    [self fieldErrorWithField:LCQCustomReportFieldCategory key:nil problem:LCQCustomReportProblemMissing],
    [self fieldErrorWithField:LCQCustomReportFieldAnswer key:@"f_reason" problem:LCQCustomReportProblemUnknown],
    [self fieldErrorWithField:LCQCustomReportFieldComment key:nil problem:LCQCustomReportProblemTooShort],
    [self fieldErrorWithField:LCQCustomReportFieldEmail key:nil problem:LCQCustomReportProblemInvalid],
    [self fieldErrorWithField:LCQCustomReportFieldConsent key:@"c_share_logs" problem:LCQCustomReportProblemMissing],
    [self fieldErrorWithField:LCQCustomReportFieldExtendedField key:@"repro_steps" problem:LCQCustomReportProblemMissing],
    [self fieldErrorWithField:LCQCustomReportFieldScreenshot key:nil problem:LCQCustomReportProblemInvalid],
    [self fieldErrorWithField:LCQCustomReportFieldAttachment key:@"0" problem:LCQCustomReportProblemTooLong],
  ];
  id result = [self resultWithStatus:LCQCustomReportStatusInvalid reason:LCQCustomReportNotSentReasonNone errors:errors];
  NSDictionary *expected = @{
    @"status": @"invalid",
    @"errors": @[
      @{@"field": @"category", @"key": [NSNull null], @"problem": @"missing"},
      @{@"field": @"answer", @"key": @"f_reason", @"problem": @"unknown"},
      @{@"field": @"comment", @"key": [NSNull null], @"problem": @"tooShort"},
      @{@"field": @"email", @"key": [NSNull null], @"problem": @"invalid"},
      @{@"field": @"consent", @"key": @"c_share_logs", @"problem": @"missing"},
      @{@"field": @"extendedField", @"key": @"repro_steps", @"problem": @"missing"},
      @{@"field": @"screenshot", @"key": [NSNull null], @"problem": @"invalid"},
      @{@"field": @"attachment", @"key": @"0", @"problem": @"tooLong"},
    ],
  };
  XCTAssertEqualObjects([result lcq_dictionaryRepresentation], expected);
}

- (id)optionWithKey:(NSString *)key label:(NSString *)label {
  id option = OCMClassMock([LCQReportConfigurationFieldOption class]);
  OCMStub([option key]).andReturn(key);
  OCMStub([option label]).andReturn(label);
  return option;
}

- (id)fieldWithKey:(NSString *)key type:(LCQReportConfigurationFieldType)type label:(NSString *)label placeholder:(NSString *)placeholder required:(BOOL)required options:(NSArray *)options {
  id field = OCMClassMock([LCQReportConfigurationField class]);
  OCMStub([field key]).andReturn(key);
  OCMStub([field type]).andReturn(type);
  OCMStub([field label]).andReturn(label);
  OCMStub([field placeholder]).andReturn(placeholder);
  OCMStub([field isRequired]).andReturn(required);
  OCMStub([field options]).andReturn(options);
  return field;
}

- (id)categoryWithIdentifier:(NSString *)identifier title:(NSString *)title description:(NSString *)description children:(NSArray *)children fields:(NSArray *)fields {
  id category = OCMClassMock([LCQReportConfigurationCategory class]);
  OCMStub([category identifier]).andReturn(identifier);
  OCMStub([category title]).andReturn(title);
  OCMStub([category categoryDescription]).andReturn(description);
  OCMStub([category children]).andReturn(children);
  OCMStub([category fields]).andReturn(fields);
  OCMStub([category isLeaf]).andReturn(children.count == 0);
  return category;
}

- (void)testgivenFullConfiguration$lcq_dictionaryRepresentation_thenShouldMatchFixture {
  // configuration.full.json
  id refund = [self categoryWithIdentifier:@"checkout-refund" title:@"Refund" description:@"Refund issues" children:@[] fields:@[
    [self fieldWithKey:@"f_reason" type:LCQReportConfigurationFieldTypeDropdown label:@"Reason" placeholder:@"Pick one" required:YES options:@[
      [self optionWithKey:@"o_wrong_amount" label:@"Wrong amount"], [self optionWithKey:@"o_not_received" label:@"Not received"]]],
    [self fieldWithKey:@"f_items" type:LCQReportConfigurationFieldTypeCheckbox label:@"Items" placeholder:nil required:NO options:@[
      [self optionWithKey:@"o_item_a" label:@"Item A"], [self optionWithKey:@"o_item_b" label:@"Item B"]]],
    [self fieldWithKey:@"f_store" type:LCQReportConfigurationFieldTypeSearch label:@"Store" placeholder:@"Search stores" required:NO options:@[
      [self optionWithKey:@"o_store_1" label:@"Store 1"]]],
    [self fieldWithKey:@"f_details" type:LCQReportConfigurationFieldTypeText label:nil placeholder:@"Tell us more" required:NO options:@[]],
  ]];
  id checkout = [self categoryWithIdentifier:@"checkout" title:@"Checkout" description:nil children:@[refund] fields:@[]];
  id reportAProblem = [self categoryWithIdentifier:@"report-a-problem" title:@"Report a problem" description:@"Something is broken" children:@[checkout] fields:@[]];
  id other = [self categoryWithIdentifier:@"other" title:@"Other" description:nil children:@[] fields:@[]];

  id shareLogs = OCMClassMock([LCQReportConsent class]);
  OCMStub([shareLogs key]).andReturn(@"c_share_logs");
  OCMStub([shareLogs consentDescription]).andReturn(@"Share logs");
  OCMStub([shareLogs isMandatory]).andReturn(YES);
  OCMStub([shareLogs isCheckedByDefault]).andReturn(NO);
  id contactMe = OCMClassMock([LCQReportConsent class]);
  OCMStub([contactMe key]).andReturn(@"c_contact_me");
  OCMStub([contactMe consentDescription]).andReturn(nil);
  OCMStub([contactMe isMandatory]).andReturn(NO);
  OCMStub([contactMe isCheckedByDefault]).andReturn(YES);

  NSMutableArray *extendedFields = [NSMutableArray array];
  NSArray *extendedSpecs = @[@[@"repro_steps", @"Steps to reproduce", @YES], @[@"actual_result", @"Actual result", @NO], @[@"expected_result", @"Expected result", @NO]];
  for (NSArray *spec in extendedSpecs) {
    id field = OCMClassMock([LCQReportExtendedField class]);
    OCMStub([field identifier]).andReturn(spec[0]);
    OCMStub([field title]).andReturn(spec[1]);
    OCMStub([field isRequired]).andReturn([spec[2] boolValue]);
    [extendedFields addObject:field];
  }

  id requirements = OCMClassMock([LCQReportRequirements class]);
  OCMStub([requirements email]).andReturn(LCQReportEmailRequirementOptional);
  OCMStub([requirements identifiedEmail]).andReturn(@"identified@example.com");
  OCMStub([requirements commentMinLength]).andReturn(2);
  OCMStub([requirements commentMaxLength]).andReturn(4000);
  OCMStub([requirements consents]).andReturn(@[shareLogs, contactMe]);
  OCMStub([requirements extendedFields]).andReturn(extendedFields);
  OCMStub([requirements isScreenshotRequired]).andReturn(NO);
  OCMStub([requirements maxAttachments]).andReturn(3);
  OCMStub([requirements maxAttachmentBytes]).andReturn(5242880LL);

  id configuration = OCMClassMock([LCQReportConfiguration class]);
  OCMStub([configuration reportType]).andReturn(LCQBugReportingReportTypeBug);
  OCMStub([configuration categories]).andReturn(@[reportAProblem, other]);
  OCMStub([configuration preselectedCategory]).andReturn(nil);
  OCMStub([configuration requirements]).andReturn(requirements);

  NSDictionary *expectedRefund = @{
    @"identifier": @"checkout-refund", @"title": @"Refund", @"description": @"Refund issues", @"leaf": @YES, @"children": @[],
    @"fields": @[
      @{@"key": @"f_reason", @"type": @"dropdown", @"label": @"Reason", @"placeholder": @"Pick one", @"required": @YES,
        @"options": @[@{@"key": @"o_wrong_amount", @"label": @"Wrong amount"}, @{@"key": @"o_not_received", @"label": @"Not received"}]},
      @{@"key": @"f_items", @"type": @"checkbox", @"label": @"Items", @"placeholder": [NSNull null], @"required": @NO,
        @"options": @[@{@"key": @"o_item_a", @"label": @"Item A"}, @{@"key": @"o_item_b", @"label": @"Item B"}]},
      @{@"key": @"f_store", @"type": @"search", @"label": @"Store", @"placeholder": @"Search stores", @"required": @NO,
        @"options": @[@{@"key": @"o_store_1", @"label": @"Store 1"}]},
      @{@"key": @"f_details", @"type": @"text", @"label": [NSNull null], @"placeholder": @"Tell us more", @"required": @NO, @"options": @[]},
    ],
  };
  NSDictionary *expectedCheckout = @{@"identifier": @"checkout", @"title": @"Checkout", @"description": [NSNull null], @"leaf": @NO, @"children": @[expectedRefund], @"fields": @[]};
  NSDictionary *expected = @{
    @"reportType": @"bug",
    @"categories": @[
      @{@"identifier": @"report-a-problem", @"title": @"Report a problem", @"description": @"Something is broken", @"leaf": @NO, @"children": @[expectedCheckout], @"fields": @[]},
      @{@"identifier": @"other", @"title": @"Other", @"description": [NSNull null], @"leaf": @YES, @"children": @[], @"fields": @[]},
    ],
    @"preselectedCategory": [NSNull null],
    @"requirements": @{
      @"email": @"optional",
      @"identifiedEmail": @"identified@example.com",
      @"commentMinLength": @2,
      @"commentMaxLength": @4000,
      @"consents": @[
        @{@"key": @"c_share_logs", @"description": @"Share logs", @"mandatory": @YES, @"checkedByDefault": @NO},
        @{@"key": @"c_contact_me", @"description": [NSNull null], @"mandatory": @NO, @"checkedByDefault": @YES},
      ],
      @"extendedFields": @[
        @{@"id": @"repro_steps", @"label": @"Steps to reproduce", @"required": @YES},
        @{@"id": @"actual_result", @"label": @"Actual result", @"required": @NO},
        @{@"id": @"expected_result", @"label": @"Expected result", @"required": @NO},
      ],
      @"screenshotRequired": @NO,
      @"maxAttachments": @3,
      @"maxAttachmentBytes": @5242880,
    },
  };

  XCTAssertEqualObjects([configuration lcq_dictionaryRepresentation], expected);
}

- (void)testgivenScopedConfiguration$lcq_dictionaryRepresentation_thenShouldIncludePreselectedParent {
  // configuration.scoped.json (categories narrowed to "checkout", parent "report-a-problem" preselected)
  id refund = [self categoryWithIdentifier:@"checkout-refund" title:@"Refund" description:nil children:@[] fields:@[]];
  id checkout = [self categoryWithIdentifier:@"checkout" title:@"Checkout" description:nil children:@[refund] fields:@[]];
  id parent = [self categoryWithIdentifier:@"report-a-problem" title:@"Report a problem" description:@"Something is broken" children:@[checkout] fields:@[]];
  id requirements = OCMClassMock([LCQReportRequirements class]);
  OCMStub([requirements email]).andReturn(LCQReportEmailRequirementHidden);
  OCMStub([requirements identifiedEmail]).andReturn(nil);
  OCMStub([requirements commentMinLength]).andReturn(0);
  OCMStub([requirements commentMaxLength]).andReturn(4000);
  OCMStub([requirements consents]).andReturn(@[]);
  OCMStub([requirements extendedFields]).andReturn(@[]);
  OCMStub([requirements isScreenshotRequired]).andReturn(YES);
  OCMStub([requirements maxAttachments]).andReturn(3);
  OCMStub([requirements maxAttachmentBytes]).andReturn(5242880LL);
  id configuration = OCMClassMock([LCQReportConfiguration class]);
  OCMStub([configuration reportType]).andReturn(LCQBugReportingReportTypeFeedback);
  OCMStub([configuration categories]).andReturn(@[checkout]);
  OCMStub([configuration preselectedCategory]).andReturn(parent);
  OCMStub([configuration requirements]).andReturn(requirements);

  NSDictionary *dictionary = [configuration lcq_dictionaryRepresentation];

  XCTAssertEqualObjects(dictionary[@"reportType"], @"feedback");
  XCTAssertEqual([dictionary[@"categories"] count], 1);
  XCTAssertEqualObjects(dictionary[@"preselectedCategory"][@"identifier"], @"report-a-problem");
  XCTAssertEqualObjects(dictionary[@"preselectedCategory"][@"leaf"], @NO);
  XCTAssertEqualObjects(dictionary[@"preselectedCategory"][@"children"][0][@"children"][0][@"identifier"], @"checkout-refund");
  XCTAssertEqualObjects(dictionary[@"requirements"][@"email"], @"hidden");
  XCTAssertEqualObjects(dictionary[@"requirements"][@"identifiedEmail"], [NSNull null]);
  XCTAssertEqualObjects(dictionary[@"requirements"][@"screenshotRequired"], @YES);
}

- (void)testgivenConfiguration$getReportConfiguration_whenReady_thenShouldResolveDictionary {
  id mock = OCMClassMock([LCQBugReporting class]);
  id requirements = OCMClassMock([LCQReportRequirements class]);
  OCMStub([requirements email]).andReturn(LCQReportEmailRequirementOptional);
  OCMStub([requirements consents]).andReturn(@[]);
  OCMStub([requirements extendedFields]).andReturn(@[]);
  OCMStub([requirements maxAttachments]).andReturn(3);
  OCMStub([requirements maxAttachmentBytes]).andReturn(5242880LL);
  id configuration = OCMClassMock([LCQReportConfiguration class]);
  OCMStub([configuration reportType]).andReturn(LCQBugReportingReportTypeBug);
  OCMStub([configuration categories]).andReturn(@[]);
  OCMStub([configuration requirements]).andReturn(requirements);
  OCMStub([mock getReportConfigurationForType:LCQBugReportingReportTypeBug completion:[OCMArg invokeBlockWithArgs:configuration, nil]]);
  XCTestExpectation *expectation = [self expectationWithDescription:@"resolved"];

  [self.luciqBridge getReportConfiguration:LCQBugReportingReportTypeBug resolve:^(id result) {
    XCTAssertEqualObjects(result[@"reportType"], @"bug");
    XCTAssertEqualObjects(result[@"preselectedCategory"], [NSNull null]);
    [expectation fulfill];
  } reject:^(NSString *code, NSString *message, NSError *error) {
    XCTFail(@"should not reject: %@", code);
  }];

  [self waitForExpectationsWithTimeout:1 handler:nil];
}

- (void)testgivenNilConfiguration$getReportConfiguration_whenReady_thenShouldResolveNull {
  id mock = OCMClassMock([LCQBugReporting class]);
  OCMStub([mock getReportConfigurationForType:LCQBugReportingReportTypeFeedback completion:[OCMArg invokeBlockWithArgs:[NSNull null], nil]]);
  XCTestExpectation *expectation = [self expectationWithDescription:@"resolved"];

  [self.luciqBridge getReportConfiguration:LCQBugReportingReportTypeFeedback resolve:^(id result) {
    XCTAssertEqualObjects(result, [NSNull null]);
    [expectation fulfill];
  } reject:^(NSString *code, NSString *message, NSError *error) {
    XCTFail(@"should not reject: %@", code);
  }];

  [self waitForExpectationsWithTimeout:1 handler:nil];
}

- (void)testgivenQueued$submitReport_whenResult_thenShouldResolveQueued {
  id mock = OCMClassMock([LCQBugReporting class]);
  id result = [self resultWithStatus:LCQCustomReportStatusQueued reason:LCQCustomReportNotSentReasonNone errors:@[]];
  OCMStub([mock submitReport:[OCMArg checkWithBlock:^BOOL(LCQCustomReport *report) {
    return [report.comment isEqualToString:@"Refund was wrong"] && [report.categoryIdentifier isEqualToString:@"checkout-refund"];
  }] completion:[OCMArg invokeBlockWithArgs:result, nil]]);
  XCTestExpectation *expectation = [self expectationWithDescription:@"resolved"];

  [self.luciqBridge submitReport:LCQBugReportingReportTypeBug
                          report:@{@"comment": @"Refund was wrong", @"categoryIdentifier": @"checkout-refund", @"screenshot": @"currentScreen"}
                         resolve:^(id value) {
    XCTAssertEqualObjects(value, (@{@"status": @"queued", @"errors": @[]}));
    [expectation fulfill];
  } reject:^(NSString *code, NSString *message, NSError *error) {
    XCTFail(@"should not reject: %@", code);
  }];

  [self waitForExpectationsWithTimeout:1 handler:nil];
}

- (void)testgivenMalformedReport$submitReport_whenQuery_thenShouldRejectWithInvalidArgument {
  id mock = OCMClassMock([LCQBugReporting class]);
  OCMReject([mock submitReport:[OCMArg any] completion:[OCMArg any]]);
  XCTestExpectation *expectation = [self expectationWithDescription:@"rejected"];

  [self.luciqBridge submitReport:LCQBugReportingReportTypeBug
                          report:@{@"screenshot": @"fromGallery"}
                         resolve:^(id value) {
    XCTFail(@"should not resolve");
  } reject:^(NSString *code, NSString *message, NSError *error) {
    XCTAssertEqualObjects(code, @"LCQ_INVALID_ARGUMENT");
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:1 handler:nil];
}

- (void)testgivenUnknownType$submitReport_whenQuery_thenShouldRejectWithInvalidArgument {
  XCTestExpectation *expectation = [self expectationWithDescription:@"rejected"];

  [self.luciqBridge submitReport:(LCQBugReportingReportType)(LCQBugReportingReportTypeBug | LCQBugReportingReportTypeFeedback)
                          report:@{}
                         resolve:^(id value) {
    XCTFail(@"should not resolve");
  } reject:^(NSString *code, NSString *message, NSError *error) {
    XCTAssertEqualObjects(code, @"LCQ_INVALID_ARGUMENT");
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:1 handler:nil];
}

@end
