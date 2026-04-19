#import "LuciqAPMBridge.h"
#import <LuciqSDK/LCQAPM.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>
#import "Util/LCQAPM+PrivateAPIs.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNLuciqSpec/RNLuciqSpec.h>

@interface LuciqAPMBridge () <NativeAPMSpec>
@end
#endif

@implementation LuciqAPMBridge

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[];
}

RCT_EXPORT_MODULE(LCQAPM)

- (id)init
{
    self = [super init];
    return self;
}

RCT_EXPORT_METHOD(lcqSleep) {
    [NSThread sleepForTimeInterval:3.0f];
}

RCT_EXPORT_METHOD(setEnabled:(BOOL)isEnabled) {
    LCQAPM.enabled = isEnabled;
}

RCT_EXPORT_METHOD(setAppLaunchEnabled:(BOOL)isEnabled) {
    LCQAPM.coldAppLaunchEnabled = isEnabled;
}

RCT_EXPORT_METHOD(endAppLaunch) {
    [LCQAPM endAppLaunch];
}

RCT_EXPORT_METHOD(setAutoUITraceEnabled:(BOOL)isEnabled) {
    LCQAPM.autoUITraceEnabled = isEnabled;
}

RCT_EXPORT_METHOD(startFlow:(NSString *)name) {
    [LCQAPM startFlowWithName:name];
}

RCT_EXPORT_METHOD(endFlow:(NSString *)name) {
    [LCQAPM endFlowWithName:name];
}

RCT_EXPORT_METHOD(setFlowAttribute:(NSString *)name
                  key:(NSString *)key
                  value:(NSString * _Nullable)value) {
    [LCQAPM setAttributeForFlowWithName:name key:key value:value];
}

RCT_EXPORT_METHOD(startUITrace:(NSString *)name) {
    [LCQAPM startUITraceWithName:name];
}

RCT_EXPORT_METHOD(endUITrace) {
    [LCQAPM endUITrace];
}

RCT_EXPORT_METHOD(setScreenRenderingEnabled:(BOOL)isEnabled) {
    LCQAPM.screenRenderingEnabled = isEnabled;
}

RCT_EXPORT_METHOD(networkLogAndroid:(double)requestStartTime
                  requestDuration:(double)requestDuration
                  requestHeaders:(NSString *)requestHeaders
                  requestBody:(NSString *)requestBody
                  requestBodySize:(double)requestBodySize
                  requestMethod:(NSString *)requestMethod
                  requestUrl:(NSString *)requestUrl
                  requestContentType:(NSString *)requestContentType
                  responseHeaders:(NSString *)responseHeaders
                  responseBody:(NSString * _Nullable)responseBody
                  responseBodySize:(double)responseBodySize
                  statusCode:(double)statusCode
                  responseContentType:(NSString *)responseContentType
                  errorDomain:(NSString *)errorDomain
                  w3cExternalTraceAttributes:(NSDictionary *)w3cExternalTraceAttributes
                  gqlQueryName:(NSString * _Nullable)gqlQueryName
                  serverErrorMessage:(NSString * _Nullable)serverErrorMessage) {
    // Android-only; iOS no-op to satisfy unified spec.
}

RCT_EXPORT_METHOD(syncCustomSpan:(NSString *)name
                  startTimestamp:(double)startTimestamp
                  endTimestamp:(double)endTimestamp
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSTimeInterval startSeconds = startTimestamp / 1e6;
        NSTimeInterval endSeconds   = endTimestamp / 1e6;

        NSDate *startDate = [NSDate dateWithTimeIntervalSince1970:startSeconds];
        NSDate *endDate   = [NSDate dateWithTimeIntervalSince1970:endSeconds];

        [LCQAPM addCompletedCustomSpanWithName:name
                                     startDate:startDate
                                       endDate:endDate];

        resolve(@YES);
    }
    @catch (NSException *exception) {
        reject(@"SYNC_CUSTOM_SPAN_ERROR",
               exception.reason ?: @"Failed to sync custom span",
               nil);
    }
}

RCT_EXPORT_METHOD(isCustomSpanEnabled:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL enabled = LCQAPM.customSpansEnabled;
        resolve(@(enabled));
    } @catch (NSException *exception) {
        NSLog(@"[CustomSpan] Error checking feature flag: %@", exception);
        resolve(@NO);
    }
}

RCT_EXPORT_METHOD(isAPMEnabled:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL enabled = LCQAPM.enabled;
        resolve(@(enabled));
    } @catch (NSException *exception) {
        NSLog(@"[CustomSpan] Error checking APM enabled: %@", exception);
        resolve(@NO);
    }
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeAPMSpecJSI>(params);
}
#endif

@synthesize description;
@synthesize hash;
@synthesize superclass;

@end
