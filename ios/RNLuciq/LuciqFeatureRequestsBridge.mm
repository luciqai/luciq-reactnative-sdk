#import "LuciqFeatureRequestsBridge.h"
#import <LuciqSDK/LCQFeatureRequests.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNLuciqSpec/RNLuciqSpec.h>

@interface LuciqFeatureRequestsBridge () <NativeFeatureRequestsSpec>
@end
#endif

@implementation LuciqFeatureRequestsBridge

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

RCT_EXPORT_MODULE(LCQFeatureRequests)

RCT_EXPORT_METHOD(show) {
    [[NSRunLoop mainRunLoop] performSelector:@selector(show) target:[LCQFeatureRequests class] argument:nil order:0 modes:@[NSDefaultRunLoopMode]];
}

RCT_EXPORT_METHOD(setEmailFieldRequiredForFeatureRequests:(BOOL)isEmailFieldRequired
                  types:(NSArray *)actionTypesArray) {
    LCQAction actionTypes = 0;

    for (id value in actionTypesArray) {
        if ([value isKindOfClass:[NSNumber class]] || [value isKindOfClass:[NSString class]]) {
            actionTypes |= [value intValue];
        }
    }

    [LCQFeatureRequests setEmailFieldRequired:isEmailFieldRequired forAction:actionTypes];
}

RCT_EXPORT_METHOD(setEnabled:(BOOL)isEnabled) {
    LCQFeatureRequests.enabled = isEnabled;
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeFeatureRequestsSpecJSI>(params);
}
#endif

@synthesize description;
@synthesize hash;
@synthesize superclass;

@end
