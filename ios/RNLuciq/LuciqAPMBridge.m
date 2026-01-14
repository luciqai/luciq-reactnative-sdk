

#import "LuciqAPMBridge.h"
#import <LuciqSDK/LCQAPM.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>
#import "Util/LCQAPM+PrivateAPIs.h"

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

- (id) init
{
    self = [super init];
    return self;
}

// Pauses the current thread for 3 seconds.
RCT_EXPORT_METHOD(LCQSleep) {
    [NSThread sleepForTimeInterval:3.0f];
}

// Enables or disables APM.
RCT_EXPORT_METHOD(setEnabled:(BOOL)isEnabled) {
    LCQAPM.enabled = isEnabled;
}

// Determines either coldAppLaunch is enabled or not.
RCT_EXPORT_METHOD(setAppLaunchEnabled:(BOOL)isEnabled) {
    LCQAPM.coldAppLaunchEnabled = isEnabled;
}

// This method is used to signal the end of the app launch process.
RCT_EXPORT_METHOD(endAppLaunch) {
    [LCQAPM endAppLaunch];
}

// Controls whether automatic tracing of UI interactions is enabled or disabled within the SDK.
RCT_EXPORT_METHOD(setAutoUITraceEnabled:(BOOL)isEnabled) {
    LCQAPM.autoUITraceEnabled = isEnabled;
}

// Starts a flow trace with the specified `name`,
// allowing the SDK to capture and analyze the flow of execution within the application.
RCT_EXPORT_METHOD(startFlow: (NSString *)name) {
    [LCQAPM startFlowWithName:name];
}

// Ends a flow with the specified `name`.
RCT_EXPORT_METHOD(endFlow: (NSString *)name) {
    [LCQAPM endFlowWithName:name];
}


// Sets a user defined attribute for the currently active flow.
RCT_EXPORT_METHOD(setFlowAttribute:(NSString *)name :(NSString *)key :(NSString *_Nullable)value) {
    [LCQAPM setAttributeForFlowWithName:name key:key value:value];
}

// Starts a new `UITrace` with the provided `name` parameter,
// allowing the SDK to capture and analyze the UI components within the application.
RCT_EXPORT_METHOD(startUITrace:(NSString *)name) {
    [LCQAPM startUITraceWithName:name];
}

// Terminates the currently active UI trace.
RCT_EXPORT_METHOD(endUITrace) {
    [LCQAPM endUITrace];
}

// Enables or disables screen render.
RCT_EXPORT_METHOD(setScreenRenderingEnabled:(BOOL)isEnabled) {
    LCQAPM.screenRenderingEnabled = isEnabled;
}

// Syncs a custom span to the native SDK (currently logs only)
RCT_EXPORT_METHOD(syncCustomSpan:(NSString *)name
                  startTimestamp:(double)startTimestamp
                  endTimestamp:(double)endTimestamp
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        // Convert microseconds → seconds (NSDate uses seconds)
        NSTimeInterval startSeconds = startTimestamp / 1e6;
        NSTimeInterval endSeconds   = endTimestamp / 1e6;

        NSDate *startDate = [NSDate dateWithTimeIntervalSince1970:startSeconds];
        NSDate *endDate   = [NSDate dateWithTimeIntervalSince1970:endSeconds];

        // Add completed span to APM
        [LCQAPM addCompletedCustomSpanWithName:name
                                     startDate:startDate
                                       endDate:endDate];

        resolve(@YES);
    }
    @catch (NSException *exception) {
        reject(
            @"SYNC_CUSTOM_SPAN_ERROR",
            exception.reason ?: @"Failed to sync custom span",
            nil
        );
    }
}

// Checks if custom spans feature is enabled
RCT_EXPORT_METHOD(isCustomSpanEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL enabled = LCQAPM.customSpansEnabled;
        resolve(@(enabled));
    } @catch (NSException *exception) {
        NSLog(@"[CustomSpan] Error checking feature flag: %@", exception);
        resolve(@NO);
    }
}

// Checks if APM is enabled
RCT_EXPORT_METHOD(isAPMEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL enabled = LCQAPM.enabled;
        resolve(@(enabled));
    } @catch (NSException *exception) {
        NSLog(@"[CustomSpan] Error checking APM enabled: %@", exception);
        resolve(@NO);
    }
}



@synthesize description;

@synthesize hash;

@synthesize superclass;

@end

