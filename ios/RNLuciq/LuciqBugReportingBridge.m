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
#import "Util/LuciqRNDebugTags.h"
#import "Util/LuciqRNLogger.h"

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
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQBugReporting.enabled = isEnabled;
}

RCT_EXPORT_METHOD(setAutoScreenRecordingEnabled:(BOOL)enabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setAutoScreenRecordingEnabled] called enabled=%@", (enabled ? @"YES" : @"NO")];
    LCQBugReporting.autoScreenRecordingEnabled = enabled;
}

RCT_EXPORT_METHOD(setAutoScreenRecordingDuration:(CGFloat)duration) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setAutoScreenRecordingDuration] called duration=%f", (double)duration];
    LCQBugReporting.autoScreenRecordingDuration = duration;
}

RCT_EXPORT_METHOD(setOnInvokeHandler:(RCTResponseSenderBlock)callBack) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setOnInvokeHandler] called present=%@", (callBack != nil ? @"YES" : @"NO")];
    if (callBack != nil) {
        LCQBugReporting.willInvokeHandler = ^{
            [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[LCQpreInvocationHandler] emitted"];
            [self sendEventWithName:@"LCQpreInvocationHandler" body:nil];
        };
    } else {
        LCQBugReporting.willInvokeHandler = nil;
    }
}

RCT_EXPORT_METHOD(setOnSDKDismissedHandler:(RCTResponseSenderBlock)callBack) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setOnSDKDismissedHandler] called present=%@", (callBack != nil ? @"YES" : @"NO")];
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
            [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[LCQpostInvocationHandler] emitted"];
            [self sendEventWithName:@"LCQpostInvocationHandler" body: result];
        };
    } else {
        LCQBugReporting.didDismissHandler = nil;
    }
}

RCT_EXPORT_METHOD(setDidSelectPromptOptionHandler:(RCTResponseSenderBlock)callBack) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setDidSelectPromptOptionHandler] called present=%@", (callBack != nil ? @"YES" : @"NO")];
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

            [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[LCQDidSelectPromptOptionHandler] emitted"];
            [self sendEventWithName:@"LCQDidSelectPromptOptionHandler" body:@{
                                                                              @"promptOption": promptOptionString
                                                                              }];
        };
    } else {
        LCQBugReporting.didSelectPromptOptionHandler = nil;
    }
}

RCT_EXPORT_METHOD(setInvocationEvents:(NSArray*)invocationEventsArray) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setInvocationEvents] called count=%lu", (unsigned long)invocationEventsArray.count];
    LCQInvocationEvent invocationEvents = 0;
    for (NSNumber *boxedValue in invocationEventsArray) {
        invocationEvents |= [boxedValue intValue];
    }
    LCQBugReporting.invocationEvents = invocationEvents;
}

RCT_EXPORT_METHOD(setOptions:(NSArray*)invocationOptionsArray) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setOptions] called count=%lu", (unsigned long)invocationOptionsArray.count];
    LCQBugReportingOption invocationOptions = 0;

    for (NSNumber *boxedValue in invocationOptionsArray) {
        invocationOptions |= [boxedValue intValue];
    }

    LCQBugReporting.bugReportingOptions = invocationOptions;
}

RCT_EXPORT_METHOD(setFloatingButtonEdge:(CGRectEdge)floatingButtonEdge withTopOffset:(double)floatingButtonOffsetFromTop) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setFloatingButtonEdge] called edge=%d topOffset=%f", (int)floatingButtonEdge, floatingButtonOffsetFromTop];
    LCQBugReporting.floatingButtonEdge = floatingButtonEdge;
    LCQBugReporting.floatingButtonTopOffset = floatingButtonOffsetFromTop;
}

RCT_EXPORT_METHOD(setExtendedBugReportMode:(LCQExtendedBugReportMode)extendedBugReportMode) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setExtendedBugReportMode] called mode=%ld", (long)extendedBugReportMode];
    LCQBugReporting.extendedBugReportMode = extendedBugReportMode;
}

RCT_EXPORT_METHOD(setEnabledAttachmentTypes:(BOOL)screenShot
                  extraScreenShot:(BOOL)extraScreenShot
                  galleryImage:(BOOL)galleryImage
                  screenRecording:(BOOL)screenRecording) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setEnabledAttachmentTypes] called screenShot=%@ extraScreenShot=%@ galleryImage=%@ screenRecording=%@", (screenShot ? @"YES" : @"NO"), (extraScreenShot ? @"YES" : @"NO"), (galleryImage ? @"YES" : @"NO"), (screenRecording ? @"YES" : @"NO")];
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
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setViewHierarchyEnabled] called viewHirearchyEnabled=%@", (viewHirearchyEnabled ? @"YES" : @"NO")];
    LCQBugReporting.shouldCaptureViewHierarchy = viewHirearchyEnabled;
}

RCT_EXPORT_METHOD(setVideoRecordingFloatingButtonPosition:(LCQPosition)position) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setVideoRecordingFloatingButtonPosition] called position=%ld", (long)position];
    LCQBugReporting.videoRecordingFloatingButtonPosition = position;
}

RCT_EXPORT_METHOD(setReportTypes:(NSArray*) types ) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setReportTypes] called count=%lu", (unsigned long)types.count];
    LCQBugReportingReportType reportTypes = 0;
    for (NSNumber *boxedValue in types) {
        reportTypes |= [boxedValue intValue];
    }
    [LCQBugReporting setPromptOptionsEnabledReportTypes: reportTypes];
}

RCT_EXPORT_METHOD(show:(LCQBugReportingReportType)type options:(NSArray*) options) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[show] called type=%ld optionsCount=%lu", (long)type, (unsigned long)options.count];
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
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setShakingThresholdForiPhone] called threshold=%f", iPhoneShakingThreshold];
    LCQBugReporting.shakingThresholdForiPhone = iPhoneShakingThreshold;
}

RCT_EXPORT_METHOD(setShakingThresholdForiPad:(double)iPadShakingThreshold) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setShakingThresholdForiPad] called threshold=%f", iPadShakingThreshold];
    LCQBugReporting.shakingThresholdForiPad = iPadShakingThreshold;
}

RCT_EXPORT_METHOD(setDisclaimerText:(NSString*)text) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setDisclaimerText] called length=%lu, present=%@", (unsigned long)text.length, (text != nil ? @"YES" : @"NO")];
   [LCQBugReporting setDisclaimerText:text];
}

RCT_EXPORT_METHOD(setCommentMinimumCharacterCount:(nonnull NSNumber *)limit reportTypes:(NSArray *)reportTypes) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setCommentMinimumCharacterCount] called limit=%@ reportTypesCount=%lu", limit, (unsigned long)reportTypes.count];
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
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[addUserConsent] called keyLength=%lu keyPresent=%@ descriptionLength=%lu descriptionPresent=%@ mandatory=%@ checked=%@ actionType=%@", (unsigned long)key.length, (key != nil ? @"YES" : @"NO"), (unsigned long)description.length, (description != nil ? @"YES" : @"NO"), (mandatory ? @"YES" : @"NO"), (checked ? @"YES" : @"NO"), actionType];
    LCQConsentAction mappedActionType = (LCQConsentAction)[actionType integerValue];

    [LCQBugReporting addUserConsentWithKey:key
                               description:description
                                 mandatory:mandatory
                                   checked:checked
                                actionType:mappedActionType];
}

RCT_EXPORT_METHOD(setProactiveReportingConfigurations:(BOOL)enabled gap:(nonnull NSNumber* )gap model:(nonnull NSNumber* )modal) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setProactiveReportingConfigurations] called enabled=%@ gap=%@ modal=%@", (enabled ? @"YES" : @"NO"), gap, modal];
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
