#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>
#import <LuciqSDK/LCQSessionReplay.h>
#import "LuciqSessionReplayBridge.h"
#import "Util/LuciqRNDebugTags.h"
#import "Util/LuciqRNLogger.h"

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
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[setEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQSessionReplay.enabled = isEnabled;
}

RCT_EXPORT_METHOD(setNetworkLogsEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[setNetworkLogsEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQSessionReplay.networkLogsEnabled = isEnabled;
}

RCT_EXPORT_METHOD(setLuciqLogsEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[setLuciqLogsEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQSessionReplay.LCQLogsEnabled = isEnabled;
}

RCT_EXPORT_METHOD(setUserStepsEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[setUserStepsEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQSessionReplay.userStepsEnabled = isEnabled;
}

RCT_EXPORT_METHOD(getSessionReplayLink:
    (RCTPromiseResolveBlock) resolve :(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[getSessionReplayLink] called"];
    NSString *link = LCQSessionReplay.sessionReplayLink;
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[getSessionReplayLink] success result=%@", [LuciqRNLogger redactURL:link]];
    resolve(link);
}

- (NSArray<NSDictionary *> *)getNetworkLogsArray:
     (NSArray<LCQSessionMetadataNetworkLogs *>*) networkLogs {
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
        @"networkLogs":[self getNetworkLogsArray:metadataObject.networkLogs]
    };
}

RCT_EXPORT_METHOD(setSyncCallback) {
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[setSyncCallback] called"];
    [LCQSessionReplay setSyncCallbackWithHandler:^(LCQSessionMetadata * _Nonnull metadataObject, SessionEvaluationCompletion  _Nonnull completion) {

        [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[LCQSessionReplayOnSyncCallback] emitted"];
        [self sendEventWithName:@"LCQSessionReplayOnSyncCallback"
                           body:[self getMetadataObjectMap:metadataObject]];

        self.sessionEvaluationCompletion = completion;
    }];
}

RCT_EXPORT_METHOD(evaluateSync:(BOOL)result) {
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[evaluateSync] called result=%@", (result ? @"YES" : @"NO")];

    if (self.sessionEvaluationCompletion) {

        self.sessionEvaluationCompletion(result);

        self.sessionEvaluationCompletion = nil;

    }
}

RCT_EXPORT_METHOD(setCapturingMode:(LCQScreenshotCapturingMode)mode) {
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[setCapturingMode] called mode=%ld", (long)mode];
    LCQSessionReplay.screenshotCapturingMode = mode;
}

RCT_EXPORT_METHOD(setScreenshotQuality:(LCQScreenshotQualityMode)quality) {
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[setScreenshotQuality] called quality=%ld", (long)quality];
    LCQSessionReplay.screenshotQualityMode = quality;
}

RCT_EXPORT_METHOD(setScreenshotCaptureInterval:(NSInteger)intervalMs) {
    [LuciqRNLogger d:[LuciqRNDebugTags sessionReplay] format:@"[setScreenshotCaptureInterval] called intervalMs=%ld", (long)intervalMs];
    LCQSessionReplay.screenshotCaptureInterval = intervalMs;
}

@synthesize description;

@synthesize hash;

@synthesize superclass;

@end


