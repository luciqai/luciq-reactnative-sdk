#import "LuciqBugReportingBridge.h"
#import <LuciqSDK/LCQBugReporting.h>
#import <asl.h>
#import <React/RCTLog.h>
#import <os/log.h>
#import <React/RCTUIManager.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNLuciqSpec/RNLuciqSpec.h>

@interface LuciqBugReportingBridge () <NativeBugReportingSpec>
@end
#endif

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

RCT_EXPORT_METHOD(setEnabled:(BOOL)isEnabled) {
    LCQBugReporting.enabled = isEnabled;
}

RCT_EXPORT_METHOD(setAutoScreenRecordingEnabled:(BOOL)enabled) {
    LCQBugReporting.autoScreenRecordingEnabled = enabled;
}

RCT_EXPORT_METHOD(setAutoScreenRecordingDuration:(double)duration) {
    LCQBugReporting.autoScreenRecordingDuration = duration;
}

RCT_EXPORT_METHOD(setOnInvokeHandler) {
    __weak LuciqBugReportingBridge *weakSelf = self;
    LCQBugReporting.willInvokeHandler = ^{
        [weakSelf sendEventWithName:@"LCQpreInvocationHandler" body:nil];
    };
}

RCT_EXPORT_METHOD(setOnSDKDismissedHandler) {
    __weak LuciqBugReportingBridge *weakSelf = self;
    LCQBugReporting.didDismissHandler = ^(LCQDismissType dismissType, LCQReportCategory reportType) {
        NSString *dismissTypeString;
        if (dismissType == LCQDismissTypeCancel) {
            dismissTypeString = @"CANCEL";
        } else if (dismissType == LCQDismissTypeSubmit) {
            dismissTypeString = @"SUBMIT";
        } else if (dismissType == LCQDismissTypeAddAttachment) {
            dismissTypeString = @"ADD_ATTACHMENT";
        }

        NSString *reportTypeString;
        if (reportType == LCQReportCategoryBug) {
            reportTypeString = @"bug";
        } else if (reportType == LCQReportCategoryFeedback) {
            reportTypeString = @"feedback";
        } else {
            reportTypeString = @"other";
        }
        NSDictionary *result = @{ @"dismissType": dismissTypeString,
                                  @"reportType": reportTypeString };
        [weakSelf sendEventWithName:@"LCQpostInvocationHandler" body:result];
    };
}

RCT_EXPORT_METHOD(setDidSelectPromptOptionHandler) {
    __weak LuciqBugReportingBridge *weakSelf = self;
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
        [weakSelf sendEventWithName:@"LCQDidSelectPromptOptionHandler"
                               body:@{@"promptOption": promptOptionString}];
    };
}

RCT_EXPORT_METHOD(setInvocationEvents:(NSArray *)invocationEventsArray) {
    LCQInvocationEvent invocationEvents = 0;
    for (id value in invocationEventsArray) {
        invocationEvents |= [value intValue];
    }
    LCQBugReporting.invocationEvents = invocationEvents;
}

RCT_EXPORT_METHOD(setOptions:(NSArray *)invocationOptionsArray) {
    LCQBugReportingOption invocationOptions = 0;
    for (id value in invocationOptionsArray) {
        invocationOptions |= [value intValue];
    }
    LCQBugReporting.bugReportingOptions = invocationOptions;
}

RCT_EXPORT_METHOD(setFloatingButtonEdge:(NSString *)edge offset:(double)offset) {
    LCQBugReporting.floatingButtonEdge = (CGRectEdge)[edge intValue];
    LCQBugReporting.floatingButtonTopOffset = offset;
}

RCT_EXPORT_METHOD(setExtendedBugReportMode:(NSString *)mode) {
    LCQBugReporting.extendedBugReportMode = (LCQExtendedBugReportMode)[mode intValue];
}

RCT_EXPORT_METHOD(setEnabledAttachmentTypes:(BOOL)screenshot
                  extraScreenshot:(BOOL)extraScreenshot
                  galleryImage:(BOOL)galleryImage
                  screenRecording:(BOOL)screenRecording) {
    LCQAttachmentType attachmentTypes = 0;
    if (screenshot) attachmentTypes = LCQAttachmentTypeScreenShot;
    if (extraScreenshot) attachmentTypes |= LCQAttachmentTypeExtraScreenShot;
    if (galleryImage) attachmentTypes |= LCQAttachmentTypeGalleryImage;
    if (screenRecording) attachmentTypes |= LCQAttachmentTypeScreenRecording;

    LCQBugReporting.enabledAttachmentTypes = attachmentTypes;
}

RCT_EXPORT_METHOD(setViewHierarchyEnabled:(BOOL)viewHierarchyEnabled) {
    LCQBugReporting.shouldCaptureViewHierarchy = viewHierarchyEnabled;
}

RCT_EXPORT_METHOD(setVideoRecordingFloatingButtonPosition:(NSString *)position) {
    LCQBugReporting.videoRecordingFloatingButtonPosition = (LCQPosition)[position intValue];
}

RCT_EXPORT_METHOD(setReportTypes:(NSArray *)types) {
    LCQBugReportingReportType reportTypes = 0;
    for (id value in types) {
        reportTypes |= [value intValue];
    }
    [LCQBugReporting setPromptOptionsEnabledReportTypes:reportTypes];
}

RCT_EXPORT_METHOD(show:(NSString *)type options:(NSArray *)options) {
    LCQBugReportingOption parsedOptions = 0;
    for (id value in options) {
        parsedOptions |= [value intValue];
    }
    NSArray *args = @[@([type intValue]), @(parsedOptions)];
    [[NSRunLoop mainRunLoop] performSelector:@selector(showBugReportingWithReportTypeAndOptionsHelper:)
                                     target:self
                                   argument:args
                                      order:0
                                      modes:@[NSDefaultRunLoopMode]];
}

- (void)showBugReportingWithReportTypeAndOptionsHelper:(NSArray *)args {
    LCQBugReportingReportType parsedReportType = [args[0] intValue];
    LCQBugReportingOption parsedOptions = [args[1] intValue];
    [LCQBugReporting showWithReportType:parsedReportType options:parsedOptions];
}

RCT_EXPORT_METHOD(setShakingThresholdForiPhone:(double)iPhoneShakingThreshold) {
    LCQBugReporting.shakingThresholdForiPhone = iPhoneShakingThreshold;
}

RCT_EXPORT_METHOD(setShakingThresholdForiPad:(double)iPadShakingThreshold) {
    LCQBugReporting.shakingThresholdForiPad = iPadShakingThreshold;
}

RCT_EXPORT_METHOD(setDisclaimerText:(NSString *)text) {
    [LCQBugReporting setDisclaimerText:text];
}

RCT_EXPORT_METHOD(setCommentMinimumCharacterCount:(double)limit reportTypes:(NSArray *)reportTypes) {
    LCQBugReportingType parsedReportTypes = 0;
    if (![reportTypes count]) {
        parsedReportTypes = LCQBugReportingTypeBug | LCQBugReportingTypeFeedback | LCQBugReportingTypeQuestion;
    } else {
        for (id value in reportTypes) {
            parsedReportTypes |= [value intValue];
        }
    }
    [LCQBugReporting setCommentMinimumCharacterCount:(NSInteger)limit forBugReportType:parsedReportTypes];
}

RCT_EXPORT_METHOD(addUserConsent:(NSString *)key
                  description:(NSString *)description
                  mandatory:(BOOL)mandatory
                  checked:(BOOL)checked
                  actionType:(NSString * _Nullable)actionType) {
    LCQConsentAction mappedActionType = (LCQConsentAction)[actionType integerValue];
    [LCQBugReporting addUserConsentWithKey:key
                               description:description
                                 mandatory:mandatory
                                   checked:checked
                                actionType:mappedActionType];
}

RCT_EXPORT_METHOD(setProactiveReportingConfigurations:(BOOL)enabled
                  gapBetweenModals:(double)gapBetweenModals
                  modalDelayAfterDetection:(double)modalDelayAfterDetection) {
    LCQProactiveReportingConfigurations *configurations = [[LCQProactiveReportingConfigurations alloc] init];
    configurations.enabled = enabled;
    configurations.gapBetweenModals = @(gapBetweenModals);
    configurations.modalDelayAfterDetection = @(modalDelayAfterDetection);
    [LCQBugReporting setProactiveReportingConfigurations:configurations];
}

// Android-only method — iOS no-op.
RCT_EXPORT_METHOD(setShakingThresholdForAndroid:(double)threshold) { }

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBugReportingSpecJSI>(params);
}
#endif

@synthesize description;
@synthesize hash;
@synthesize superclass;

@end
