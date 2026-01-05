package ai.luciq.reactlibrary;

import androidx.annotation.NonNull;

import ai.luciq.bug.BugReporting;
import ai.luciq.bug.invocation.Option;
import ai.luciq.crash.models.LuciqNonFatalException;
import ai.luciq.featuresrequest.ActionType;
import ai.luciq.library.LuciqColorTheme;
import ai.luciq.library.LuciqCustomTextPlaceHolder.Key;
import ai.luciq.library.OnSdkDismissCallback.DismissType;
import ai.luciq.library.ReproMode;
import ai.luciq.library.extendedbugreport.ExtendedBugReport;
import ai.luciq.library.internal.module.LuciqLocale;
import ai.luciq.library.invocation.LuciqInvocationEvent;
import ai.luciq.library.invocation.util.LuciqFloatingButtonEdge;
import ai.luciq.library.invocation.util.LuciqVideoRecordingButtonPosition;
import ai.luciq.library.sessionreplay.model.SessionMetadata;
import ai.luciq.library.ui.onboarding.WelcomeMessage;
import ai.luciq.library.util.overairversion.OverAirVersionType;
import ai.luciq.library.MaskingType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

final class ArgsRegistry {

    static class ArgsMap<T> extends HashMap<String, T> {
        @NonNull
        @Override
        public T getOrDefault(Object key, T defaultValue) {
            final T value = get(key);
            return value != null ? value : defaultValue;
        }

        public ArrayList<T> getAll(ArrayList<String> keys) {
            final ArrayList<T> values = new ArrayList<>();
            for (String key : keys) {
                values.add(get(key));
            }
            return values;
        }
    }

    @SuppressWarnings("deprecation")
    static Map<String, Object> getAll() {
        return new HashMap<String, Object>() {{
            putAll(invocationEvents);
            putAll(invocationOptions);
            putAll(colorThemes);
            putAll(floatingButtonEdges);
            putAll(recordButtonPositions);
            putAll(welcomeMessageStates);
            putAll(reportTypes);
            putAll(dismissTypes);
            putAll(actionTypes);
            putAll(extendedBugReportStates);
            putAll(reproModes);
            putAll(sdkLogLevels);
            putAll(nonFatalExceptionLevel);
            putAll(locales);
            putAll(placeholders);
            putAll(launchType);
            putAll(overAirUpdateService);
            putAll(autoMaskingTypes);
            putAll(userConsentActionType);
            putAll(capturingModes);
            putAll(screenshotQualities);
        }};
    }

    public static ArgsMap<LuciqNonFatalException.Level> nonFatalExceptionLevel = new ArgsMap<LuciqNonFatalException.Level>() {{
        put("nonFatalErrorLevelCritical", LuciqNonFatalException.Level.CRITICAL);
        put("nonFatalErrorLevelError", LuciqNonFatalException.Level.ERROR);
        put("nonFatalErrorLevelWarning", LuciqNonFatalException.Level.WARNING);
        put("nonFatalErrorLevelInfo", LuciqNonFatalException.Level.INFO);
    }};

    static ArgsMap<LuciqInvocationEvent> invocationEvents = new ArgsMap<LuciqInvocationEvent>() {{
        put("invocationEventNone", LuciqInvocationEvent.NONE);
        put("invocationEventShake", LuciqInvocationEvent.SHAKE);
        put("invocationEventFloatingButton", LuciqInvocationEvent.FLOATING_BUTTON);
        put("invocationEventScreenshot", LuciqInvocationEvent.SCREENSHOT);
        put("invocationEventTwoFingersSwipeLeft", LuciqInvocationEvent.TWO_FINGER_SWIPE_LEFT);
    }};

    static final ArgsMap<Integer> invocationOptions = new ArgsMap<Integer>() {{
        put("optionEmailFieldHidden", Option.EMAIL_FIELD_HIDDEN);
        put("optionEmailFieldOptional", Option.EMAIL_FIELD_OPTIONAL);
        put("optionCommentFieldRequired", Option.COMMENT_FIELD_REQUIRED);
        put("optionDisablePostSendingDialog", Option.DISABLE_POST_SENDING_DIALOG);
    }};

    static final ArgsMap<LuciqColorTheme> colorThemes = new ArgsMap<LuciqColorTheme>() {{
        put("colorThemeLight", LuciqColorTheme.LuciqColorThemeLight);
        put("colorThemeDark", LuciqColorTheme.LuciqColorThemeDark);
    }};

    static final ArgsMap<LuciqFloatingButtonEdge> floatingButtonEdges = new ArgsMap<LuciqFloatingButtonEdge>() {{
        put("left", LuciqFloatingButtonEdge.LEFT);
        put("right", LuciqFloatingButtonEdge.RIGHT);
        put("floatingButtonEdgeLeft", LuciqFloatingButtonEdge.LEFT);
        put("floatingButtonEdgeRight", LuciqFloatingButtonEdge.RIGHT);
        put("rectMinXEdge", LuciqFloatingButtonEdge.LEFT);
        put("rectMaxXEdge", LuciqFloatingButtonEdge.RIGHT);
    }};

    static ArgsMap<LuciqVideoRecordingButtonPosition> recordButtonPositions = new ArgsMap<LuciqVideoRecordingButtonPosition>() {{
        put("topLeft", LuciqVideoRecordingButtonPosition.TOP_LEFT);
        put("topRight", LuciqVideoRecordingButtonPosition.TOP_RIGHT);
        put("bottomLeft", LuciqVideoRecordingButtonPosition.BOTTOM_LEFT);
        put("bottomRight", LuciqVideoRecordingButtonPosition.BOTTOM_RIGHT);
    }};

    static ArgsMap<WelcomeMessage.State> welcomeMessageStates = new ArgsMap<WelcomeMessage.State>() {{
        put("welcomeMessageModeLive", WelcomeMessage.State.LIVE);
        put("welcomeMessageModeBeta", WelcomeMessage.State.BETA);
        put("welcomeMessageModeDisabled", WelcomeMessage.State.DISABLED);
    }};

    static final ArgsMap<Integer> reportTypes = new ArgsMap<Integer>() {{
        put("bugReportingReportTypeBug", BugReporting.ReportType.BUG);
        put("bugReportingReportTypeFeedback", BugReporting.ReportType.FEEDBACK);
        put("bugReportingReportTypeQuestion", BugReporting.ReportType.QUESTION);
    }};

    static final ArgsMap<DismissType> dismissTypes = new ArgsMap<DismissType>() {{
        put("dismissTypeSubmit", DismissType.SUBMIT);
        put("dismissTypeCancel", DismissType.CANCEL);
        put("dismissTypeAddAttachment", DismissType.ADD_ATTACHMENT);
    }};

    static final ArgsMap<Integer> actionTypes = new ArgsMap<Integer>() {{
        put("allActions", ActionType.REQUEST_NEW_FEATURE | ActionType.ADD_COMMENT_TO_FEATURE);
        put("requestNewFeature", ActionType.REQUEST_NEW_FEATURE);
        put("addCommentToFeature", ActionType.ADD_COMMENT_TO_FEATURE);
    }};

    static ArgsMap<ExtendedBugReport.State> extendedBugReportStates = new ArgsMap<ExtendedBugReport.State>() {{
        put("enabledWithRequiredFields", ExtendedBugReport.State.ENABLED_WITH_REQUIRED_FIELDS);
        put("enabledWithOptionalFields", ExtendedBugReport.State.ENABLED_WITH_OPTIONAL_FIELDS);
        put("disabled", ExtendedBugReport.State.DISABLED);
    }};

    static final ArgsMap<Integer> reproModes = new ArgsMap<Integer>() {{
        put("reproStepsEnabledWithNoScreenshots", ReproMode.EnableWithNoScreenshots);
        put("reproStepsEnabled", ReproMode.EnableWithScreenshots);
        put("reproStepsDisabled", ReproMode.Disable);
    }};

    static final ArgsMap<String> userConsentActionType = new ArgsMap<String>() {{
        put("dropAutoCapturedMedia",  ai.luciq.bug.userConsent.ActionType.DROP_AUTO_CAPTURED_MEDIA);
        put("dropLogs",  ai.luciq.bug.userConsent.ActionType.DROP_LOGS);
        put("noChat",  ai.luciq.bug.userConsent.ActionType.NO_CHAT);
    }};

    static final ArgsMap<Integer> sdkLogLevels = new ArgsMap<Integer>() {{
        put("sdkDebugLogsLevelNone", ai.luciq.library.LogLevel.NONE);
        put("sdkDebugLogsLevelError", ai.luciq.library.LogLevel.ERROR);
        put("sdkDebugLogsLevelDebug", ai.luciq.library.LogLevel.DEBUG);
        put("sdkDebugLogsLevelVerbose", ai.luciq.library.LogLevel.VERBOSE);
    }};

    static final ArgsMap<LuciqLocale> locales = new ArgsMap<LuciqLocale>() {{
        put("localeArabic", LuciqLocale.ARABIC);
        put("localeAzerbaijani", LuciqLocale.AZERBAIJANI);
        put("localeChineseSimplified", LuciqLocale.SIMPLIFIED_CHINESE);
        put("localeChineseTraditional", LuciqLocale.TRADITIONAL_CHINESE);
        put("localeCzech", LuciqLocale.CZECH);
        put("localeDanish", LuciqLocale.DANISH);
        put("localeDutch", LuciqLocale.NETHERLANDS);
        put("localeEnglish", LuciqLocale.ENGLISH);
        put("localeFrench", LuciqLocale.FRENCH);
        put("localeGerman", LuciqLocale.GERMAN);
        put("localeIndonesian", LuciqLocale.INDONESIAN);
        put("localeItalian", LuciqLocale.ITALIAN);
        put("localeJapanese", LuciqLocale.JAPANESE);
        put("localeKorean", LuciqLocale.KOREAN);
        put("localeNorwegian", LuciqLocale.NORWEGIAN);
        put("localePolish", LuciqLocale.POLISH);
        put("localePortugueseBrazil", LuciqLocale.PORTUGUESE_BRAZIL);
        put("localePortuguesePortugal", LuciqLocale.PORTUGUESE_PORTUGAL);
        put("localeRomanian", LuciqLocale.ROMANIAN);
        put("localeRussian", LuciqLocale.RUSSIAN);
        put("localeSpanish", LuciqLocale.SPANISH);
        put("localeSlovak", LuciqLocale.SLOVAK);
        put("localeSwedish", LuciqLocale.SWEDISH);
        put("localeTurkish", LuciqLocale.TURKISH);
    }};

    static final ArgsMap<Key> placeholders = new ArgsMap<Key>() {{
        put("shakeHint", Key.SHAKE_HINT);
        put("swipeHint", Key.SWIPE_HINT);
        put("invalidEmailMessage", Key.INVALID_EMAIL_MESSAGE);
        put("emailFieldHint", Key.EMAIL_FIELD_HINT);
        put("commentFieldHintForBugReport", Key.COMMENT_FIELD_HINT_FOR_BUG_REPORT);
        put("commentFieldHintForFeedback", Key.COMMENT_FIELD_HINT_FOR_FEEDBACK);
        put("commentFieldHintForQuestion", Key.COMMENT_FIELD_HINT_FOR_QUESTION);
        put("invocationHeader", Key.INVOCATION_HEADER);
        put("reportQuestion", Key.REPORT_QUESTION);
        put("reportBug", Key.REPORT_BUG);
        put("reportFeedback", Key.REPORT_FEEDBACK);
        put("conversationsHeaderTitle", Key.CONVERSATIONS_LIST_TITLE);
        put("addVoiceMessage", Key.ADD_VOICE_MESSAGE);
        put("addImageFromGallery", Key.ADD_IMAGE_FROM_GALLERY);
        put("addExtraScreenshot", Key.ADD_EXTRA_SCREENSHOT);
        put("addVideoMessage", Key.ADD_VIDEO);
        put("audioRecordingPermissionDeniedMessage", Key.AUDIO_RECORDING_PERMISSION_DENIED);
        put("recordingMessageToHoldText", Key.VOICE_MESSAGE_PRESS_AND_HOLD_TO_RECORD);
        put("recordingMessageToReleaseText", Key.VOICE_MESSAGE_RELEASE_TO_ATTACH);
        put("thankYouText", Key.SUCCESS_DIALOG_HEADER);
        put("videoPressRecord", Key.VIDEO_RECORDING_FAB_BUBBLE_HINT);
        put("conversationTextFieldHint", Key.CONVERSATION_TEXT_FIELD_HINT);
        put("thankYouAlertText", Key.REPORT_SUCCESSFULLY_SENT);

        put("welcomeMessageBetaWelcomeStepTitle", Key.BETA_WELCOME_MESSAGE_WELCOME_STEP_TITLE);
        put("welcomeMessageBetaWelcomeStepContent", Key.BETA_WELCOME_MESSAGE_WELCOME_STEP_CONTENT);
        put("welcomeMessageBetaHowToReportStepTitle", Key.BETA_WELCOME_MESSAGE_HOW_TO_REPORT_STEP_TITLE);
        put("welcomeMessageBetaHowToReportStepContent", Key.BETA_WELCOME_MESSAGE_HOW_TO_REPORT_STEP_CONTENT);
        put("welcomeMessageBetaFinishStepTitle", Key.BETA_WELCOME_MESSAGE_FINISH_STEP_TITLE);
        put("welcomeMessageBetaFinishStepContent", Key.BETA_WELCOME_MESSAGE_FINISH_STEP_CONTENT);
        put("welcomeMessageLiveWelcomeStepTitle", Key.LIVE_WELCOME_MESSAGE_TITLE);
        put("welcomeMessageLiveWelcomeStepContent", Key.LIVE_WELCOME_MESSAGE_CONTENT);

        put("surveysStoreRatingThanksTitle", Key.SURVEYS_STORE_RATING_THANKS_TITLE);
        put("surveysStoreRatingThanksSubtitle", Key.SURVEYS_STORE_RATING_THANKS_SUBTITLE);

        put("reportBugDescription", Key.REPORT_BUG_DESCRIPTION);
        put("reportFeedbackDescription", Key.REPORT_FEEDBACK_DESCRIPTION);
        put("reportQuestionDescription", Key.REPORT_QUESTION_DESCRIPTION);
        put("requestFeatureDescription", Key.REQUEST_FEATURE_DESCRIPTION);

        put("discardAlertTitle", Key.REPORT_DISCARD_DIALOG_TITLE);
        put("discardAlertMessage", Key.REPORT_DISCARD_DIALOG_BODY);
        put("discardAlertStay", Key.REPORT_DISCARD_DIALOG_NEGATIVE_ACTION);
        put("discardAlertDiscard", Key.REPORT_DISCARD_DIALOG_POSITIVE_ACTION);

        put("addAttachmentButtonTitleStringName", Key.REPORT_ADD_ATTACHMENT_HEADER);

        put("reportReproStepsDisclaimerBody", Key.REPORT_REPRO_STEPS_DISCLAIMER_BODY);
        put("reportReproStepsDisclaimerLink", Key.REPORT_REPRO_STEPS_DISCLAIMER_LINK);
        put("reproStepsProgressDialogBody", Key.REPRO_STEPS_PROGRESS_DIALOG_BODY);
        put("reproStepsListHeader", Key.REPRO_STEPS_LIST_HEADER);
        put("reproStepsListDescription", Key.REPRO_STEPS_LIST_DESCRIPTION);
        put("reproStepsListEmptyStateDescription", Key.REPRO_STEPS_LIST_EMPTY_STATE_DESCRIPTION);
        put("reproStepsListItemNumberingTitle", Key.REPRO_STEPS_LIST_ITEM_NUMBERING_TITLE);
        put("okButtonTitle", Key.BUG_ATTACHMENT_DIALOG_OK_BUTTON);
        put("audio", Key.CHATS_TYPE_AUDIO);
        put("image", Key.CHATS_TYPE_IMAGE);
        put("screenRecording", Key.CHATS_TYPE_VIDEO);
        put("messagesNotificationAndOthers", Key.CHATS_MULTIPLE_MESSAGE_NOTIFICATION);
        put("team", Key.CHATS_TEAM_STRING_NAME);
        put("insufficientContentMessage", Key.COMMENT_FIELD_INSUFFICIENT_CONTENT);
    }};

    public static ArgsMap<String> launchType = new ArgsMap<String>() {{
        put("cold", SessionMetadata.LaunchType.COLD);
        put("warm",SessionMetadata.LaunchType.WARM );
        put("unknown","unknown");
    }};

    public static ArgsMap<Integer> overAirUpdateService = new ArgsMap<Integer>() {{
        put("expo", OverAirVersionType.EXPO);
        put("codePush",OverAirVersionType.CODE_PUSH );
    }};

// Temporary workaround to be removed in future release
// This is used for mapping native `LaunchType` values into React Native enum values.
    public static HashMap<String,String> launchTypeReversed = new HashMap<String,String>() {{
        put(SessionMetadata.LaunchType.COLD,"cold");
        put(SessionMetadata.LaunchType.WARM,"warm" );
    }};
    public static final ArgsMap<Integer> autoMaskingTypes = new ArgsMap<Integer>() {{
        put("labels", MaskingType.LABELS);
        put("textInputs", MaskingType.TEXT_INPUTS);
        put("media", MaskingType.MEDIA);
        put("none", MaskingType.MASK_NOTHING);
    }};

    public static final ArgsMap<Integer> capturingModes = new ArgsMap<Integer>() {{
        put("capturingModeNavigation", ai.luciq.library.sessionreplay.CapturingMode.NAVIGATION);
        put("capturingModeInteractions", ai.luciq.library.sessionreplay.CapturingMode.INTERACTIONS);
        put("capturingModeFrequency", ai.luciq.library.sessionreplay.CapturingMode.FREQUENCY);
    }};

    public static final ArgsMap<Integer> screenshotQualities = new ArgsMap<Integer>() {{
        put("screenshotQualityHigh", ai.luciq.library.sessionreplay.ScreenshotQuality.HIGH);
        put("screenshotQualityNormal", ai.luciq.library.sessionreplay.ScreenshotQuality.NORMAL);
        put("screenshotQualityGreyscale", ai.luciq.library.sessionreplay.ScreenshotQuality.GREYSCALE);
    }};
}
