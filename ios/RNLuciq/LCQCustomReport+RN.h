//
//  LCQCustomReport+RN.h
//  RNLuciq
//
//  Maps custom reports, their results and report configurations between the SDK types and
//  the JS shapes (src/models/CustomReport.ts, CustomReportResult.ts, ReportConfiguration.ts;
//  samples in test/fixtures/customReport). Enums cross the bridge by lower-camel name, as on Android.
//

#import <Foundation/Foundation.h>
#import <LuciqSDK/LCQTypes.h>
#import <LuciqSDK/LCQCustomReport.h>
#import <LuciqSDK/LCQReportConfiguration.h>

NS_ASSUME_NONNULL_BEGIN

@interface LCQCustomReport (RN)

/// @param dictionary the payload JS builds with toNativeCustomReport: types already checked, no null entries.
+ (instancetype)lcq_reportWithType:(LCQBugReportingReportType)reportType
                        dictionary:(nullable NSDictionary *)dictionary;

@end

@interface LCQCustomReportResult (RN)

/// { status, notSentReason?, errors: [{ field, key, problem }] }
- (NSDictionary *)lcq_dictionaryRepresentation;

@end

@interface LCQReportConfiguration (RN)

/// { categories, preselectedCategory, requirements }; JS adds the report type it asked for.
- (NSDictionary *)lcq_dictionaryRepresentation;

@end

NS_ASSUME_NONNULL_END
