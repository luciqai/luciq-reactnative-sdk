#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>
#import <LuciqSDK/LCQSessionReplay.h>
#import "LuciqSessionReplayBridge.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNLuciqSpec/RNLuciqSpec.h>

@interface LuciqSessionReplayBridge () <NativeSessionReplaySpec>
@end
#endif

@implementation LuciqSessionReplayBridge

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
        @"LCQSessionReplayOnSyncCallback",
    ];
}

RCT_EXPORT_MODULE(LCQSessionReplay)

RCT_EXPORT_METHOD(setEnabled:(BOOL)isEnabled) {
    LCQSessionReplay.enabled = isEnabled;
}

RCT_EXPORT_METHOD(setNetworkLogsEnabled:(BOOL)isEnabled) {
    LCQSessionReplay.networkLogsEnabled = isEnabled;
}

RCT_EXPORT_METHOD(setLuciqLogsEnabled:(BOOL)isEnabled) {
    LCQSessionReplay.LCQLogsEnabled = isEnabled;
}

RCT_EXPORT_METHOD(setUserStepsEnabled:(BOOL)isEnabled) {
    LCQSessionReplay.userStepsEnabled = isEnabled;
}

RCT_EXPORT_METHOD(getSessionReplayLink:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    NSString *link = LCQSessionReplay.sessionReplayLink;
    resolve(link);
}

- (NSArray<NSDictionary *> *)getNetworkLogsArray:
     (NSArray<LCQSessionMetadataNetworkLogs *>*)networkLogs {
     NSMutableArray<NSDictionary *> *networkLogsArray = [NSMutableArray array];

    for (LCQSessionMetadataNetworkLogs* log in networkLogs) {
          NSDictionary *nLog = @{@"url": log.url, @"statusCode": @(log.statusCode), @"duration": @(log.duration)};
          [networkLogsArray addObject:nLog];
    }
    return networkLogsArray;
}

- (NSDictionary *)getMetadataObjectMap:(LCQSessionMetadata *)metadataObject {
    return @{
        @"appVersion": metadataObject.appVersion,
        @"OS": metadataObject.os,
        @"device": metadataObject.device,
        @"sessionDurationInSeconds": @(metadataObject.sessionDuration),
        @"hasLinkToAppReview": @(metadataObject.hasLinkToAppReview),
        @"launchType": @(metadataObject.launchType),
        @"launchDuration": @(metadataObject.launchDuration),
        @"bugsCount": @(metadataObject.bugsCount),
        @"fatalCrashCount": @(metadataObject.fatalCrashCount),
        @"oomCrashCount": @(metadataObject.oomCrashCount),
        @"networkLogs": [self getNetworkLogsArray:metadataObject.networkLogs]
    };
}

RCT_EXPORT_METHOD(setSyncCallback:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    __weak LuciqSessionReplayBridge *weakSelf = self;
    [LCQSessionReplay setSyncCallbackWithHandler:^(LCQSessionMetadata * _Nonnull metadataObject, SessionEvaluationCompletion _Nonnull completion) {
        LuciqSessionReplayBridge *strongSelf = weakSelf;
        if (!strongSelf) { return; }
        [strongSelf sendEventWithName:@"LCQSessionReplayOnSyncCallback"
                                 body:[strongSelf getMetadataObjectMap:metadataObject]];
        strongSelf.sessionEvaluationCompletion = completion;
    }];
    resolve([NSNull null]);
}

RCT_EXPORT_METHOD(evaluateSync:(BOOL)result) {
    if (self.sessionEvaluationCompletion) {
        self.sessionEvaluationCompletion(result);
        self.sessionEvaluationCompletion = nil;
    }
}

RCT_EXPORT_METHOD(setCapturingMode:(NSString *)mode) {
    LCQSessionReplay.screenshotCapturingMode = (LCQScreenshotCapturingMode)[mode intValue];
}

RCT_EXPORT_METHOD(setScreenshotQuality:(NSString *)quality) {
    LCQSessionReplay.screenshotQualityMode = (LCQScreenshotQualityMode)[quality intValue];
}

RCT_EXPORT_METHOD(setScreenshotCaptureInterval:(double)intervalMs) {
    LCQSessionReplay.screenshotCaptureInterval = (NSInteger)intervalMs;
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeSessionReplaySpecJSI>(params);
}
#endif

@synthesize description;
@synthesize hash;
@synthesize superclass;

@end
