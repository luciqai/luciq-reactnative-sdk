#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <InstabugSDK/IBGTypes.h>
#import <React/RCTUIManager.h>
#import <InstabugSDK/IBGSessionReplay.h>
#import "LuciqSessionReplayBridge.h"

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
    IBGSessionReplay.enabled = isEnabled;
}

RCT_EXPORT_METHOD(setNetworkLogsEnabled:(BOOL)isEnabled) {
    IBGSessionReplay.networkLogsEnabled = isEnabled;
}

RCT_EXPORT_METHOD(setLuciqLogsEnabled:(BOOL)isEnabled) {
    IBGSessionReplay.IBGLogsEnabled = isEnabled;
}

RCT_EXPORT_METHOD(setUserStepsEnabled:(BOOL)isEnabled) {
    IBGSessionReplay.userStepsEnabled = isEnabled;
}

RCT_EXPORT_METHOD(getSessionReplayLink:
    (RCTPromiseResolveBlock) resolve :(RCTPromiseRejectBlock)reject) {
    NSString *link = IBGSessionReplay.sessionReplayLink;
    resolve(link);
}

- (NSArray<NSDictionary *> *)getNetworkLogsArray:
     (NSArray<IBGSessionMetadataNetworkLogs *>*) networkLogs {
     NSMutableArray<NSDictionary *> *networkLogsArray = [NSMutableArray array];

    for (IBGSessionMetadataNetworkLogs* log in networkLogs) {
          NSDictionary *nLog = @{@"url": log.url, @"statusCode": @(log.statusCode), @"duration": @(log.duration)};
          [networkLogsArray addObject:nLog];
    }
    return networkLogsArray;
}

- (NSDictionary *)getMetadataObjectMap:(IBGSessionMetadata *)metadataObject {
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
    [IBGSessionReplay setSyncCallbackWithHandler:^(IBGSessionMetadata * _Nonnull metadataObject, SessionEvaluationCompletion  _Nonnull completion) {

        [self sendEventWithName:@"LCQSessionReplayOnSyncCallback"
                           body:[self getMetadataObjectMap:metadataObject]];

        self.sessionEvaluationCompletion = completion;
    }];
}

RCT_EXPORT_METHOD(evaluateSync:(BOOL)result) {

    if (self.sessionEvaluationCompletion) {

        self.sessionEvaluationCompletion(result);

        self.sessionEvaluationCompletion = nil;

    }
}


@synthesize description;

@synthesize hash;

@synthesize superclass;

@end


