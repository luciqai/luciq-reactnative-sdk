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
#import "Util/LuciqRNDebugTags.h"
#import "Util/LuciqRNLogger.h"

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
    [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[setEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQReplies.enabled = isEnabled;
}

RCT_EXPORT_METHOD(hasChats:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[hasChats] called"];
    BOOL hasChats = LCQReplies.hasChats;
    [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[hasChats] success result=%@", (hasChats ? @"YES" : @"NO")];
    resolve(@(hasChats));

}

RCT_EXPORT_METHOD(show) {
    [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[show] called"];
    [[NSRunLoop mainRunLoop] performSelector:@selector(show) target:[LCQReplies class] argument:nil order:0 modes:@[NSDefaultRunLoopMode]];
}

RCT_EXPORT_METHOD(setOnNewReplyReceivedHandler:(RCTResponseSenderBlock) callback) {
    [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[setOnNewReplyReceivedHandler] called present=%@", (callback != nil ? @"YES" : @"NO")];
    if (callback != nil) {
        LCQReplies.didReceiveReplyHandler = ^{
            [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[LCQOnNewReplyReceivedCallback] emitted"];
            [self sendEventWithName:@"LCQOnNewReplyReceivedCallback" body:nil];
        };
    } else {
        LCQReplies.didReceiveReplyHandler = nil;
    }

}

RCT_EXPORT_METHOD(getUnreadRepliesCount:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[getUnreadRepliesCount] called"];
    NSInteger count = LCQReplies.unreadRepliesCount;
    [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[getUnreadRepliesCount] success result=%ld", (long)count];
    resolve(@(count));
}

RCT_EXPORT_METHOD(setInAppNotificationEnabled:(BOOL)isChatNotificationEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[setInAppNotificationEnabled] called isChatNotificationEnabled=%@", (isChatNotificationEnabled ? @"YES" : @"NO")];
    LCQReplies.inAppNotificationsEnabled = isChatNotificationEnabled;
}

RCT_EXPORT_METHOD(setPushNotificationsEnabled:(BOOL)isPushNotificationEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags replies] format:@"[setPushNotificationsEnabled] called isPushNotificationEnabled=%@", (isPushNotificationEnabled ? @"YES" : @"NO")];
    [LCQReplies setPushNotificationsEnabled:isPushNotificationEnabled];
}

@synthesize description;

@synthesize hash;

@synthesize superclass;

@end


