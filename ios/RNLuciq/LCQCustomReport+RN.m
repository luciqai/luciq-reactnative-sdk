//
//  LCQCustomReport+RN.m
//  RNLuciq
//

#import "LCQCustomReport+RN.h"

NSString *const LCQRNCustomReportErrorDomain = @"ai.luciq.reactnative.customreport";

static NSError *LCQRNInvalidArgument(NSString *message) {
    return [NSError errorWithDomain:LCQRNCustomReportErrorDomain
                               code:1
                           userInfo:@{NSLocalizedDescriptionKey: message}];
}

static BOOL LCQRNIsPresent(id value) {
    return value != nil && value != [NSNull null];
}

static NSString *LCQRNStatusName(LCQCustomReportStatus status) {
    switch (status) {
        case LCQCustomReportStatusQueued: return @"queued";
        case LCQCustomReportStatusNotSent: return @"notSent";
        case LCQCustomReportStatusInvalid: return @"invalid";
    }
    return @"notSent";
}

static NSString *_Nullable LCQRNNotSentReasonName(LCQCustomReportNotSentReason reason) {
    switch (reason) {
        case LCQCustomReportNotSentReasonNone: return nil;
        case LCQCustomReportNotSentReasonUnavailable: return @"unavailable";
        case LCQCustomReportNotSentReasonTryLater: return @"tryLater";
        case LCQCustomReportNotSentReasonDuplicate: return @"duplicate";
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
        case LCQCustomReportFieldAttachment: return @"attachment";
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

@implementation LCQCustomReport (RN)

/// Records `message` in `error` and returns nil, so callers can `return LCQRNReject(error, @"...")`.
static LCQCustomReport *_Nullable LCQRNReject(NSError *_Nullable *_Nullable error, NSString *message) {
    if (error) {
        *error = LCQRNInvalidArgument(message);
    }
    return nil;
}

+ (instancetype)lcq_reportWithType:(LCQBugReportingReportType)reportType
                        dictionary:(NSDictionary *)dictionary
                             error:(NSError **)error {
    LCQCustomReport *report = [[LCQCustomReport alloc] initWithReportType:reportType];
    if (!LCQRNIsPresent(dictionary)) {
        return report;
    }
    if (![dictionary isKindOfClass:[NSDictionary class]]) {
        return LCQRNReject(error, @"report must be an object");
    }

    id comment = dictionary[@"comment"];
    if (LCQRNIsPresent(comment)) {
        if (![comment isKindOfClass:[NSString class]]) {
            return LCQRNReject(error, @"comment must be a string");
        }
        report.comment = comment;
    }

    id email = dictionary[@"email"];
    if (LCQRNIsPresent(email)) {
        if (![email isKindOfClass:[NSString class]]) {
            return LCQRNReject(error, @"email must be a string");
        }
        report.email = email;
    }

    id category = dictionary[@"categoryIdentifier"];
    if (LCQRNIsPresent(category)) {
        if (![category isKindOfClass:[NSString class]]) {
            return LCQRNReject(error, @"categoryIdentifier must be a string");
        }
        report.categoryIdentifier = category;
    }

    id answers = dictionary[@"answers"];
    if (LCQRNIsPresent(answers)) {
        if (![answers isKindOfClass:[NSDictionary class]]) {
            return LCQRNReject(error, @"answers must be an object");
        }
        for (id fieldKey in answers) {
            if (![fieldKey isKindOfClass:[NSString class]]) {
                return LCQRNReject(error, @"answers keys must be strings");
            }
            id values = answers[fieldKey];
            if (!LCQRNIsPresent(values)) {
                [report setAnswerForFieldKey:fieldKey values:nil];
                continue;
            }
            if (![values isKindOfClass:[NSArray class]]) {
                return LCQRNReject(error, [NSString stringWithFormat:@"answers.%@ must be an array of strings", fieldKey]);
            }
            for (id value in values) {
                if (![value isKindOfClass:[NSString class]]) {
                    return LCQRNReject(error, [NSString stringWithFormat:@"answers.%@ must be an array of strings", fieldKey]);
                }
            }
            [report setAnswerForFieldKey:fieldKey values:values];
        }
    }

    id consents = dictionary[@"consents"];
    if (LCQRNIsPresent(consents)) {
        if (![consents isKindOfClass:[NSDictionary class]]) {
            return LCQRNReject(error, @"consents must be an object");
        }
        for (id key in consents) {
            id accepted = consents[key];
            if (![key isKindOfClass:[NSString class]] || ![accepted isKindOfClass:[NSNumber class]]) {
                return LCQRNReject(error, [NSString stringWithFormat:@"consents.%@ must be a boolean", key]);
            }
            [report setConsent:[accepted boolValue] forKey:key];
        }
    }

    id extendedFields = dictionary[@"extendedFields"];
    if (LCQRNIsPresent(extendedFields)) {
        if (![extendedFields isKindOfClass:[NSDictionary class]]) {
            return LCQRNReject(error, @"extendedFields must be an object");
        }
        for (id fieldID in extendedFields) {
            if (![fieldID isKindOfClass:[NSString class]]) {
                return LCQRNReject(error, @"extendedFields keys must be strings");
            }
            id value = extendedFields[fieldID];
            if (!LCQRNIsPresent(value)) {
                [report setExtendedFieldValue:nil forID:fieldID];
            } else if ([value isKindOfClass:[NSString class]]) {
                [report setExtendedFieldValue:value forID:fieldID];
            } else {
                return LCQRNReject(error, [NSString stringWithFormat:@"extendedFields.%@ must be a string or null", fieldID]);
            }
        }
    }

    id screenshot = dictionary[@"screenshot"];
    if (LCQRNIsPresent(screenshot)) {
        if ([@"none" isEqual:screenshot]) {
            report.screenshot = [LCQReportScreenshot none];
        } else if ([@"currentScreen" isEqual:screenshot]) {
            report.screenshot = [LCQReportScreenshot currentScreen];
        } else {
            return LCQRNReject(error, [NSString stringWithFormat:@"screenshot must be 'none' or 'currentScreen', got '%@'", screenshot]);
        }
    }

    id attachments = dictionary[@"attachments"];
    if (LCQRNIsPresent(attachments)) {
        if (![attachments isKindOfClass:[NSArray class]]) {
            return LCQRNReject(error, @"attachments must be an array");
        }
        NSUInteger index = 0;
        for (id uriString in attachments) {
            if (![uriString isKindOfClass:[NSString class]]) {
                return LCQRNReject(error, [NSString stringWithFormat:@"attachments[%lu] must be a URI string", (unsigned long)index]);
            }
            // Path and size rules are enforced by the SDK (a file inside the app container, <= 5 MiB).
            NSURL *url = [NSURL URLWithString:uriString];
            if (url == nil || url.scheme.length == 0) {
                url = [NSURL fileURLWithPath:uriString];
            }
            [report addAttachmentWithURL:url];
            index++;
        }
    }

    return report;
}

@end

@implementation LCQCustomReportResult (RN)

- (NSDictionary *)lcq_dictionaryRepresentation {
    NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
    dictionary[@"status"] = LCQRNStatusName(self.status);

    if (self.status == LCQCustomReportStatusNotSent) {
        dictionary[@"notSentReason"] = LCQRNNotSentReasonName(self.notSentReason) ?: @"unavailable";
    }

    NSMutableArray *errors = [NSMutableArray array];
    if (self.status == LCQCustomReportStatusInvalid) {
        for (LCQCustomReportFieldError *error in self.errors) {
            [errors addObject:[error lcq_dictionaryRepresentation]];
        }
    }
    dictionary[@"errors"] = errors;
    return dictionary;
}

+ (NSDictionary *)lcq_unavailableDictionary {
    return @{@"status": @"notSent", @"notSentReason": @"unavailable", @"errors": @[]};
}

@end

@implementation LCQCustomReportFieldError (RN)

- (NSDictionary *)lcq_dictionaryRepresentation {
    return @{
        @"field": LCQRNFieldName(self.field),
        @"key": self.key ?: [NSNull null],
        @"problem": LCQRNProblemName(self.problem),
    };
}

@end
