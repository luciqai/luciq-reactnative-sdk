#import "LuciqRepliesBridge.h"
#import <LuciqSDK/LCQReplies.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNLuciqSpec/RNLuciqSpec.h>

@interface LuciqRepliesBridge () <NativeRepliesSpec>
@end
#endif

@implementation LuciqRepliesBridge

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"LCQOnNewReplyReceivedCallback"];
}

RCT_EXPORT_MODULE(LCQReplies)

RCT_EXPORT_METHOD(setEnabled:(BOOL)isEnabled) {
    LCQReplies.enabled = isEnabled;
}

RCT_EXPORT_METHOD(hasChats:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    resolve(@(LCQReplies.hasChats));
}

RCT_EXPORT_METHOD(show) {
    [[NSRunLoop mainRunLoop] performSelector:@selector(show) target:[LCQReplies class] argument:nil order:0 modes:@[NSDefaultRunLoopMode]];
}

RCT_EXPORT_METHOD(setOnNewReplyReceivedHandler) {
    __weak LuciqRepliesBridge *weakSelf = self;
    LCQReplies.didReceiveReplyHandler = ^{
        [weakSelf sendEventWithName:@"LCQOnNewReplyReceivedCallback" body:nil];
    };
}

RCT_EXPORT_METHOD(getUnreadRepliesCount:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    resolve(@(LCQReplies.unreadRepliesCount));
}

RCT_EXPORT_METHOD(setInAppNotificationEnabled:(BOOL)isChatNotificationEnabled) {
    LCQReplies.inAppNotificationsEnabled = isChatNotificationEnabled;
}

RCT_EXPORT_METHOD(setPushNotificationsEnabled:(BOOL)isPushNotificationEnabled) {
    [LCQReplies setPushNotificationsEnabled:isPushNotificationEnabled];
}

// Android-only methods — iOS no-ops to satisfy the unified spec.
RCT_EXPORT_METHOD(setInAppNotificationSound:(BOOL)isEnabled) { }
RCT_EXPORT_METHOD(setPushNotificationRegistrationToken:(NSString *)token) { }
RCT_EXPORT_METHOD(showNotification:(NSDictionary *)data) { }
RCT_EXPORT_METHOD(setNotificationIcon:(double)resourceId) { }
RCT_EXPORT_METHOD(setPushNotificationChannelId:(NSString *)identifier) { }
RCT_EXPORT_METHOD(setSystemReplyNotificationSoundEnabled:(BOOL)isEnabled) { }

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeRepliesSpecJSI>(params);
}
#endif

@synthesize description;
@synthesize hash;
@synthesize superclass;

@end
