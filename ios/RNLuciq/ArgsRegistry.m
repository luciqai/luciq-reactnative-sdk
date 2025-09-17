#import "ArgsRegistry.h"

@implementation ArgsRegistry

+ (NSMutableDictionary *) getAll {
    NSMutableDictionary *all = [[NSMutableDictionary alloc] init];

    [all addEntriesFromDictionary:ArgsRegistry.sdkLogLevels];
    [all addEntriesFromDictionary:ArgsRegistry.invocationEvents];
    [all addEntriesFromDictionary:ArgsRegistry.invocationOptions];
    [all addEntriesFromDictionary:ArgsRegistry.colorThemes];
    [all addEntriesFromDictionary:ArgsRegistry.floatingButtonEdges];
    [all addEntriesFromDictionary:ArgsRegistry.recordButtonPositions];
    [all addEntriesFromDictionary:ArgsRegistry.welcomeMessageStates];
    [all addEntriesFromDictionary:ArgsRegistry.reportTypes];
    [all addEntriesFromDictionary:ArgsRegistry.dismissTypes];
    [all addEntriesFromDictionary:ArgsRegistry.actionTypes];
    [all addEntriesFromDictionary:ArgsRegistry.extendedBugReportStates];
    [all addEntriesFromDictionary:ArgsRegistry.reproStates];
    [all addEntriesFromDictionary:ArgsRegistry.locales];
    [all addEntriesFromDictionary:ArgsRegistry.nonFatalExceptionLevel];
    [all addEntriesFromDictionary:ArgsRegistry.placeholders];
    [all addEntriesFromDictionary:ArgsRegistry.launchType];
    [all addEntriesFromDictionary:ArgsRegistry.overAirServices];

    [all addEntriesFromDictionary:ArgsRegistry.autoMaskingTypes];
    [all addEntriesFromDictionary:ArgsRegistry.userConsentActionTypes];

    return all;
}

+ (ArgsDictionary *) sdkLogLevels {
    return @{
        @"sdkDebugLogsLevelVerbose": @(LCQSDKDebugLogsLevelVerbose),
        @"sdkDebugLogsLevelDebug": @(LCQSDKDebugLogsLevelDebug),
        @"sdkDebugLogsLevelError": @(LCQSDKDebugLogsLevelError),
        @"sdkDebugLogsLevelNone": @(LCQSDKDebugLogsLevelNone),
    };
}

+ (ArgsDictionary *) invocationEvents {
    return@{
        @"invocationEventNone": @(LCQInvocationEventNone),
        @"invocationEventShake": @(LCQInvocationEventShake),
        @"invocationEventScreenshot": @(LCQInvocationEventScreenshot),
        @"invocationEventTwoFingersSwipeLeft": @(LCQInvocationEventTwoFingersSwipeLeft),
        @"invocationEventRightEdgePan": @(LCQInvocationEventRightEdgePan),
        @"invocationEventFloatingButton": @(LCQInvocationEventFloatingButton)
    };
}

+ (ArgsDictionary *) invocationOptions {
    return @{
        @"optionEmailFieldHidden": @(LCQBugReportingOptionEmailFieldHidden),
        @"optionEmailFieldOptional": @(LCQBugReportingOptionEmailFieldOptional),
        @"optionCommentFieldRequired": @(LCQBugReportingOptionCommentFieldRequired),
        @"optionDisablePostSendingDialog": @(LCQBugReportingOptionDisablePostSendingDialog),
    };
}

+ (ArgsDictionary *) colorThemes {
    return @{
        @"colorThemeLight": @(LCQColorThemeLight),
        @"colorThemeDark": @(LCQColorThemeDark),
    };
}

+ (ArgsDictionary *) floatingButtonEdges {
    return @{
        @"rectMinXEdge": @(CGRectMinXEdge),
        @"rectMinYEdge": @(CGRectMinYEdge),
        @"rectMaxXEdge": @(CGRectMaxXEdge),
        @"rectMaxYEdge": @(CGRectMaxYEdge),
    };
}

+ (ArgsDictionary *) recordButtonPositions {
    return @{
        @"topLeft": @(LCQPositionTopLeft),
        @"topRight": @(LCQPositionTopRight),
        @"bottomLeft": @(LCQPositionBottomLeft),
        @"bottomRight": @(LCQPositionBottomRight),
    };
}

+ (ArgsDictionary *) welcomeMessageStates {
    return @{
        @"welcomeMessageModeLive": @(LCQWelcomeMessageModeLive),
        @"welcomeMessageModeBeta": @(LCQWelcomeMessageModeBeta),
        @"welcomeMessageModeDisabled": @(LCQWelcomeMessageModeDisabled),
    };
}

+ (ArgsDictionary *) reportTypes {
    return @{
        @"bugReportingReportTypeBug": @(LCQBugReportingReportTypeBug),
        @"bugReportingReportTypeFeedback": @(LCQBugReportingReportTypeFeedback),
        @"bugReportingReportTypeQuestion": @(LCQBugReportingReportTypeQuestion),
    };
}

+ (ArgsDictionary *) dismissTypes {
    return @{
        @"dismissTypeSubmit": @(LCQDismissTypeSubmit),
        @"dismissTypeCancel": @(LCQDismissTypeCancel),
        @"dismissTypeAddAttachment": @(LCQDismissTypeAddAttachment),
    };
}

+ (ArgsDictionary *) actionTypes {
    return @{
        @"allActions": @(LCQActionAllActions),
        @"requestNewFeature": @(LCQActionRequestNewFeature),
        @"addCommentToFeature": @(LCQActionAddCommentToFeature),
    };
}
+ (ArgsDictionary *) userConsentActionTypes {
    return @{
        @"dropAutoCapturedMedia": @(LCQConsentActionDropAutoCapturedMedia),
        @"dropLogs": @(LCQConsentActionDropLogs),
        @"noChat": @(LCQConsentActionNoChat)
    };
}
+ (ArgsDictionary *) extendedBugReportStates {
    return @{
        @"enabledWithRequiredFields": @(LCQExtendedBugReportModeEnabledWithRequiredFields),
        @"enabledWithOptionalFields": @(LCQExtendedBugReportModeEnabledWithOptionalFields),
        @"disabled": @(LCQExtendedBugReportModeDisabled),
    };
}

+ (ArgsDictionary *) reproStates {
    return @{
        @"reproStepsEnabled": @(LCQUserStepsModeEnable),
        @"reproStepsDisabled": @(LCQUserStepsModeDisable),
        @"reproStepsEnabledWithNoScreenshots": @(LCQUserStepsModeEnabledWithNoScreenshots),
    };
}

+ (ArgsDictionary *) locales {
    return @{
        @"localeArabic": @(LCQLocaleArabic),
        @"localeAzerbaijani": @(LCQLocaleAzerbaijani),
        @"localeChineseSimplified": @(LCQLocaleChineseSimplified),
        @"localeChineseTraditional": @(LCQLocaleChineseTraditional),
        @"localeCzech": @(LCQLocaleCzech),
        @"localeDanish": @(LCQLocaleDanish),
        @"localeDutch": @(LCQLocaleDutch),
        @"localeEnglish": @(LCQLocaleEnglish),
        @"localeFrench": @(LCQLocaleFrench),
        @"localeGerman": @(LCQLocaleGerman),
        @"localeItalian": @(LCQLocaleItalian),
        @"localeJapanese": @(LCQLocaleJapanese),
        @"localeKorean": @(LCQLocaleKorean),
        @"localePolish": @(LCQLocalePolish),
        @"localePortugueseBrazil": @(LCQLocalePortugueseBrazil),
        @"localeRomanian": @(LCQLocaleRomanian),
        @"localeRussian": @(LCQLocaleRussian),
        @"localeSpanish": @(LCQLocaleSpanish),
        @"localeSwedish": @(LCQLocaleSwedish),
        @"localeTurkish": @(LCQLocaleTurkish),
    };
}

+ (ArgsDictionary *)nonFatalExceptionLevel {
    return @{
        @"nonFatalErrorLevelInfo" : @(LCQNonFatalLevelInfo),
        @"nonFatalErrorLevelError" : @(LCQNonFatalLevelError),
        @"nonFatalErrorLevelWarning" : @(LCQNonFatalLevelWarning),
        @"nonFatalErrorLevelCritical" : @(LCQNonFatalLevelCritical)


    };
}

+ (NSDictionary<NSString *, NSString *> *) placeholders {
    return @{
        @"shakeHint": kLCQShakeStartAlertTextStringName,
        @"swipeHint": kLCQTwoFingerSwipeStartAlertTextStringName,
        @"edgeSwipeStartHint": kLCQEdgeSwipeStartAlertTextStringName,
        @"startAlertText": kLCQStartAlertTextStringName,
        @"invalidEmailMessage": kLCQInvalidEmailMessageStringName,
        @"invalidEmailTitle": kLCQInvalidEmailTitleStringName,

        @"invocationHeader": kLCQInvocationTitleStringName,
        @"reportQuestion": kLCQAskAQuestionStringName,
        @"reportBug": kLCQReportBugStringName,
        @"reportFeedback": kLCQReportFeedbackStringName,
        @"emailFieldHint": kLCQEmailFieldPlaceholderStringName,
        @"commentFieldHintForBugReport": kLCQCommentFieldPlaceholderForBugReportStringName,
        @"commentFieldHintForFeedback": kLCQCommentFieldPlaceholderForFeedbackStringName,
        @"commentFieldHintForQuestion": kLCQCommentFieldPlaceholderForQuestionStringName,
        @"addVideoMessage": kLCQAddScreenRecordingMessageStringName,
        @"addVoiceMessage": kLCQAddVoiceMessageStringName,
        @"addImageFromGallery": kLCQAddImageFromGalleryStringName,
        @"addExtraScreenshot": kLCQAddExtraScreenshotStringName,
        @"audioRecordingPermissionDeniedTitle": kLCQAudioRecordingPermissionDeniedTitleStringName,
        @"audioRecordingPermissionDeniedMessage": kLCQAudioRecordingPermissionDeniedMessageStringName,
        @"microphonePermissionAlertSettingsButtonTitle": kLCQMicrophonePermissionAlertSettingsButtonTitleStringName,
        @"conversationsHeaderTitle": kLCQChatsTitleStringName,
        @"chatsHeaderTitle": kLCQChatsTitleStringName,
        @"team": kLCQTeamStringName,
        @"recordingMessageToHoldText": kLCQRecordingMessageToHoldTextStringName,
        @"recordingMessageToReleaseText": kLCQRecordingMessageToReleaseTextStringName,
        @"messagesNotification": kLCQMessagesNotificationTitleSingleMessageStringName,
        @"messagesNotificationAndOthers": kLCQMessagesNotificationTitleMultipleMessagesStringName,
        @"screenshotHeaderTitle": kLCQScreenshotTitleStringName,
        @"okButtonTitle": kLCQOkButtonTitleStringName,
        @"cancelButtonTitle": kLCQCancelButtonTitleStringName,
        @"thankYouText": kLCQThankYouAlertTitleStringName,
        @"audio": kLCQAudioStringName,
        @"screenRecording": kLCQScreenRecordingStringName,
        @"image": kLCQImageStringName,
        @"surveyEnterYourAnswer": kLCQSurveyEnterYourAnswerTextPlaceholder,
        @"videoPressRecord": kLCQVideoPressRecordTitle,
        @"collectingDataText": kLCQCollectingDataText,
        @"thankYouAlertText": kLCQThankYouAlertMessageStringName,

        @"welcomeMessageBetaWelcomeStepTitle": kLCQBetaWelcomeMessageWelcomeStepTitle,
        @"welcomeMessageBetaWelcomeStepContent": kLCQBetaWelcomeMessageWelcomeStepContent,
        @"welcomeMessageBetaHowToReportStepTitle": kLCQBetaWelcomeMessageHowToReportStepTitle,
        @"welcomeMessageBetaHowToReportStepContent": kLCQBetaWelcomeMessageHowToReportStepContent,
        @"welcomeMessageBetaFinishStepTitle": kLCQBetaWelcomeMessageFinishStepTitle,
        @"welcomeMessageBetaFinishStepContent": kLCQBetaWelcomeMessageFinishStepContent,
        @"welcomeMessageLiveWelcomeStepTitle": kLCQLiveWelcomeMessageTitle,
        @"welcomeMessageLiveWelcomeStepContent": kLCQLiveWelcomeMessageContent,

        @"surveysStoreRatingThanksTitle": kLCQStoreRatingThankYouTitleText,
        @"surveysStoreRatingThanksSubtitle": kLCQStoreRatingThankYouDescriptionText,

        @"reportBugDescription": kLCQReportBugDescriptionStringName,
        @"reportFeedbackDescription": kLCQReportFeedbackDescriptionStringName,
        @"reportQuestionDescription": kLCQReportQuestionDescriptionStringName,
        @"requestFeatureDescription": kLCQRequestFeatureDescriptionStringName,

        @"discardAlertTitle": kLCQDiscardAlertTitle,
        @"discardAlertMessage": kLCQDiscardAlertMessage,
        @"discardAlertDiscard": kLCQDiscardAlertCancel,
        @"discardAlertStay": kLCQDiscardAlertAction,
        @"addAttachmentButtonTitleStringName": kLCQAddAttachmentButtonTitleStringName,

        @"reportReproStepsDisclaimerBody": kLCQReproStepsDisclaimerBody,
        @"reportReproStepsDisclaimerLink": kLCQReproStepsDisclaimerLink,
        @"reproStepsProgressDialogBody": kLCQProgressViewTitle,
        @"reproStepsListHeader": kLCQReproStepsListTitle,
        @"reproStepsListDescription": kLCQReproStepsListHeader,
        @"reproStepsListEmptyStateDescription": kLCQReproStepsListEmptyStateLabel,
        @"reproStepsListItemNumberingTitle": kLCQReproStepsListItemName,
        @"conversationTextFieldHint": kLCQChatReplyFieldPlaceholderStringName,
        @"insufficientContentTitle" : kLCQInsufficientContentTitleStringName,
        @"insufficientContentMessage" : kLCQInsufficientContentMessageStringName,
    };
}

+ (ArgsDictionary *) launchType {
    return @{
        @"cold": @(LaunchTypeCold),
        @"unknown":@(LaunchTypeUnknown)
    };
}
+ (ArgsDictionary *) overAirServices {
    return @{
        @"expo":@(LCQOverAirTypeExpo) ,
        @"codePush":@(LCQOverAirTypeCodePush),
    };
}

+ (ArgsDictionary *)autoMaskingTypes {
    return @{
        @"labels" : @(LCQAutoMaskScreenshotOptionLabels),
        @"textInputs" : @(LCQAutoMaskScreenshotOptionTextInputs),
        @"media" : @(LCQAutoMaskScreenshotOptionMedia),
        @"none" : @(LCQAutoMaskScreenshotOptionMaskNothing)
    };
}
@end
