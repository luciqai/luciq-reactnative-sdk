//
//  LuciqFeatureRequestsBridge.m
//  RNLuciq
//
//  Created by Salma Ali on 7/30/19.
//  Copyright © 2019 luciq. All rights reserved.
//

#import "LuciqFeatureRequestsBridge.h"
#import <InstabugSDK/IBGFeatureRequests.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <InstabugSDK/IBGTypes.h>
#import <React/RCTUIManager.h>

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
    [[NSRunLoop mainRunLoop] performSelector:@selector(show) target:[IBGFeatureRequests class] argument:nil order:0 modes:@[NSDefaultRunLoopMode]];
}

RCT_EXPORT_METHOD(setEmailFieldRequiredForFeatureRequests:(BOOL)isEmailFieldRequired
                  forAction:(NSArray *)actionTypesArray) {
    IBGAction actionTypes = 0;

    for (NSNumber *boxedValue in actionTypesArray) {
        actionTypes |= [boxedValue intValue];
    }

    [IBGFeatureRequests setEmailFieldRequired:isEmailFieldRequired forAction:actionTypes];
}

RCT_EXPORT_METHOD(setEnabled: (BOOL) isEnabled) {
    IBGFeatureRequests.enabled = isEnabled;
}

@synthesize description;

@synthesize hash;

@synthesize superclass;

@end


