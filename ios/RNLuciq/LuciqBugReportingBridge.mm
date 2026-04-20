//
//  LuciqBugReportingBridge.m
//  RNLuciq
//
//  Created by Salma Ali on 7/30/19.
//  Copyright © 2019 luciq. All rights reserved.
//

#import "LuciqBugReportingBridge.h"
#import <LuciqSDK/LCQBugReporting.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <React/RCTUIManager.h>

@implementation LuciqBugReportingBridge

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
             @"LCQpreInvocationHandler",
             @"LCQpostInvocationHandler",
             @"LCQDidSelectPromptOptionHandler",
             ];
}

RCT_EXPORT_MODULE(LCQBugReporting)

RCT_EXPORT_METHOD(setEnabled:(BOOL) isEnabled) {
    LCQBugReporting.enabled = isEnabled;
}

RCT_EXPORT_METHOD(setAutoScreenRecordingEnabled:(BOOL)enabled) {
    LCQBugReporting.autoScreenRecordingEnabled = enabled;
}

RCT_EXPORT_METHOD(setAutoScreenRecordingDuration:(CGFloat)duration) {
    LCQBugReporting.autoScreenRecordingDuration = duration;
}

RCT_EXPORT_METHOD(setOnInvokeHandler:(RCTResponseSenderBlock)callBack) {
    if (callBack != nil) {
        LCQBugReporting.willInvokeHandler = ^{
            [self sendEventWithName:@"LCQpreInvocationHandler" body:nil];
        };
    } else {
        LCQBugReporting.willInvokeHandler = nil;
    }
}

RCT_EXPORT_METHOD(setOnSDKDismissedHandler:(RCTResponseSenderBlock)callBack) {
    if (callBack != nil) {
        LCQBugReporting.didDismissHandler = ^(LCQDismissType dismissType, LCQReportCategory reportType) {

            //parse dismiss type enum
            NSString* dismissTypeString;
            if (dismissType == LCQDismissTypeCancel) {
                dismissTypeString = @"CANCEL";
            } else if (dismissType == LCQDismissTypeSubmit) {
                dismissTypeString = @"SUBMIT";
            } else if (dismissType == LCQDismissTypeAddAttachment) {
                dismissTypeString = @"ADD_ATTACHMENT";
            }

            //parse report type enum
            NSString* reportTypeString;
            if (reportType == LCQReportCategoryBug) {
                reportTypeString = @"bug";
            } else if (reportType == LCQReportCategoryFeedback) {
                reportTypeString = @"feedback";
            } else {
                reportTypeString = @"other";
            }
            NSDictionary *result = @{ @"dismissType": dismissTypeString,
                                      @"reportType": reportTypeString};
            [self sendEventWithName:@"LCQpostInvocationHandler" body: result];
        };
    } else {
        LCQBugReporting.didDismissHandler = nil;
    }
}

RCT_EXPORT_METHOD(setDidSelectPromptOptionHandler:(RCTResponseSenderBlock)callBack) {
    if (callBack != nil) {

        LCQBugReporting.didSelectPromptOptionHandler = ^(LCQPromptOption promptOption) {

            NSString *promptOptionString;
            if (promptOption == LCQPromptOptionBug) {
                promptOptionString = @"bug";
            } else if (promptOption == LCQBugReportingTypeFeedback) {
                promptOptionString = @"feedback";
            } else if (promptOption == LCQPromptOptionChat) {
                promptOptionString = @"chat";
            } else {
                promptOptionString = @"none";
            }

            [self sendEventWithName:@"LCQDidSelectPromptOptionHandler" body:@{
                                                                              @"promptOption": promptOptionString
                                                                              }];
        };
    } else {
        LCQBugReporting.didSelectPromptOptionHandler = nil;
    }
}

RCT_EXPORT_METHOD(setInvocationEvents:(NSArray*)invocationEventsArray) {
    LCQInvocationEvent invocationEvents = 0;
    for (NSNumber *boxedValue in invocationEventsArray) {
        invocationEvents |= [boxedValue intValue];
    }
    LCQBugReporting.invocationEvents = invocationEvents;
}

RCT_EXPORT_METHOD(setOptions:(NSArray*)invocationOptionsArray) {
    LCQBugReportingOption invocationOptions = 0;

    for (NSNumber *boxedValue in invocationOptionsArray) {
        invocationOptions |= [boxedValue intValue];
    }

    LCQBugReporting.bugReportingOptions = invocationOptions;
}

RCT_EXPORT_METHOD(setFloatingButtonEdge:(CGRectEdge)floatingButtonEdge withTopOffset:(double)floatingButtonOffsetFromTop) {
    LCQBugReporting.floatingButtonEdge = floatingButtonEdge;
    LCQBugReporting.floatingButtonTopOffset = floatingButtonOffsetFromTop;
}

RCT_EXPORT_METHOD(setExtendedBugReportMode:(LCQExtendedBugReportMode)extendedBugReportMode) {
    LCQBugReporting.extendedBugReportMode = extendedBugReportMode;
}

RCT_EXPORT_METHOD(setEnabledAttachmentTypes:(BOOL)screenShot
                  extraScreenShot:(BOOL)extraScreenShot
                  galleryImage:(BOOL)galleryImage
                  screenRecording:(BOOL)screenRecording) {
    LCQAttachmentType attachmentTypes = 0;
    if(screenShot) {
        attachmentTypes = LCQAttachmentTypeScreenShot;
    }
    if(extraScreenShot) {
        attachmentTypes |= LCQAttachmentTypeExtraScreenShot;
    }
    if(galleryImage) {
        attachmentTypes |= LCQAttachmentTypeGalleryImage;
    }
    if(screenRecording) {
        attachmentTypes |= LCQAttachmentTypeScreenRecording;
    }

    LCQBugReporting.enabledAttachmentTypes = attachmentTypes;
}

RCT_EXPORT_METHOD(setViewHierarchyEnabled:(BOOL)viewHirearchyEnabled) {
    LCQBugReporting.shouldCaptureViewHierarchy = viewHirearchyEnabled;
}

RCT_EXPORT_METHOD(setVideoRecordingFloatingButtonPosition:(LCQPosition)position) {
    LCQBugReporting.videoRecordingFloatingButtonPosition = position;
}

RCT_EXPORT_METHOD(setReportTypes:(NSArray*) types ) {
    LCQBugReportingReportType reportTypes = 0;
    for (NSNumber *boxedValue in types) {
        reportTypes |= [boxedValue intValue];
    }
    [LCQBugReporting setPromptOptionsEnabledReportTypes: reportTypes];
}

RCT_EXPORT_METHOD(show:(LCQBugReportingReportType)type options:(NSArray*) options) {
    LCQBugReportingOption parsedOptions = 0;
    for (NSNumber *boxedValue in options) {
        parsedOptions |= [boxedValue intValue];
    }
    NSArray* args = @[@(type), @(parsedOptions)];
    [[NSRunLoop mainRunLoop] performSelector:@selector(showBugReportingWithReportTypeAndOptionsHelper:) target:self argument:args order:0 modes:@[NSDefaultRunLoopMode]];
}

- (void) showBugReportingWithReportTypeAndOptionsHelper:(NSArray*)args {
    LCQBugReportingReportType parsedreportType = [args[0] intValue];
    LCQBugReportingOption parsedOptions = [args[1] intValue];
    [LCQBugReporting showWithReportType:parsedreportType options:parsedOptions];
}

RCT_EXPORT_METHOD(setShakingThresholdForiPhone:(double)iPhoneShakingThreshold) {
    LCQBugReporting.shakingThresholdForiPhone = iPhoneShakingThreshold;
}

RCT_EXPORT_METHOD(setShakingThresholdForiPad:(double)iPadShakingThreshold) {
    LCQBugReporting.shakingThresholdForiPad = iPadShakingThreshold;
}

RCT_EXPORT_METHOD(setDisclaimerText:(NSString*)text) {
   [LCQBugReporting setDisclaimerText:text];
}

RCT_EXPORT_METHOD(setCommentMinimumCharacterCount:(nonnull NSNumber *)limit reportTypes:(NSArray *)reportTypes) {
    LCQBugReportingType parsedReportTypes = 0;
    if (![reportTypes count]) {
        parsedReportTypes = @(LCQBugReportingTypeBug).integerValue | @(LCQBugReportingTypeFeedback).integerValue | @(LCQBugReportingTypeQuestion).integerValue;
    }
    else {
        for (NSNumber *reportType in reportTypes) {
            parsedReportTypes |= [reportType intValue];
        }
    }
   [LCQBugReporting setCommentMinimumCharacterCount:[limit integerValue] forBugReportType:parsedReportTypes];
}

RCT_EXPORT_METHOD(addUserConsent:(NSString *)key
                  description:(NSString *)description
                  mandatory:(BOOL)mandatory
                  checked:(BOOL)checked
                  actionType:(id)actionType) {
    LCQConsentAction mappedActionType = (LCQConsentAction)[actionType integerValue];

    [LCQBugReporting addUserConsentWithKey:key
                               description:description
                                 mandatory:mandatory
                                   checked:checked
                                actionType:mappedActionType];
}

RCT_EXPORT_METHOD(setProactiveReportingConfigurations:(BOOL)enabled gap:(nonnull NSNumber* )gap model:(nonnull NSNumber* )modal) {
    LCQProactiveReportingConfigurations *configurations = [[LCQProactiveReportingConfigurations alloc] init];
    configurations.enabled = enabled; //Enable/disable
    configurations.gapBetweenModals = gap; // Time in seconds
    configurations.modalDelayAfterDetection = modal; // Time in seconds
   [LCQBugReporting setProactiveReportingConfigurations:configurations];
}


@synthesize description;

@synthesize hash;

@synthesize superclass;

@end
