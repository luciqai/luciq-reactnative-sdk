//
//  LuciqRepliesBridge.m
//  RNLuciq
//
//  Created by Salma Ali on 7/30/19.
//  Copyright © 2019 luciq. All rights reserved.
//
//

#import "LuciqRepliesBridge.h"
#import <LuciqSDK/LCQReplies.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <LuciqSDK/LCQTypes.h>
#import <React/RCTUIManager.h>

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

RCT_EXPORT_METHOD(setEnabled:(BOOL) isEnabled) {
    LCQReplies.enabled = isEnabled;
}

RCT_EXPORT_METHOD(hasChats:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    BOOL hasChats = LCQReplies.hasChats;
    resolve(@(hasChats));

}

RCT_EXPORT_METHOD(show) {
    [[NSRunLoop mainRunLoop] performSelector:@selector(show) target:[LCQReplies class] argument:nil order:0 modes:@[NSDefaultRunLoopMode]];
}

RCT_EXPORT_METHOD(setOnNewReplyReceivedHandler:(RCTResponseSenderBlock) callback) {
    if (callback != nil) {
        LCQReplies.didReceiveReplyHandler = ^{
            [self sendEventWithName:@"LCQOnNewReplyReceivedCallback" body:nil];
        };
    } else {
        LCQReplies.didReceiveReplyHandler = nil;
    }

}

RCT_EXPORT_METHOD(getUnreadRepliesCount:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    resolve(@(LCQReplies.unreadRepliesCount));
}

RCT_EXPORT_METHOD(setInAppNotificationEnabled:(BOOL)isChatNotificationEnabled) {
    LCQReplies.inAppNotificationsEnabled = isChatNotificationEnabled;
}

RCT_EXPORT_METHOD(setPushNotificationsEnabled:(BOOL)isPushNotificationEnabled) {
    [LCQReplies setPushNotificationsEnabled:isPushNotificationEnabled];
}

@synthesize description;

@synthesize hash;

@synthesize superclass;

@end


