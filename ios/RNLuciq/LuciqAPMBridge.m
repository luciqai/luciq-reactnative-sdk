

#import "LuciqAPMBridge.h"
#import <LuciqSDK/LCQAPM.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>
#import "Util/LCQAPM+PrivateAPIs.h"
#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTRootView.h>
#import <Foundation/Foundation.h>
#import "RNLuciqStartup.m"

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
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        // Default detailed startup flows to ON early before JS runs
        if (![[NSUserDefaults standardUserDefaults] objectForKey:@"LCQEnableDetailedStartupFlows"]) {
            [[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"LCQEnableDetailedStartupFlows"];
        }
        // Observe when the first RN content appears to end app launch precisely once
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(rn_contentDidAppear:)
                                                     name:@"RCTContentDidAppearNotification"
                                                   object:nil];

        // Observe JS bundle download/execute lifecycle where available
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(rn_jsWillStartLoading:)
                                                     name:@"RCTJavaScriptWillStartLoadingNotification"
                                                   object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(rn_jsDidLoad:)
                                                     name:@"RCTJavaScriptDidLoadNotification"
                                                   object:nil];

        // Per-native-module setup spans (gated by detailed flag)
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(rn_moduleDidInitialize:)
                                                     name:@"RCTDidInitializeModuleNotification"
                                                   object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(rn_moduleDidSetup:)
                                                     name:@"RCTDidSetupModuleNotification"
                                                   object:nil];
    });
    return self;
}

- (void)rn_contentDidAppear:(NSNotification *)notification
{
    static BOOL launchEnded = NO;
    if (!launchEnded) {
        launchEnded = YES;
        dispatch_async(dispatch_get_main_queue(), ^{
            @try {
                [LCQAPM endAppLaunch];
                RCTLogInfo(@"LCQ-Startup: END: APP_LAUNCH %lld", (long long)([[NSDate date] timeIntervalSince1970] * 1000));
            } @catch (NSException *exception) {
                RCTLogWarn(@"LCQAPM endAppLaunch threw: %@", exception);
            }
        });
    }
}

- (void)rn_jsWillStartLoading:(NSNotification *)notification
{
    BOOL enabled = [[NSUserDefaults standardUserDefaults] boolForKey:@"LCQEnableDetailedStartupFlows"];
    if (!enabled) { return; }
    dispatch_async(dispatch_get_main_queue(), ^{
        @try { [LCQAPM startFlowWithName:@"RN_JS_BUNDLE"]; } @catch (__unused NSException *e) {}
        RCTLogInfo(@"LCQ-Startup: START: RN_JS_BUNDLE %lld", (long long)([[NSDate date] timeIntervalSince1970] * 1000));
    });
}

- (void)rn_jsDidLoad:(NSNotification *)notification
{
    BOOL enabled = [[NSUserDefaults standardUserDefaults] boolForKey:@"LCQEnableDetailedStartupFlows"];
    if (!enabled) { return; }
    dispatch_async(dispatch_get_main_queue(), ^{
        @try { [LCQAPM endFlowWithName:@"RN_JS_BUNDLE"]; } @catch (__unused NSException *e) {}
        RCTLogInfo(@"LCQ-Startup: END: RN_JS_BUNDLE %lld", (long long)([[NSDate date] timeIntervalSince1970] * 1000));
    });
}

- (void)rn_moduleDidInitialize:(NSNotification *)notification
{
    BOOL enabled = [[NSUserDefaults standardUserDefaults] boolForKey:@"LCQEnableDetailedStartupFlows"];
    if (!enabled) { return; }
    NSString *moduleName = notification.userInfo[@"module_name"] ?: notification.object;
    if (![moduleName isKindOfClass:[NSString class]] || moduleName.length == 0) {
        return;
    }
    NSString *flowName = [NSString stringWithFormat:@"RN_NATIVE_MODULE_SETUP:%@", moduleName];
    dispatch_async(dispatch_get_main_queue(), ^{
        @try { [LCQAPM startFlowWithName:flowName]; } @catch (__unused NSException *e) {}
        RCTLogInfo(@"LCQ-Startup: START: %@ %lld", flowName, (long long)([[NSDate date] timeIntervalSince1970] * 1000));
    });
}

- (void)rn_moduleDidSetup:(NSNotification *)notification
{
    BOOL enabled = [[NSUserDefaults standardUserDefaults] boolForKey:@"LCQEnableDetailedStartupFlows"];
    if (!enabled) { return; }
    NSString *moduleName = notification.userInfo[@"module_name"] ?: notification.object;
    if (![moduleName isKindOfClass:[NSString class]] || moduleName.length == 0) {
        return;
    }
    NSString *flowName = [NSString stringWithFormat:@"RN_NATIVE_MODULE_SETUP:%@", moduleName];
    dispatch_async(dispatch_get_main_queue(), ^{
        @try { [LCQAPM endFlowWithName:flowName]; } @catch (__unused NSException *e) {}
        RCTLogInfo(@"LCQ-Startup: END: %@ %lld", flowName, (long long)([[NSDate date] timeIntervalSince1970] * 1000));
    });
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

// Enable/disable detailed startup flows on native side (persisted)
RCT_EXPORT_METHOD(setDetailedStartupFlowsEnabled:(BOOL)isEnabled) {
    [[NSUserDefaults standardUserDefaults] setBool:isEnabled forKey:@"LCQEnableDetailedStartupFlows"];
}

// Returns elapsed microseconds since process start using monotonic clock
RCT_REMAP_METHOD(getElapsedSinceAppStartMicros,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        uint64_t us = lcq_elapsed_us_since_start();
        resolve(@((double)us));
    } @catch (NSException *exception) {
        reject(@"LCQ_APM_TIME_ERROR", exception.reason, nil);
    }
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





@synthesize description;

@synthesize hash;

@synthesize superclass;

@end

