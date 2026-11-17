//
//  LCQReportConfiguration+RN.h
//  RNLuciq
//
//  Serialises an LCQReportConfiguration into the dictionary the JS layer expects
//  (see src/models/ReportConfiguration.ts and test/fixtures/customReport/configuration.*.json).
//

#import <Foundation/Foundation.h>
#import <LuciqSDK/LCQTypes.h>
#import <LuciqSDK/LCQReportConfiguration.h>

NS_ASSUME_NONNULL_BEGIN

/// 'bug', 'feedback' or 'question'; nil for a value that is not exactly one report type.
FOUNDATION_EXPORT NSString *_Nullable LCQRNReportTypeName(LCQBugReportingReportType reportType);

@interface LCQReportConfiguration (RN)
- (NSDictionary *)lcq_dictionaryRepresentation;
@end

@interface LCQReportConfigurationCategory (RN)
- (NSDictionary *)lcq_dictionaryRepresentation;
@end

@interface LCQReportConfigurationField (RN)
- (NSDictionary *)lcq_dictionaryRepresentation;
@end

@interface LCQReportRequirements (RN)
- (NSDictionary *)lcq_dictionaryRepresentation;
@end

NS_ASSUME_NONNULL_END
