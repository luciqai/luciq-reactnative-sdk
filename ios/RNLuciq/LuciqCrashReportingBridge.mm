#import "LuciqCrashReportingBridge.h"
#import "Util/LCQCrashReporting+CP.h"
#import "Util/LuciqRNDebugTags.h"
#import "Util/LuciqRNLogger.h"


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

RCT_EXPORT_METHOD(setEnabled: (BOOL) isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags crashReporting] format:@"[setEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQCrashReporting.enabled = isEnabled;
}

RCT_EXPORT_METHOD(sendJSCrash:(NSDictionary *)stackTrace
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags crashReporting] format:@"[sendJSCrash] called stackTraceCount=%lu", (unsigned long)stackTrace.count];

    dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0ul);
    dispatch_async(queue, ^{
        [LCQCrashReporting cp_reportFatalCrashWithStackTrace:stackTrace];
        [LuciqRNLogger d:[LuciqRNDebugTags crashReporting] format:@"[sendJSCrash] success result=%@", [NSNull null]];
        resolve([NSNull null]);
    });
}

RCT_EXPORT_METHOD(sendHandledJSCrash: (NSDictionary *)stackTrace
                  userAttributes:(nullable NSDictionary *)userAttributes fingerprint:(nullable NSString *)fingerprint nonFatalExceptionLevel:(LCQNonFatalLevel)nonFatalExceptionLevel
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags crashReporting] format:@"[sendHandledJSCrash] called stackTraceCount=%lu userAttributesCount=%lu fingerprintLength=%lu fingerprintPresent=%@ nonFatalExceptionLevel=%ld", (unsigned long)stackTrace.count, (unsigned long)userAttributes.count, (unsigned long)fingerprint.length, (fingerprint != nil ? @"YES" : @"NO"), (long)nonFatalExceptionLevel];

    if([fingerprint isKindOfClass:NSNull.class]){
        fingerprint = nil;
    }

    if([userAttributes isKindOfClass:NSNull.class]){
        userAttributes = nil;
    }
    dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0ul);
    dispatch_async(queue, ^{
        [LCQCrashReporting cp_reportNonFatalCrashWithStackTrace:stackTrace level:nonFatalExceptionLevel groupingString:fingerprint userAttributes:userAttributes];

        [LuciqRNLogger d:[LuciqRNDebugTags crashReporting] format:@"[sendHandledJSCrash] success result=%@", [NSNull null]];
        resolve([NSNull null]);
    });

}
@synthesize description;

@synthesize hash;

@synthesize superclass;

@end


