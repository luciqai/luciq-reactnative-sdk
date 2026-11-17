//
//  LCQReportConfiguration+RN.m
//  RNLuciq
//

#import "LCQReportConfiguration+RN.h"

NSString *LCQRNReportTypeName(LCQBugReportingReportType reportType) {
    switch (reportType) {
        case LCQBugReportingReportTypeBug: return @"bug";
        case LCQBugReportingReportTypeFeedback: return @"feedback";
        case LCQBugReportingReportTypeQuestion: return @"question";
        default: return nil;
    }
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

static id LCQRNStringOrNull(NSString *_Nullable value) {
    return value ?: [NSNull null];
}

@implementation LCQReportConfiguration (RN)

- (NSDictionary *)lcq_dictionaryRepresentation {
    NSMutableArray *categories = [NSMutableArray array];
    for (LCQReportConfigurationCategory *category in self.categories) {
        [categories addObject:[category lcq_dictionaryRepresentation]];
    }
    return @{
        @"reportType": LCQRNReportTypeName(self.reportType) ?: @"bug",
        @"categories": categories,
        @"preselectedCategory": self.preselectedCategory
            ? [self.preselectedCategory lcq_dictionaryRepresentation]
            : [NSNull null],
        @"requirements": [self.requirements lcq_dictionaryRepresentation],
    };
}

@end

@implementation LCQReportConfigurationCategory (RN)

- (NSDictionary *)lcq_dictionaryRepresentation {
    NSMutableArray *children = [NSMutableArray array];
    for (LCQReportConfigurationCategory *child in self.children) {
        [children addObject:[child lcq_dictionaryRepresentation]];
    }
    NSMutableArray *fields = [NSMutableArray array];
    for (LCQReportConfigurationField *field in self.fields) {
        [fields addObject:[field lcq_dictionaryRepresentation]];
    }
    return @{
        @"identifier": self.identifier,
        @"title": self.title,
        @"description": LCQRNStringOrNull(self.categoryDescription),
        @"leaf": @(self.isLeaf),
        @"children": children,
        @"fields": fields,
    };
}

@end

@implementation LCQReportConfigurationField (RN)

- (NSDictionary *)lcq_dictionaryRepresentation {
    NSMutableArray *options = [NSMutableArray array];
    for (LCQReportConfigurationFieldOption *option in self.options) {
        [options addObject:@{@"key": option.key, @"label": option.label}];
    }
    return @{
        @"key": self.key,
        @"type": LCQRNFieldTypeName(self.type),
        @"label": LCQRNStringOrNull(self.label),
        @"placeholder": LCQRNStringOrNull(self.placeholder),
        @"required": @(self.isRequired),
        @"options": options,
    };
}

@end

@implementation LCQReportRequirements (RN)

- (NSDictionary *)lcq_dictionaryRepresentation {
    NSMutableArray *consents = [NSMutableArray array];
    for (LCQReportConsent *consent in self.consents) {
        [consents addObject:@{
            @"key": consent.key,
            @"description": LCQRNStringOrNull(consent.consentDescription),
            @"mandatory": @(consent.isMandatory),
            @"checkedByDefault": @(consent.isCheckedByDefault),
        }];
    }
    NSMutableArray *extendedFields = [NSMutableArray array];
    for (LCQReportExtendedField *field in self.extendedFields) {
        [extendedFields addObject:@{
            @"id": field.identifier,
            @"label": field.title,
            @"required": @(field.isRequired),
        }];
    }
    return @{
        @"email": LCQRNEmailRequirementName(self.email),
        @"identifiedEmail": LCQRNStringOrNull(self.identifiedEmail),
        @"commentMinLength": @(self.commentMinLength),
        @"commentMaxLength": @(self.commentMaxLength),
        @"consents": consents,
        @"extendedFields": extendedFields,
        @"screenshotRequired": @(self.isScreenshotRequired),
        @"maxAttachments": @(self.maxAttachments),
        @"maxAttachmentBytes": @(self.maxAttachmentBytes),
    };
}

@end
