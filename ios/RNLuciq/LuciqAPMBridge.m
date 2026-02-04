

#import "LuciqAPMBridge.h"
#import <LuciqSDK/LCQAPM.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>
#import "Util/LCQAPM+PrivateAPIs.h"
#import "LuciqScreenLoadingFrameTracker.h"

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

// Screen Loading methods
RCT_EXPORT_METHOD(initScreenFrameTracking:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [[LuciqScreenLoadingFrameTracker sharedInstance] initializeFrameTracking];
        resolve(nil);
    });
}

RCT_EXPORT_METHOD(setActiveScreenSpanId:(NSString *)spanId)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [[LuciqScreenLoadingFrameTracker sharedInstance] startTrackingForSpanId:spanId];
    });
}

RCT_EXPORT_METHOD(getScreenTimeToDisplay:(NSString *)spanId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        NSNumber *timestamp = [[LuciqScreenLoadingFrameTracker sharedInstance] getFrameTimestampForSpanId:spanId];
        resolve(timestamp);
    });
}

RCT_EXPORT_METHOD(isScreenLoadingEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject){
   
    BOOL isScreenLoadingEnabled = LCQAPM.screenLoadingEnabled;
    resolve(@(isScreenLoadingEnabled));
}

RCT_EXPORT_METHOD(isEndScreenLoadingEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject){
   
    BOOL isEndScreenLoadingEnabled = LCQAPM.endScreenLoadingEnabled;
    resolve(@(isEndScreenLoadingEnabled));
}

RCT_EXPORT_METHOD(endScreenLoading:(double)timeStampMicro
                  uiTraceId:(double)uiTraceId){
    [LCQAPM endScreenLoadingCPWithEndTimestampMUS:timeStampMicro];
}

RCT_EXPORT_METHOD(setScreenLoadingEnabled:(BOOL)isEnabled){
    LCQAPM.screenLoadingEnabled = isEnabled;
}

// Syncs screen loading data to native layer for reporting
RCT_EXPORT_METHOD(syncScreenLoading:(double)spanId
                  screenName:(NSString *)screenName
                  startTimestamp:(double)startTimestamp
                  ttid_us:(double)ttid_us
                  attributes:(NSDictionary *)stages){
    NSLog(@"[ScreenLoading] syncScreenLoading - spanId: %.0f, screenName: %@, startTimestamp: %f, ttid_us: %f, attributes: %@",
          spanId, screenName, startTimestamp, ttid_us, stages);
    
    NSMutableDictionary<NSString *, NSNumber *> *stagesMap = [NSMutableDictionary dictionary];
    
    if (stages[@"rnd_mus_st"])
        stagesMap[@"rnd_mus_st"] = @([stages[@"rnd_mus_st"] longLongValue]);
    if (stages[@"rnd_mus"])
        stagesMap[@"rnd_mus"] = @([stages[@"rnd_mus"] longLongValue]);
    if (stages[@"mnt_ms"])
        stagesMap[@"mnt_ms"] = @([stages[@"mnt_ms"] longLongValue]);
    if (stages[@"layout_mus"])
        stagesMap[@"layout_mus"] = @([stages[@"layout_mus"] longLongValue]);
    if (stages[@"mnt_ms_st"])
        stagesMap[@"mnt_ms_st"] = @([stages[@"mnt_ms_st"] longLongValue]);
    if (stages[@"cnst_mus_st"])
        stagesMap[@"cnst_mus_st"] = @([stages[@"cnst_mus_st"] longLongValue]);
    if (stages[@"layout_mus_st"])
        stagesMap[@"layout_mus_st"] = @([stages[@"layout_mus_st"] longLongValue]);
    
    [LCQAPM reportScreenLoadingCPWithStartTimestampMUS:startTimestamp durationMUS:ttid_us];
    
}

@synthesize description;

@synthesize hash;

@synthesize superclass;

@end

