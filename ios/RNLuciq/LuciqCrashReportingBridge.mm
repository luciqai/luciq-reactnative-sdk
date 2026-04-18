#import "LuciqCrashReportingBridge.h"
#import "Util/LCQCrashReporting+CP.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNLuciqSpec/RNLuciqSpec.h>

@interface LuciqCrashReportingBridge () <NativeCrashReportingSpec>
@end
#endif

@implementation LuciqCrashReportingBridge

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
        @"LCQSendHandledJSCrash",
        @"LCQSendUnhandledJSCrash",
    ];
}

RCT_EXPORT_MODULE(LCQCrashReporting)

RCT_EXPORT_METHOD(setEnabled:(BOOL)isEnabled) {
    LCQCrashReporting.enabled = isEnabled;
}

RCT_EXPORT_METHOD(sendJSCrash:(NSDictionary *)data
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0ul);
    dispatch_async(queue, ^{
        [LCQCrashReporting cp_reportFatalCrashWithStackTrace:data];
        resolve([NSNull null]);
    });
}

RCT_EXPORT_METHOD(sendHandledJSCrash:(NSDictionary *)data
                  userAttributes:(nullable NSDictionary *)userAttributes
                  fingerprint:(nullable NSString *)fingerprint
                  nonFatalExceptionLevel:(nullable NSString *)nonFatalExceptionLevel
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    if ([fingerprint isKindOfClass:NSNull.class]) {
        fingerprint = nil;
    }
    if ([userAttributes isKindOfClass:NSNull.class]) {
        userAttributes = nil;
    }

    LCQNonFatalLevel level = LCQNonFatalLevelError;
    if (nonFatalExceptionLevel != nil && ![nonFatalExceptionLevel isKindOfClass:NSNull.class]) {
        level = (LCQNonFatalLevel)[nonFatalExceptionLevel intValue];
    }

    dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0ul);
    dispatch_async(queue, ^{
        [LCQCrashReporting cp_reportNonFatalCrashWithStackTrace:data
                                                          level:level
                                                 groupingString:fingerprint
                                                 userAttributes:userAttributes];
        resolve([NSNull null]);
    });
}

RCT_EXPORT_METHOD(setNDKCrashesEnabled:(BOOL)isEnabled
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    resolve([NSNull null]);
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeCrashReportingSpecJSI>(params);
}
#endif

@synthesize description;
@synthesize hash;
@synthesize superclass;

@end
