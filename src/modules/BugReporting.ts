import { Platform } from 'react-native';

import { NativeBugReporting, NativeEvents, emitter } from '../native/NativeBugReporting';
import type { ProactiveReportingConfigOptions } from '../models/ProactiveReportingConfigs';
import type { CustomReport } from '../models/CustomReport';
import { toNativeCustomReport } from '../models/CustomReport';
import type { CustomReportResult } from '../models/CustomReportResult';
import type { ReportConfiguration } from '../models/ReportConfiguration';
import type {
  DismissType,
  ExtendedBugReportMode,
  FloatingButtonPosition,
  InvocationEvent,
  InvocationOption,
  RecordingButtonPosition,
  userConsentActionType,
} from '../utils/Enums';
import { ReportType } from '../utils/Enums';
import { LuciqInvalidArgumentError } from '../utils/LuciqErrors';
import { Logger } from '../utils/logger';
import { setNativeHandler } from '../utils/NativeHandler';
import { LuciqDebugTags } from '../constants/DebugTags';

const TAG = LuciqDebugTags.BUG_REPORTING;

/**
 * Enables and disables manual invocation and prompt options for bug and feedback.
 * @param isEnabled
 */
export const setEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setEnabled', { isEnabled });
  NativeBugReporting.setEnabled(isEnabled);
};

/**
 * Sets the events that invoke the feedback form.
 * Default is set by `Luciq.init`.
 * @param events Array of events that invokes the feedback form.
 */
export const setInvocationEvents = (events: InvocationEvent[]) => {
  Logger.debug(TAG, 'setInvocationEvents', { events });
  NativeBugReporting.setInvocationEvents(events);
};

/**
 * Sets the invocation options.
 * Default is set by `Luciq.init`.
 * @param options Array of invocation options
 */
export const setOptions = (options: InvocationOption[]) => {
  Logger.debug(TAG, 'setOptions', { options });
  NativeBugReporting.setOptions(options);
};

/**
 * Sets a block of code to be executed just before the SDK's UI is presented.
 * This block is executed on the UI thread. Could be used for performing any
 * UI changes before the SDK's UI is shown.
 * @param handler A callback that gets executed before invoking the SDK
 */
export const onInvokeHandler = (handler: (() => void) | null) => {
  Logger.debug(TAG, 'onInvokeHandler', { hasHandler: !!handler });
  const wrappedHandler =
    handler &&
    (() => {
      Logger.debug(TAG, 'native event: ON_INVOKE_HANDLER fired');
      handler();
    });
  setNativeHandler(emitter, NativeEvents.ON_INVOKE_HANDLER, wrappedHandler, {
    set: () => NativeBugReporting.setOnInvokeHandler(),
    unset: () => NativeBugReporting.unsetOnInvokeHandler(),
  });
};

/**
 * Sets a block of code to be executed right after the SDK's UI is dismissed.
 * This block is executed on the UI thread. Could be used for performing any
 * UI changes after the SDK's UI is dismissed.
 * @param handler A callback to get executed after dismissing the SDK.
 */
export const onSDKDismissedHandler = (
  handler: ((dismissType: DismissType, reportType: ReportType) => void) | null,
) => {
  Logger.debug(TAG, 'onSDKDismissedHandler', { hasHandler: !!handler });
  const wrappedHandler =
    handler &&
    ((payload: { dismissType: DismissType; reportType: ReportType }) => {
      Logger.debug(TAG, 'native event: ON_DISMISS_HANDLER fired', {
        dismissType: payload?.dismissType,
        reportType: payload?.reportType,
      });
      handler(payload.dismissType, payload.reportType);
    });
  setNativeHandler(emitter, NativeEvents.ON_DISMISS_HANDLER, wrappedHandler, {
    set: () => NativeBugReporting.setOnSDKDismissedHandler(),
    unset: () => NativeBugReporting.unsetOnSDKDismissedHandler(),
  });
};

/**
 * Sets the threshold value of the shake gesture for iPhone/iPod Touch
 * Default for iPhone is 2.5.
 * @param threshold Threshold for iPhone.
 */
export const setShakingThresholdForiPhone = (threshold: number) => {
  Logger.debug(TAG, 'setShakingThresholdForiPhone', { threshold, platform: Platform.OS });
  if (Platform.OS === 'ios') {
    NativeBugReporting.setShakingThresholdForiPhone(threshold);
  }
};

/**
 * Sets the threshold value of the shake gesture for iPad.
 * Default for iPad is 0.6.
 * @param threshold Threshold for iPad.
 */
export const setShakingThresholdForiPad = (threshold: number) => {
  Logger.debug(TAG, 'setShakingThresholdForiPad', { threshold, platform: Platform.OS });
  if (Platform.OS === 'ios') {
    NativeBugReporting.setShakingThresholdForiPad(threshold);
  }
};

/**
 * Sets the threshold value of the shake gesture for android devices.
 * Default for android is an integer value equals 350.
 * you could increase the shaking difficulty level by
 * increasing the `350` value and vice versa
 * @param threshold Threshold for android devices.
 */
export const setShakingThresholdForAndroid = (threshold: number) => {
  Logger.debug(TAG, 'setShakingThresholdForAndroid', { threshold, platform: Platform.OS });
  if (Platform.OS === 'android') {
    NativeBugReporting.setShakingThresholdForAndroid(threshold);
  }
};

/**
 * Sets whether the extended bug report mode should be disabled, enabled with
 * required fields or enabled with optional fields.
 * @param mode An enum to disable the extended bug report mode,
 * enable it with required or with optional fields.
 */
export const setExtendedBugReportMode = (mode: ExtendedBugReportMode) => {
  Logger.debug(TAG, 'setExtendedBugReportMode', { mode });
  NativeBugReporting.setExtendedBugReportMode(mode);
};

/**
 * Sets what type of reports, bug or feedback, should be invoked.
 * @param types Array of reportTypes
 */
export const setReportTypes = (types: ReportType[]) => {
  Logger.debug(TAG, 'setReportTypes', { types });
  NativeBugReporting.setReportTypes(types);
};

/**
 * Invoke bug reporting with report type and options.
 * @param type
 * @param options
 */
export const show = (type: ReportType, options: InvocationOption[]) => {
  Logger.debug(TAG, 'show invoked', { type, options: options ?? [] });
  NativeBugReporting.show(type, options ?? []);
};

/**
 * Enable/Disable screen recording
 * @param isEnabled enable/disable screen recording on crash feature
 * @deprecated Auto screen recording is deprecated and scheduled for removal.
 * Use manual screen recording instead by enabling the `screenRecording` attachment type
 * via {@link setEnabledAttachmentTypes}.
 */
export const setAutoScreenRecordingEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setAutoScreenRecordingEnabled', { isEnabled });
  NativeBugReporting.setAutoScreenRecordingEnabled(isEnabled);
};

/**
 * Sets auto screen recording maximum duration
 *
 * @param maxDuration maximum duration of the screen recording video in seconds.
 * The maximum duration is 30 seconds
 * @deprecated Auto screen recording is deprecated and scheduled for removal.
 * Use manual screen recording instead by enabling the `screenRecording` attachment type
 * via {@link setEnabledAttachmentTypes}.
 */
export const setAutoScreenRecordingDurationIOS = (maxDuration: number) => {
  Logger.debug(TAG, 'setAutoScreenRecordingDurationIOS', { maxDuration, platform: Platform.OS });
  if (Platform.OS !== 'ios') {
    return;
  }
  NativeBugReporting.setAutoScreenRecordingDuration(maxDuration);
};

/**
 * Sets the default position at which the Luciq screen recording button will be shown.
 * Different orientations are already handled.
 * (Default for `position` is `bottomRight`)
 *
 * @param buttonPosition is of type position `topLeft` to show on the top left
 * of screen, or `bottomRight` to show on the bottom right of screen.
 */
export const setVideoRecordingFloatingButtonPosition = (
  buttonPosition: RecordingButtonPosition,
) => {
  Logger.debug(TAG, 'setVideoRecordingFloatingButtonPosition', { buttonPosition });
  NativeBugReporting.setVideoRecordingFloatingButtonPosition(buttonPosition);
};

/**
 * Enables/disables inspect view hierarchy when reporting a bug/feedback.
 * @param isEnabled A boolean to set whether view hierarchy are enabled or disabled.
 * @deprecated View hierarchy capture is discontinued and this API has no effect on iOS.
 * It is scheduled for removal.
 */
export const setViewHierarchyEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setViewHierarchyEnabled', { isEnabled });
  NativeBugReporting.setViewHierarchyEnabled(isEnabled);
};

/**
 * Adds a user consent item to the bug reporting form.
 * @param key A unique identifier string for the consent item.
 * @param description The text shown to the user describing the consent item.
 * @param mandatory Whether the user must agree to this item before submitting a report.
 * @param checked Whether the consent checkbox is pre-selected.
 * @param actionType A string representing the action type to map to SDK behavior.
 */
export const addUserConsent = (
  key: string,
  description: string,
  mandatory: boolean,
  checked: boolean,
  actionType?: userConsentActionType,
) => {
  // description may contain end-user-facing copy; log only its length.
  Logger.debug(TAG, 'addUserConsent', {
    key,
    descriptionLength: description?.length ?? 0,
    mandatory,
    checked,
    actionType,
  });
  NativeBugReporting.addUserConsent(key, description, mandatory, checked, actionType);
};
/**
 * Sets a block of code to be executed when a prompt option is selected.
 * @param handler - A callback that gets executed when a prompt option is selected.
 */
export const setDidSelectPromptOptionHandler = (
  handler: ((promptOption: string) => void) | null,
) => {
  Logger.debug(TAG, 'setDidSelectPromptOptionHandler', {
    hasHandler: !!handler,
    platform: Platform.OS,
  });
  if (Platform.OS === 'android') {
    return;
  }
  const wrappedHandler =
    handler &&
    ((payload: { promptOption: string }) => {
      Logger.debug(TAG, 'native event: DID_SELECT_PROMPT_OPTION_HANDLER fired', {
        promptOption: payload?.promptOption,
      });
      handler(payload.promptOption);
    });
  setNativeHandler(emitter, NativeEvents.DID_SELECT_PROMPT_OPTION_HANDLER, wrappedHandler, {
    set: () => NativeBugReporting.setDidSelectPromptOptionHandler(),
    unset: () => NativeBugReporting.unsetDidSelectPromptOptionHandler(),
  });
};

/**
 * Sets the default edge and offset from the top at which the floating button
 * will be shown. Different orientations are already handled.
 * @param edge The screen edge to show the floating button onto. Default is `floatingButtonEdge.right`.
 * @param offset The offset of the floating button from the top of the screen. Default is 50.
 */
export const setFloatingButtonEdge = (edge: FloatingButtonPosition, offset: number) => {
  Logger.debug(TAG, 'setFloatingButtonEdge', { edge, offset });
  NativeBugReporting.setFloatingButtonEdge(edge, offset);
};

/**
 * Sets whether attachments in bug reporting and in-app messaging are enabled or not.
 * @param screenshot A boolean to enable or disable screenshot attachments.
 * @param extraScreenshot A boolean to enable or disable extra screenshot attachments.
 * @param galleryImage A boolean to enable or disable gallery image attachments. In iOS 10+,
 * NSPhotoLibraryUsageDescription should be set in info.plist to enable gallery image attachments.
 * @param screenRecording A boolean to enable or disable screen recording attachments.
 */
export const setEnabledAttachmentTypes = (
  screenshot: boolean,
  extraScreenshot: boolean,
  galleryImage: boolean,
  screenRecording: boolean,
) => {
  Logger.debug(TAG, 'setEnabledAttachmentTypes', {
    screenshot,
    extraScreenshot,
    galleryImage,
    screenRecording,
  });
  NativeBugReporting.setEnabledAttachmentTypes(
    screenshot,
    extraScreenshot,
    galleryImage,
    screenRecording,
  );
};

/**
 * Adds a disclaimer text within the bug reporting form, which can include hyperlinked text.
 * @param text String text.
 */
export const setDisclaimerText = (text: string) => {
  Logger.debug(TAG, 'setDisclaimerText', { textLength: text?.length ?? 0 });
  NativeBugReporting.setDisclaimerText(text);
};

/**
 * Sets a minimum number of characters as a requirement for the comments field in the different report types.
 * @param limit int number of characters.
 * @param reportTypes (Optional) Array of reportType. If it's not passed, the limit will apply to all report types.
 * @platform iOS
 */
export const setCommentMinimumCharacterCount = (limit: number, reportTypes?: ReportType[]) => {
  Logger.debug(TAG, 'setCommentMinimumCharacterCount', {
    limit,
    reportTypes,
    platform: Platform.OS,
  });
  if (Platform.OS === 'ios') {
    NativeBugReporting.setCommentMinimumCharacterCount(limit, reportTypes ?? []);
  }
};

/**
 ** prompts end users to submit their feedback after our SDK automatically detects a frustrating experience.
 * @param config configuration of proActive  bug report.
 */
export const setProactiveReportingConfigurations = (config: ProactiveReportingConfigOptions) => {
  Logger.debug(TAG, 'setProactiveReportingConfigurations', {
    enabled: config.enabled,
    gapBetweenModals: config.gapBetweenModals,
    modalDelayAfterDetection: config.modalDelayAfterDetection,
  });
  NativeBugReporting.setProactiveReportingConfigurations(
    config.enabled,
    config.gapBetweenModals,
    config.modalDelayAfterDetection,
  );
};

const isKnownReportType = (type: unknown): type is ReportType =>
  Object.values(ReportType).includes(type as ReportType);

/**
 * Limits the report categories users see to the ones with these identifiers
 * (dashboard › Report Categories). Per report type: one match is preselected and
 * its next screen opens directly; two or more matches show only those
 * categories; no match shows all categories. If you pass a category and one of
 * its subcategories, only the category counts. Identifiers that match no
 * category, or more than one, are ignored. Until your categories have
 * identifiers, a category's slug is matched instead.
 *
 * The scope applies to every way of opening the SDK and to
 * `getReportConfiguration`. It is kept in memory only: set it again after the
 * app restarts. Call it after `Luciq.init`; calls made before that, or while
 * the SDK is disabled, are ignored.
 *
 * @param identifiers The category identifiers to show, or `null` / `[]` for all categories.
 */
export const setReportCategoriesScope = (identifiers: string[] | null) => {
  // Identifiers name dashboard categories; log only how many were passed.
  Logger.debug(TAG, 'setReportCategoriesScope', { count: identifiers?.length ?? 0 });
  NativeBugReporting.setReportCategoriesScope(identifiers ?? null);
};

/**
 * Gets the categories of a report type (narrowed by {@link setReportCategoriesScope}),
 * with their identifiers, fields and options, and the requirements {@link submitReport}
 * enforces (email, comment length, consents, extended fields and screenshot), to build
 * your own report UI from.
 *
 * @param type `ReportType.bug`, `ReportType.feedback` or `ReportType.question`.
 * @returns The configuration, or `null` when custom reports aren't turned on
 * for your app, Bug Reporting or the report type isn't available (for example
 * after `BugReporting.setEnabled(false)`), or the plan's usage is exceeded.
 * @throws {LuciqInvalidArgumentError} (rejects with code `LCQ_INVALID_ARGUMENT`)
 * when `type` is not a known `ReportType`.
 */
export const getReportConfiguration = async (
  type: ReportType,
): Promise<ReportConfiguration | null> => {
  Logger.debug(TAG, 'getReportConfiguration', { type });
  if (!isKnownReportType(type)) {
    throw new LuciqInvalidArgumentError(
      `getReportConfiguration: unknown report type ${String(type)}; use a ReportType value.`,
    );
  }

  const configuration = await NativeBugReporting.getReportConfiguration(type);
  return configuration ? { ...configuration, reportType: type } : null;
};

/**
 * Submits a report collected by your own UI. The SDK captures the app state
 * now (device info, logs, user steps, user data, tags and the current view),
 * validates the report against your dashboard and SDK configuration, and
 * queues it for upload. Nothing is captured or saved unless the result is `queued`.
 * Files added with `Luciq.addFileAttachment` are sent with the report, and
 * every report gets the `custom-api` tag.
 *
 * Custom reports are turned on for your app by the server. Until then every
 * report resolves `notSent` with `unavailable`, even one that would be
 * `invalid`, and {@link getReportConfiguration} resolves `null`. Malformed
 * input still rejects first.
 *
 * Only for reports a person writes: the app must be in the foreground, and
 * accepted reports are limited to one every 60 seconds and 10 per hour per
 * device, with the same report not sent twice within 24 hours. These limits
 * don't apply to the SDK's own report screens. `Luciq.onReportSubmitHandler`
 * runs for these reports; the invoke and dismiss handlers do not.
 *
 * @param report The report. Get the category identifier and field keys from
 * {@link getReportConfiguration}.
 * @returns The result: `queued`, `notSent` with a reason, or `invalid` with
 * every problem at once. The Promise resolves for every outcome the SDK
 * reports and rejects (code `LCQ_INVALID_ARGUMENT`) only for malformed input.
 * @throws {LuciqInvalidArgumentError} when `report` is not an object, its
 * `reportType` is not a known `ReportType`, or a part of it has the wrong type.
 */
export const submitReport = async (report: CustomReport): Promise<CustomReportResult> => {
  if (report == null || typeof report !== 'object' || !isKnownReportType(report.reportType)) {
    throw new LuciqInvalidArgumentError(
      'submitReport: report must be an object with a known ReportType.',
    );
  }

  const native = toNativeCustomReport(report);
  // The report is user content; log only which parts are set.
  Logger.debug(TAG, 'submitReport', { reportType: report.reportType, parts: Object.keys(native) });
  return NativeBugReporting.submitReport(report.reportType, native);
};
