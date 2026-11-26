//
//  LCQCustomReport+RN.m
//  RNLuciq
//

#import "LCQCustomReport+RN.h"

static NSString *LCQRNStatusName(LCQCustomReportStatus status) {
    switch (status) {
        case LCQCustomReportStatusQueued: return @"queued";
        case LCQCustomReportStatusNotSent: return @"notSent";
        case LCQCustomReportStatusInvalid: return @"invalid";
    }
    return @"notSent";
}

static NSString *LCQRNNotSentReasonName(LCQCustomReportNotSentReason reason) {
    switch (reason) {
        case LCQCustomReportNotSentReasonTryLater: return @"tryLater";
        case LCQCustomReportNotSentReasonDuplicate: return @"duplicate";
        case LCQCustomReportNotSentReasonNotApplicable:
        case LCQCustomReportNotSentReasonUnavailable: return @"unavailable";
    }
    return @"unavailable";
}

static NSString *LCQRNFieldName(LCQCustomReportField field) {
    switch (field) {
        case LCQCustomReportFieldCategory: return @"category";
        case LCQCustomReportFieldAnswer: return @"answer";
        case LCQCustomReportFieldComment: return @"comment";
        case LCQCustomReportFieldEmail: return @"email";
        case LCQCustomReportFieldConsent: return @"consent";
        case LCQCustomReportFieldExtendedField: return @"extendedField";
        case LCQCustomReportFieldScreenshot: return @"screenshot";
    }
    return @"category";
}

static NSString *LCQRNProblemName(LCQCustomReportProblem problem) {
    switch (problem) {
        case LCQCustomReportProblemMissing: return @"missing";
        case LCQCustomReportProblemUnknown: return @"unknown";
        case LCQCustomReportProblemInvalid: return @"invalid";
        case LCQCustomReportProblemTooShort: return @"tooShort";
        case LCQCustomReportProblemTooLong: return @"tooLong";
    }
    return @"invalid";
}

static NSString *LCQRNFieldTypeName(LCQReportConfigurationFieldType type) {
    switch (type) {
        case LCQReportConfigurationFieldTypeCheckbox: return @"checkbox";
        case LCQReportConfigurationFieldTypeSearch: return @"search";
        case LCQReportConfigurationFieldTypeDropdown: return @"dropdown";
        case LCQReportConfigurationFieldTypeText: return @"text";
    }
    return @"text";
}

static NSString *LCQRNEmailRequirementName(LCQReportEmailRequirement requirement) {
    switch (requirement) {
        case LCQReportEmailRequirementHidden: return @"hidden";
        case LCQReportEmailRequirementOptional: return @"optional";
        case LCQReportEmailRequirementRequired: return @"required";
    }
    return @"optional";
}

static NSDictionary *LCQRNCategoryDictionary(LCQReportConfigurationCategory *category);

static NSArray *LCQRNCategoryDictionaries(NSArray<LCQReportConfigurationCategory *> *categories) {
    NSMutableArray *dictionaries = [NSMutableArray array];
    for (LCQReportConfigurationCategory *category in categories) {
        [dictionaries addObject:LCQRNCategoryDictionary(category)];
    }
    return dictionaries;
}

static NSDictionary *LCQRNCategoryDictionary(LCQReportConfigurationCategory *category) {
    NSMutableArray *fields = [NSMutableArray array];
    for (LCQReportConfigurationField *field in category.fields) {
        NSMutableArray *options = [NSMutableArray array];
        for (LCQReportConfigurationFieldOption *option in field.options) {
            [options addObject:@{@"key": option.key, @"label": option.label}];
        }
        [fields addObject:@{
            @"key": field.key,
            @"type": LCQRNFieldTypeName(field.type),
            @"label": field.label ?: [NSNull null],
            @"placeholder": field.placeholder ?: [NSNull null],
            @"required": @(field.isRequired),
            @"options": options,
        }];
    }
    return @{
        @"identifier": category.identifier,
        @"title": category.title,
        @"description": category.categoryDescription ?: [NSNull null],
        @"leaf": @(category.isLeaf),
        @"children": LCQRNCategoryDictionaries(category.children),
        @"fields": fields,
    };
}

@implementation LCQCustomReport (RN)

+ (instancetype)lcq_reportWithType:(LCQBugReportingReportType)reportType dictionary:(NSDictionary *)dictionary {
    LCQCustomReport *report = [[LCQCustomReport alloc] initWithReportType:reportType];
    report.comment = dictionary[@"comment"];
    report.email = dictionary[@"email"];
    report.categoryIdentifier = dictionary[@"categoryIdentifier"];
    id screenshot = dictionary[@"screenshot"];
    if ([screenshot isKindOfClass:[NSDictionary class]]) {
        // { imageUri }: a file path or file:// URI. A path without a scheme is a file path, as on Android.
        NSString *path = screenshot[@"imageUri"];
        if ([path hasPrefix:@"file://"]) {
            // URLWithString: is nil for a URI that isn't percent-encoded (a space in it) before iOS 17.
            path = [NSURL URLWithString:path].path ?: [path substringFromIndex:@"file://".length];
        }
        UIImage *image = [UIImage imageWithContentsOfFile:path];
        // An image that can't be read becomes an empty one, which the SDK answers invalid for.
        report.screenshot = [LCQReportScreenshot fromImage:image ?: [[UIImage alloc] init]];
    } else if ([screenshot isEqual:@"currentScreen"]) {
        report.screenshot = [LCQReportScreenshot currentScreen];
    }
    [dictionary[@"answers"] enumerateKeysAndObjectsUsingBlock:^(NSString *key, NSArray<NSString *> *values, BOOL *stop) {
        [report setAnswerForFieldKey:key values:values];
    }];
    [dictionary[@"consents"] enumerateKeysAndObjectsUsingBlock:^(NSString *key, NSNumber *accepted, BOOL *stop) {
        [report setConsent:accepted.boolValue forKey:key];
    }];
    [dictionary[@"extendedFields"] enumerateKeysAndObjectsUsingBlock:^(NSString *fieldID, NSString *value, BOOL *stop) {
        [report setExtendedFieldValue:value forID:fieldID];
    }];
    return report;
}

@end

@implementation LCQCustomReportResult (RN)

- (NSDictionary *)lcq_dictionaryRepresentation {
    NSMutableArray *errors = [NSMutableArray array];
    for (LCQCustomReportFieldError *error in self.errors) {
        [errors addObject:@{
            @"field": LCQRNFieldName(error.field),
            @"key": error.key ?: [NSNull null],
            @"problem": LCQRNProblemName(error.problem),
        }];
    }
    NSMutableDictionary *dictionary = [@{@"status": LCQRNStatusName(self.status), @"errors": errors} mutableCopy];
    if (self.status == LCQCustomReportStatusNotSent) {
        dictionary[@"notSentReason"] = LCQRNNotSentReasonName(self.notSentReason);
    }
    return dictionary;
}

@end

@implementation LCQReportConfiguration (RN)

- (NSDictionary *)lcq_dictionaryRepresentation {
    LCQReportRequirements *requirements = self.requirements;
    NSMutableArray *consents = [NSMutableArray array];
    for (LCQReportConsent *consent in requirements.consents) {
        [consents addObject:@{
            @"key": consent.key,
            @"description": consent.consentDescription ?: [NSNull null],
            @"mandatory": @(consent.isMandatory),
            @"checkedByDefault": @(consent.isCheckedByDefault),
        }];
    }
    NSMutableArray *extendedFields = [NSMutableArray array];
    for (LCQReportExtendedField *field in requirements.extendedFields) {
        [extendedFields addObject:@{@"id": field.identifier, @"label": field.title, @"required": @(field.isRequired)}];
    }
    return @{
        @"categories": LCQRNCategoryDictionaries(self.categories),
        @"preselectedCategory": self.preselectedCategory ? LCQRNCategoryDictionary(self.preselectedCategory) : [NSNull null],
        @"requirements": @{
            @"email": LCQRNEmailRequirementName(requirements.email),
            @"identifiedEmail": requirements.identifiedEmail ?: [NSNull null],
            @"commentMinLength": @(requirements.commentMinLength),
            @"commentMaxLength": @(requirements.commentMaxLength),
            @"consents": consents,
            @"extendedFields": extendedFields,
            @"screenshotRequired": @(requirements.isScreenshotRequired),
        },
    };
}

@end
