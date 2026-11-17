//
//  LCQCustomReport+RN.h
//  RNLuciq
//
//  Bridges the React Native custom report payload and result (see
//  src/models/CustomReport.ts, src/models/CustomReportResult.ts and the
//  fixtures under test/fixtures/customReport) to the Luciq SDK types.
//

#import <Foundation/Foundation.h>
#import <LuciqSDK/LCQTypes.h>
#import <LuciqSDK/LCQCustomReport.h>

NS_ASSUME_NONNULL_BEGIN

/// Thrown (as an NSError in the `LCQRNCustomReportErrorDomain` domain) when the JS payload has the wrong shape.
FOUNDATION_EXPORT NSString *const LCQRNCustomReportErrorDomain;

@interface LCQCustomReport (RN)

/**
 Builds a report from the dictionary JS sends: `comment`, `email`, `categoryIdentifier`
 (strings or null), `answers` ({ key: [string] }), `consents` ({ key: bool }),
 `extendedFields` ({ id: string | null }), `screenshot` ('none' | 'currentScreen') and
 `attachments` ([uri string]). `NSNull` values are treated as absent, except that a
 null answer or extended field clears it.

 Only the shape is checked: limits, unknown keys and attachment path rules are
 validated by the SDK and reported in the result.

 @return the report, or nil (with `error` set) when a value has the wrong type.
 */
+ (nullable instancetype)lcq_reportWithType:(LCQBugReportingReportType)reportType
                                 dictionary:(nullable NSDictionary *)dictionary
                                      error:(NSError *_Nullable *_Nullable)error;

@end

@interface LCQCustomReportResult (RN)

/// `{ status, notSentReason?, errors: [{ field, key, problem }] }` with lower-camel enum names, never ordinals.
- (NSDictionary *)lcq_dictionaryRepresentation;

/// The result resolved when the bridge itself fails after handing the report to the SDK.
+ (NSDictionary *)lcq_unavailableDictionary;

@end

@interface LCQCustomReportFieldError (RN)

- (NSDictionary *)lcq_dictionaryRepresentation;

@end

NS_ASSUME_NONNULL_END
