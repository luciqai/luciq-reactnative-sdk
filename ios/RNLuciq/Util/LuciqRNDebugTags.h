//
//  LuciqRNDebugTags.h
//  RNLuciq
//
//  Native iOS debug-log tag inventory mirroring src/constants/DebugTags.ts.
//
//  Each tag uses the same suffix as the JS-side tag with an `iOS-` segment
//  injected after the `LCQ-RN-` prefix, so a mixed JS+native log stream can
//  be filtered per platform while remaining grep-compatible across both.
//
//    JS:       LCQ-RN-APM-FLOW:
//    iOS:      LCQ-RN-iOS-APM-FLOW:
//    Android:  LCQ-RN-Android-APM-FLOW:
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface LuciqRNDebugTags : NSObject

@property (class, nonatomic, readonly) NSString *core;
@property (class, nonatomic, readonly) NSString *screenTracking;
@property (class, nonatomic, readonly) NSString *apmScreenLoading;
@property (class, nonatomic, readonly) NSString *apmScreenRendering;
@property (class, nonatomic, readonly) NSString *apmUITrace;
@property (class, nonatomic, readonly) NSString *apmAppLaunch;
@property (class, nonatomic, readonly) NSString *apmCustomSpan;
@property (class, nonatomic, readonly) NSString *apmFlow;
@property (class, nonatomic, readonly) NSString *apmNetwork;
@property (class, nonatomic, readonly) NSString *bugReporting;
@property (class, nonatomic, readonly) NSString *crashReporting;
@property (class, nonatomic, readonly) NSString *sessionReplay;
@property (class, nonatomic, readonly) NSString *privateView;
@property (class, nonatomic, readonly) NSString *featureFlags;
@property (class, nonatomic, readonly) NSString *network;
@property (class, nonatomic, readonly) NSString *xhr;
@property (class, nonatomic, readonly) NSString *surveys;
@property (class, nonatomic, readonly) NSString *replies;
@property (class, nonatomic, readonly) NSString *featureRequests;
@property (class, nonatomic, readonly) NSString *appState;

@end

NS_ASSUME_NONNULL_END
