import { AppState, type AppStateStatus, findNodeHandle, Platform } from 'react-native';

import type {
  NavigationContainerRefWithCurrent,
  NavigationState as NavigationStateV5,
} from '@react-navigation/native';
import type { ComponentDidAppearEvent } from 'react-native-navigation';
import type { NavigationAction, NavigationState as NavigationStateV4 } from 'react-navigation';

import type { LuciqConfig } from '../models/LuciqConfig';
import Report from '../models/Report';
import { emitter, NativeEvents, NativeLuciq } from '../native/NativeLuciq';
import { registerFeatureFlagsListener, initFeatureFlagsCache } from '../utils/FeatureFlags';
import {
  AutoMaskingType,
  ColorTheme,
  Locale,
  LogLevel,
  NetworkInterceptionMode,
  ReproStepsMode,
  StringKey,
  WelcomeMessageMode,
} from '../utils/Enums';
import LuciqUtils, {
  checkNetworkRequestHandlers,
  resetNativeObfuscationListener,
  setApmNetworkFlagsIfChanged,
  stringifyIfNotString,
} from '../utils/LuciqUtils';
import * as NetworkLogger from './NetworkLogger';
import { captureUnhandledRejections } from '../utils/UnhandledRejectionTracking';
import { ScreenLoadingManager } from './apm/ScreenLoadingManager';
import type { ReproConfig } from '../models/ReproConfig';
import type { FeatureFlag } from '../models/FeatureFlag';
import { addAppStateListener } from '../utils/AppStatesHandler';
import { NativeNetworkLogger } from '../native/NativeNetworkLogger';
import LuciqConstants from '../utils/LuciqConstants';
import { LuciqRNConfig } from '../utils/config';
import { Logger } from '../utils/logger';
import { LuciqDebugTags } from '../constants/DebugTags';
import type { OverAirUpdate } from '../models/OverAirUpdate';
import type { ThemeConfig } from '../models/ThemeConfig';

let _currentScreen: string | null = null;
let _lastScreen: string | null = null;
let _isFirstScreen = false;
const firstScreen = 'Initial Screen';
let _currentAppState = AppState.currentState;
let isNativeInterceptionFeatureEnabled = false; // Checks the value of "cp_native_interception_enabled" backend flag.
let hasAPMNetworkPlugin = false; // Android only: checks if the APM plugin is installed.
let shouldEnableNativeInterception = false; // For Android: used to disable APM logging inside reportNetworkLog() -> NativeAPM.networkLogAndroid(), For iOS: used to control native interception (true == enabled , false == disabled)

// Screen Loading tracking variables
let _navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList> | null = null;
let _currentRoute: string | null = null;
let _activeNavigationSpanId: string | null = null;
let _stateChangeTimeout: ReturnType<typeof setTimeout> | undefined;
const STATE_CHANGE_TIMEOUT_MS = 2000; // Safety timeout if state never changes

/**
 * Enables or disables Luciq functionality.
 * @param isEnabled A boolean to enable/disable Luciq.
 */
export const setEnabled = (isEnabled: boolean) => {
  Logger.debug(LuciqDebugTags.CORE, 'setEnabled', { isEnabled });
  NativeLuciq.setEnabled(isEnabled);
};

/**
 * Reports that the screen name been changed (Current View field on dashboard).
 * only for android.
 *
 * Normally reportScreenChange handles taking a screenshot for reproduction
 * steps and the Current View field on the dashboard. But we've faced issues
 * in android where we needed to separate them, that's why we only call it
 * for android.
 *
 * @param screenName string containing the screen name
 */
function reportCurrentViewForAndroid(screenName: string | null) {
  if (Platform.OS === 'android' && screenName != null) {
    NativeLuciq.reportCurrentViewChange(screenName);
  }
}

/**
 * Initializes the SDK.
 * This is the main SDK method that does all the magic. This is the only
 * method that SHOULD be called.
 * Should be called in constructor of the AppRegistry component
 * @param config SDK configurations. See {@link LuciqConfig} for more info.
 */
export const init = (config: LuciqConfig) => {
  Logger.debug(LuciqDebugTags.CORE, 'init invoked', {
    tokenPresent: !!config.token,
    invocationEvents: config.invocationEvents,
    debugLogsLevel: config.debugLogsLevel,
    networkInterceptionMode: config.networkInterceptionMode,
    appVariant: config.appVariant,
    overAirVersionPresent: !!config.overAirVersion,
  });
  initFeatureFlagsCache();

  if (Platform.OS === 'android') {
    // Add android feature flags listener for android
    registerFeatureFlagsListener();
    addOnFeatureUpdatedListener(config);

    // Enable the JS XHR interceptor synchronously so cold-start requests
    // (fired before LCQ_ON_FEATURES_UPDATED_CALLBACK arrives) are captured.
    handleNetworkInterceptionMode(config);

    setApmNetworkFlagsIfChanged({
      isNativeInterceptionFeatureEnabled: isNativeInterceptionFeatureEnabled,
      hasAPMNetworkPlugin: hasAPMNetworkPlugin,
      shouldEnableNativeInterception: shouldEnableNativeInterception,
    });
  } else {
    isNativeInterceptionFeatureEnabled = NativeNetworkLogger.isNativeInterceptionEnabled();

    // Add app state listener to handle background/foreground transitions
    addAppStateListener(async (nextAppState) => handleAppStateChange(nextAppState, config));

    handleNetworkInterceptionMode(config);

    //Set APM networking flags for the first time
    setApmNetworkFlagsIfChanged({
      isNativeInterceptionFeatureEnabled: isNativeInterceptionFeatureEnabled,
      hasAPMNetworkPlugin: hasAPMNetworkPlugin,
      shouldEnableNativeInterception: shouldEnableNativeInterception,
    });
  }

  // call Luciq native init method
  initializeNativeLuciq(config);

  // Set up error capturing and rejection handling
  LuciqUtils.captureJsErrors();
  captureUnhandledRejections();

  _isFirstScreen = true;
  _currentScreen = firstScreen;

  LuciqRNConfig.debugLogsLevel = config.debugLogsLevel ?? LogLevel.error;

  reportCurrentViewForAndroid(firstScreen);
  setTimeout(() => {
    if (_currentScreen === firstScreen) {
      NativeLuciq.reportScreenChange(firstScreen, null);
      _currentScreen = null;
    }
  }, 1000);

  Logger.debug(LuciqDebugTags.CORE, 'init completed (JS-side setup)', {
    debugLogsLevel: LuciqRNConfig.debugLogsLevel,
  });
};

/**
 * Changes the JS-side debug log verbosity at runtime.
 *
 * Use this when you need to capture a debug trace mid-session (e.g. a support
 * flow where the user reproduces an issue) without re-initializing the SDK.
 * Affects only the JS Logger - the native SDK's own log level is set at
 * `init()` time and is not changed by this call.
 *
 * @param level One of LogLevel.error / debug / verbose / none.
 */
export const setDebugLogsLevel = (level: LogLevel) => {
  const previous = LuciqRNConfig.debugLogsLevel;
  // Emit BEFORE mutating so the transition is visible even when lowering to none.
  Logger.debug(LuciqDebugTags.CORE, 'setDebugLogsLevel changed', { previous, level });
  LuciqRNConfig.debugLogsLevel = level;
};

/**
 * Set Current App Variant.
 * @param appVariant the current App variant name
 */
export const setAppVariant = (appVariant: string) => {
  Logger.debug(LuciqDebugTags.CORE, 'setAppVariant', {
    appVariantLength: appVariant?.length ?? 0,
  });
  NativeLuciq.setAppVariant(appVariant);
};

/**
 * Enables or disables WebView monitoring.
 * @param isEnabled A boolean to enable/disable WebView monitoring.
 */
export const setWebViewMonitoringEnabled = (isEnabled: boolean) => {
  Logger.debug(LuciqDebugTags.CORE, 'setWebViewMonitoringEnabled', { isEnabled });
  NativeLuciq.setWebViewMonitoringEnabled(isEnabled);
};

/**
 * Enables or disables WebView network tracking.
 * @param isEnabled A boolean to enable/disable WebView network tracking.
 */
export const setWebViewNetworkTrackingEnabled = (isEnabled: boolean) => {
  Logger.debug(LuciqDebugTags.CORE, 'setWebViewNetworkTrackingEnabled', { isEnabled });
  NativeLuciq.setWebViewNetworkTrackingEnabled(isEnabled);
};

/**
 * Enables or disables WebView user interactions tracking.
 * @param isEnabled A boolean to enable/disable WebView user interactions tracking.
 */
export const setWebViewUserInteractionsTrackingEnabled = (isEnabled: boolean) => {
  Logger.debug(LuciqDebugTags.CORE, 'setWebViewUserInteractionsTrackingEnabled', { isEnabled });
  NativeLuciq.setWebViewUserInteractionsTrackingEnabled(isEnabled);
};

/**
 * Handles app state changes and updates APM network flags if necessary.
 */
const handleAppStateChange = async (nextAppState: AppStateStatus, config: LuciqConfig) => {
  // Checks if the app has come to the foreground
  if (['inactive', 'background'].includes(_currentAppState) && nextAppState === 'active') {
    const isUpdated = await fetchApmNetworkFlags();
    if (isUpdated) {
      refreshAPMNetworkConfigs(config);
    }
    // Refresh screen loading flags from native
    await ScreenLoadingManager.refreshFlags();
  }

  _currentAppState = nextAppState;
};

/**
 * Fetches the current APM network flags.
 */
const fetchApmNetworkFlags = async () => {
  let isUpdated = false;
  const newNativeInterceptionFeatureEnabled = NativeNetworkLogger.isNativeInterceptionEnabled();
  if (isNativeInterceptionFeatureEnabled !== newNativeInterceptionFeatureEnabled) {
    isNativeInterceptionFeatureEnabled = newNativeInterceptionFeatureEnabled;
    isUpdated = true;
  }
  if (Platform.OS === 'android') {
    const newHasAPMNetworkPlugin = await NativeNetworkLogger.hasAPMNetworkPlugin();
    if (hasAPMNetworkPlugin !== newHasAPMNetworkPlugin) {
      hasAPMNetworkPlugin = newHasAPMNetworkPlugin;
      isUpdated = true;
    }
  }
  return isUpdated;
};

/**
 * Handles platform-specific checks and updates the network interception mode.
 */
const handleNetworkInterceptionMode = (config: LuciqConfig) => {
  // Default networkInterceptionMode to JavaScript if not set
  if (config.networkInterceptionMode == null) {
    config.networkInterceptionMode = NetworkInterceptionMode.javascript;
  }

  if (Platform.OS === 'android') {
    handleInterceptionModeForAndroid(config);
    config.networkInterceptionMode = NetworkInterceptionMode.javascript; // Need to enable JS interceptor in all scenarios for Bugs & Crashes network logs
  } else if (Platform.OS === 'ios') {
    handleInterceptionModeForIOS(config);
    //enable | disable native obfuscation and filtering synchronously
    NetworkLogger.setNativeInterceptionEnabled(shouldEnableNativeInterception);
  }

  if (config.networkInterceptionMode === NetworkInterceptionMode.javascript) {
    NetworkLogger.setEnabled(true);
  }
};

/**
 * Handles the network interception logic for Android if the user set
 * network interception mode with [NetworkInterceptionMode.javascript].
 */
function handleAndroidJSInterception() {
  if (isNativeInterceptionFeatureEnabled && hasAPMNetworkPlugin) {
    shouldEnableNativeInterception = true;
    Logger.warn(LuciqDebugTags.APM_NETWORK, LuciqConstants.SWITCHED_TO_NATIVE_INTERCEPTION_MESSAGE);
  }
}

/**
 * Handles the network interception logic for Android if the user set
 * network interception mode with [NetworkInterceptionMode.native].
 */
function handleAndroidNativeInterception() {
  if (isNativeInterceptionFeatureEnabled) {
    shouldEnableNativeInterception = hasAPMNetworkPlugin;
    if (!hasAPMNetworkPlugin) {
      Logger.error(LuciqDebugTags.APM_NETWORK, LuciqConstants.PLUGIN_NOT_INSTALLED_MESSAGE);
    }
  } else {
    shouldEnableNativeInterception = false; // rollback to use JS interceptor for APM & Core.
    Logger.error(LuciqDebugTags.APM_NETWORK, LuciqConstants.NATIVE_INTERCEPTION_DISABLED_MESSAGE);
  }
}

/**
 * Control either to enable or disable the native interception for iOS after the init method is called.
 */
function handleIOSNativeInterception(config: LuciqConfig) {
  if (
    shouldEnableNativeInterception &&
    config.networkInterceptionMode === NetworkInterceptionMode.native
  ) {
    NativeNetworkLogger.forceStartNetworkLoggingIOS(); // Enable native iOS automatic network logging.
  } else {
    NativeNetworkLogger.forceStopNetworkLoggingIOS(); // Disable native iOS automatic network logging.
  }
}

/**
 * Handles the network interception mode logic for Android.
 * By deciding which interception mode should be enabled (Native or JavaScript).
 */
const handleInterceptionModeForAndroid = (config: LuciqConfig) => {
  const { networkInterceptionMode } = config;

  if (networkInterceptionMode === NetworkInterceptionMode.javascript) {
    handleAndroidJSInterception();
  } else {
    handleAndroidNativeInterception();
  }
};

/**
 * Handles the interception mode logic for iOS.
 * By deciding which interception mode should be enabled (Native or JavaScript).
 */
const handleInterceptionModeForIOS = (config: LuciqConfig) => {
  if (config.networkInterceptionMode === NetworkInterceptionMode.native) {
    if (isNativeInterceptionFeatureEnabled) {
      shouldEnableNativeInterception = true;
      NetworkLogger.setEnabled(false); // insure JS interceptor is disabled
    } else {
      shouldEnableNativeInterception = false;
      NetworkLogger.setEnabled(true); // rollback to JS interceptor
      Logger.error(LuciqDebugTags.APM_NETWORK, LuciqConstants.NATIVE_INTERCEPTION_DISABLED_MESSAGE);
    }
  }
};

/**
 * Initializes Luciq with the given configuration.
 */
const initializeNativeLuciq = (config: LuciqConfig) => {
  NativeLuciq.init(
    config.token,
    config.invocationEvents,
    config.debugLogsLevel ?? LogLevel.error,
    shouldEnableNativeInterception &&
      config.networkInterceptionMode === NetworkInterceptionMode.native,
    config.codePushVersion,
    config.appVariant,
    config.ignoreAndroidSecureFlag != null
      ? {
          ignoreAndroidSecureFlag: config.ignoreAndroidSecureFlag,
        }
      : undefined,
    config.overAirVersion,
  );
  Logger.debug(LuciqDebugTags.CORE, 'native init dispatched', {
    nativeInterception:
      shouldEnableNativeInterception &&
      config.networkInterceptionMode === NetworkInterceptionMode.native,
  });
};

/**
 * Refresh the APM network configurations.
 */
function refreshAPMNetworkConfigs(config: LuciqConfig, forceRefreshIOS: boolean = true) {
  handleNetworkInterceptionMode(config);
  if (Platform.OS === 'ios' && forceRefreshIOS) {
    handleIOSNativeInterception(config);
  }
  setApmNetworkFlagsIfChanged({
    isNativeInterceptionFeatureEnabled,
    hasAPMNetworkPlugin,
    shouldEnableNativeInterception,
  });
  if (shouldEnableNativeInterception) {
    checkNetworkRequestHandlers();
  } else {
    // remove any attached [NativeNetworkLogger] Listeners if exists, to avoid memory leaks.
    resetNativeObfuscationListener();
  }
}

/**
 * Add Android Listener for native feature flags changes.
 */
function addOnFeatureUpdatedListener(config: LuciqConfig) {
  emitter.addListener(NativeEvents.LCQ_ON_FEATURES_UPDATED_CALLBACK, (flags) => {
    const { cpNativeInterceptionEnabled, hasAPMPlugin } = flags;
    isNativeInterceptionFeatureEnabled = cpNativeInterceptionEnabled;
    hasAPMNetworkPlugin = hasAPMPlugin;
    shouldEnableNativeInterception =
      config.networkInterceptionMode === NetworkInterceptionMode.native;
    refreshAPMNetworkConfigs(config);
  });
  NativeLuciq.setOnFeaturesUpdatedListener();
}

/**
 * Sets the Code Push version to be sent with each report.
 * @param version the Code Push version.
 *
 * @deprecated Use {@link setOverAirVersion} instead.
 */
export const setCodePushVersion = (version: string) => {
  NativeLuciq.setCodePushVersion(version);
};

/**
 * Sets over air update version to be sent with each report.
 * @param version the OTA version.
 *
 */
export const setOverAirVersion = (OTAserviceVersion: OverAirUpdate) => {
  NativeLuciq.setOverAirVersion(OTAserviceVersion);
};

/**
 * Attaches user data to each report being sent.
 * Each call to this method overrides the user data to be attached.
 * Maximum size of the string is 1,000 characters.
 * @param data A string to be attached to each report, with a maximum size of 1,000 characters.
 */
export const setUserData = (data: string) => {
  Logger.debug(LuciqDebugTags.CORE, 'setUserData', { dataLength: data?.length ?? 0 });
  NativeLuciq.setUserData(data);
};

/**
 * Sets whether the SDK is tracking user steps or not.
 * Enabling user steps would give you an insight on the scenario a user has
 * performed before encountering a bug or a crash. User steps are attached
 * with each report being sent.
 * @param isEnabled A boolean to set user steps tracking to being enabled or disabled.
 */
export const setTrackUserSteps = (isEnabled: boolean) => {
  Logger.debug(LuciqDebugTags.CORE, 'setTrackUserSteps', { isEnabled, platform: Platform.OS });
  if (Platform.OS === 'ios') {
    NativeLuciq.setTrackUserSteps(isEnabled);
  }
};

/**
 * Sets whether LCQLog should also print to Xcode's console log or not.
 * @param printsToConsole A boolean to set whether printing to
 * Xcode's console is enabled or not.
 */
export const setLCQLogPrintsToConsole = (printsToConsole: boolean) => {
  Logger.debug(LuciqDebugTags.CORE, 'setLCQLogPrintsToConsole', {
    printsToConsole,
    platform: Platform.OS,
  });
  if (Platform.OS === 'ios') {
    NativeLuciq.setLCQLogPrintsToConsole(printsToConsole);
  }
};

/**
 * The session profiler is enabled by default and it attaches to the bug and
 * crash reports the following information during the last 60 seconds before the report is sent.
 * @param isEnabled A boolean parameter to enable or disable the feature.
 */
export const setSessionProfilerEnabled = (isEnabled: boolean) => {
  Logger.debug(LuciqDebugTags.CORE, 'setSessionProfilerEnabled', { isEnabled });
  NativeLuciq.setSessionProfilerEnabled(isEnabled);
};

/**
 * Sets the SDK's locale.
 * Use to change the SDK's UI to different language.
 * Defaults to the device's current locale.
 * @param sdkLocale A locale to set the SDK to.
 */
export const setLocale = (sdkLocale: Locale) => {
  Logger.debug(LuciqDebugTags.CORE, 'setLocale', { sdkLocale });
  NativeLuciq.setLocale(sdkLocale);
};

/**
 * Sets the color theme of the SDK's whole UI.
 * @param sdkTheme
 */
export const setColorTheme = (sdkTheme: ColorTheme) => {
  Logger.debug(LuciqDebugTags.CORE, 'setColorTheme', { sdkTheme });
  NativeLuciq.setColorTheme(sdkTheme);
};

/**
 * Sets the primary color of the SDK's UI.
 * Sets the color of UI elements indicating interactivity or call to action.
 * To use, import processColor and pass to it with argument the color hex
 * as argument.
 * @param color A color to set the UI elements of the SDK to.
 * @deprecated Please migrate to the new UI customization API: {@link setTheme}
 */
export const setPrimaryColor = (color: string) => {
  Logger.debug(LuciqDebugTags.CORE, 'setPrimaryColor', { colorPresent: !!color });
  NativeLuciq.setTheme({ primaryColor: color });
};

/**
 * Appends a set of tags to previously added tags of reported feedback,
 * bug or crash.
 * @param tags An array of tags to append to current tags.
 */
export const appendTags = (tags: string[]) => {
  Logger.debug(LuciqDebugTags.CORE, 'appendTags', { count: tags?.length ?? 0 });
  NativeLuciq.appendTags(tags);
};

/**
 * Manually removes all tags of reported feedback, bug or crash.
 */
export const resetTags = () => {
  Logger.debug(LuciqDebugTags.CORE, 'resetTags');
  NativeLuciq.resetTags();
};

/**
 * Gets all tags of reported feedback, bug or crash.
 */
export const getTags = async (): Promise<string[] | null> => {
  Logger.debug(LuciqDebugTags.CORE, 'getTags invoked');
  const tags = await NativeLuciq.getTags();
  Logger.debug(LuciqDebugTags.CORE, 'getTags resolved', { count: tags?.length ?? 0 });

  return tags;
};

/**
 * Overrides any of the strings shown in the SDK with custom ones.
 * Allows you to customize any of the strings shown to users in the SDK.
 * @param key Key of string to override.
 * @param string String value to override the default one.
 */
export const setString = (key: StringKey, string: string) => {
  Logger.debug(LuciqDebugTags.CORE, 'setString', { key, valueLength: string?.length ?? 0 });
  // Suffix the repro steps list item numbering title with a # to unify the string key's
  // behavior between Android and iOS
  if (Platform.OS === 'android' && key === StringKey.reproStepsListItemNumberingTitle) {
    string = `${string} #`;
  }

  NativeLuciq.setString(string, key);
};

/**
 * Sets the default value of the user's email and ID and hides the email field from the reporting UI
 * and set the user's name to be included with all reports.
 * It also reset the chats on device to that email and removes user attributes,
 * user data and completed surveys.
 * @param email Email address to be set as the user's email.
 * @param name Name of the user to be set.
 * @param [id] ID of the user to be set.
 */
export const identifyUser = (email: string, name: string, id?: string) => {
  Logger.debug(LuciqDebugTags.CORE, 'identifyUser', {
    hasEmail: !!email,
    hasName: !!name,
    hasId: !!id,
  });
  NativeLuciq.identifyUser(email, name, id);
};

/**
 * Sets the default value of the user's email to nil and show email field and remove user name
 * from all reports
 * It also reset the chats on device and removes user attributes, user data and completed surveys.
 */
export const logOut = () => {
  Logger.debug(LuciqDebugTags.CORE, 'logOut');
  NativeLuciq.logOut();
};

/**
 * Logs a user event that happens through the lifecycle of the application.
 * Logged user events are going to be sent with each report, as well as at the end of a session.
 * @param name Event name.
 */
export const logUserEvent = (name: string) => {
  Logger.debug(LuciqDebugTags.CORE, 'logUserEvent', { name });
  NativeLuciq.logUserEvent(name);
};

/**
 * Appends a log message to Luciq internal log.
 * These logs are then sent along the next uploaded report.
 * All log messages are timestamped.
 * Logs aren't cleared per single application run.
 * If you wish to reset the logs, use {@link clearLogs()}
 * Note: logs passed to this method are **NOT** printed to Logcat.
 *
 * @param message the message
 */
export const logVerbose = (message: string) => {
  if (!message) {
    return;
  }
  Logger.debug(LuciqDebugTags.CORE, 'logVerbose', { messageLength: message.length });
  message = stringifyIfNotString(message);
  NativeLuciq.logVerbose(message);
};

/**
 * Appends a log message to Luciq internal log.
 * These logs are then sent along the next uploaded report.
 * All log messages are timestamped.
 * Logs aren't cleared per single application run.
 * If you wish to reset the logs, use {@link clearLogs()}
 * Note: logs passed to this method are **NOT** printed to Logcat.
 *
 * @param message the message
 */
export const logInfo = (message: string) => {
  if (!message) {
    return;
  }
  Logger.debug(LuciqDebugTags.CORE, 'logInfo', { messageLength: message.length });
  message = stringifyIfNotString(message);
  NativeLuciq.logInfo(message);
};

/**
 * Appends a log message to Luciq internal log.
 * These logs are then sent along the next uploaded report.
 * All log messages are timestamped.
 * Logs aren't cleared per single application run.
 * If you wish to reset the logs, use {@link clearLogs()}
 * Note: logs passed to this method are **NOT** printed to Logcat.
 *
 * @param message the message
 */
export const logDebug = (message: string) => {
  if (!message) {
    return;
  }
  Logger.debug(LuciqDebugTags.CORE, 'logDebug', { messageLength: message.length });
  message = stringifyIfNotString(message);
  NativeLuciq.logDebug(message);
};

/**
 * Appends a log message to Luciq internal log.
 * These logs are then sent along the next uploaded report.
 * All log messages are timestamped.
 * Logs aren't cleared per single application run.
 * If you wish to reset the logs, use {@link clearLogs()}
 * Note: logs passed to this method are **NOT** printed to Logcat.
 *
 * @param message the message
 */
export const logError = (message: string) => {
  if (!message) {
    return;
  }
  Logger.debug(LuciqDebugTags.CORE, 'logError', { messageLength: message.length });
  message = stringifyIfNotString(message);
  NativeLuciq.logError(message);
};

/**
 * Appends a log message to Luciq internal log.
 * These logs are then sent along the next uploaded report.
 * All log messages are timestamped.
 * Logs aren't cleared per single application run.
 * If you wish to reset the logs, use {@link clearLogs()}
 * Note: logs passed to this method are **NOT** printed to Logcat.
 *
 * @param message the message
 */
export const logWarn = (message: string) => {
  if (!message) {
    return;
  }
  Logger.debug(LuciqDebugTags.CORE, 'logWarn', { messageLength: message.length });
  message = stringifyIfNotString(message);
  NativeLuciq.logWarn(message);
};

/**
 * Clear all Luciq logs, console logs, network logs and user steps.
 */
export const clearLogs = () => {
  Logger.debug(LuciqDebugTags.CORE, 'clearLogs');
  NativeLuciq.clearLogs();
};

/**
 * Sets the repro steps mode for bugs and crashes.
 *
 * @param config The repro steps config.
 *
 * @example
 * ```js
 * Luciq.setReproStepsConfig({
 *   bug: ReproStepsMode.enabled,
 *   crash: ReproStepsMode.disabled,
 *   sessionReplay: ReproStepsMode.enabled,
 * });
 * ```
 */
export const setReproStepsConfig = (config: ReproConfig) => {
  let bug = config.bug ?? ReproStepsMode.enabled;
  let crash = config.crash ?? ReproStepsMode.enabledWithNoScreenshots;
  let sessionReplay = config.sessionReplay ?? ReproStepsMode.enabled;

  if (config.all != null) {
    bug = config.all;
    crash = config.all;
    sessionReplay = config.all;
  }

  Logger.debug(LuciqDebugTags.CORE, 'setReproStepsConfig', { bug, crash, sessionReplay });
  NativeLuciq.setReproStepsConfig(bug, crash, sessionReplay);
};

/**
 * Sets user attribute to overwrite it's value or create a new one if it doesn't exist.
 *
 * @param key the attribute
 * @param value the value
 */
export const setUserAttribute = (key: string, value: string) => {
  if (!key || typeof key !== 'string' || typeof value !== 'string') {
    Logger.error(LuciqDebugTags.CORE, LuciqConstants.SET_USER_ATTRIBUTES_ERROR_TYPE_MESSAGE, {
      keyType: typeof key,
      valueType: typeof value,
      keyPresent: !!key,
    });
    return;
  }

  NativeLuciq.setUserAttribute(key, value);
};

/**
 * Returns the user attribute associated with a given key.
 * @param key The attribute key as string
 */
export const getUserAttribute = async (key: string): Promise<string | null> => {
  Logger.debug(LuciqDebugTags.CORE, 'getUserAttribute invoked', { key });
  const attribute = await NativeLuciq.getUserAttribute(key);
  Logger.debug(LuciqDebugTags.CORE, 'getUserAttribute resolved', {
    key,
    valuePresent: attribute != null,
  });

  return attribute;
};

/**
 * Removes user attribute if exists.
 *
 * @param key the attribute key as string
 * @see {@link setUserAttribute}
 */
export const removeUserAttribute = (key: string) => {
  if (!key || typeof key !== 'string') {
    Logger.error(LuciqDebugTags.CORE, LuciqConstants.REMOVE_USER_ATTRIBUTES_ERROR_TYPE_MESSAGE, {
      keyType: typeof key,
      keyPresent: !!key,
    });

    return;
  }
  NativeLuciq.removeUserAttribute(key);
};

/**
 * Returns all user attributes.
 * set user attributes, or an empty dictionary if no user attributes have been set.
 */
export const getAllUserAttributes = async (): Promise<Record<string, string>> => {
  Logger.debug(LuciqDebugTags.CORE, 'getAllUserAttributes invoked');
  const attributes = await NativeLuciq.getAllUserAttributes();
  Logger.debug(LuciqDebugTags.CORE, 'getAllUserAttributes resolved', {
    count: attributes ? Object.keys(attributes).length : 0,
  });

  return attributes;
};

/**
 * Clears all user attributes if exists.
 */
export const clearAllUserAttributes = () => {
  Logger.debug(LuciqDebugTags.CORE, 'clearAllUserAttributes');
  NativeLuciq.clearAllUserAttributes();
};

/**
 * Shows the welcome message in a specific mode.
 * @param mode An enum to set the welcome message mode to live, or beta.
 */
export const showWelcomeMessage = (mode: WelcomeMessageMode) => {
  Logger.debug(LuciqDebugTags.CORE, 'showWelcomeMessage', { mode });
  NativeLuciq.showWelcomeMessageWithMode(mode);
};

/**
 * Sets the welcome message mode to live, beta or disabled.
 * @param mode An enum to set the welcome message mode to live, beta or disabled.
 */
export const setWelcomeMessageMode = (mode: WelcomeMessageMode) => {
  Logger.debug(LuciqDebugTags.CORE, 'setWelcomeMessageMode', { mode });
  NativeLuciq.setWelcomeMessageMode(mode);
};

/**
 * Add file to be attached to the bug report.
 * @param filePath
 * @param fileName
 */
export const addFileAttachment = (filePath: string, fileName: string) => {
  Logger.debug(LuciqDebugTags.CORE, 'addFileAttachment', {
    hasFilePath: !!filePath,
    fileName,
    platform: Platform.OS,
  });
  if (Platform.OS === 'android') {
    NativeLuciq.setFileAttachment(filePath, fileName);
  } else {
    NativeLuciq.setFileAttachment(filePath);
  }
};

/**
 * Hides component from screenshots, screen recordings and view hierarchy.
 * @param viewRef the ref of the component to hide
 */
export const addPrivateView = (viewRef: number | React.Component | React.ComponentClass) => {
  const nativeTag = findNodeHandle(viewRef);
  Logger.debug(LuciqDebugTags.PRIVATE_VIEW, 'addPrivateView called', {
    nativeTag,
    resolved: nativeTag != null,
  });
  if (nativeTag == null) {
    Logger.warn(LuciqDebugTags.PRIVATE_VIEW, 'addPrivateView could not resolve native tag', {
      consequence: 'view will NOT be masked',
      hint: 'ensure the ref is attached to a mounted native view',
    });
  }
  NativeLuciq.addPrivateView(nativeTag);
};

/**
 * Removes component from the set of hidden views. The component will show again in
 * screenshots, screen recordings and view hierarchy.
 * @param viewRef the ref of the component to remove from hidden views
 */
export const removePrivateView = (viewRef: number | React.Component | React.ComponentClass) => {
  const nativeTag = findNodeHandle(viewRef);
  Logger.debug(LuciqDebugTags.PRIVATE_VIEW, 'removePrivateView called', {
    nativeTag,
    resolved: nativeTag != null,
  });
  if (nativeTag == null) {
    Logger.warn(LuciqDebugTags.PRIVATE_VIEW, 'removePrivateView could not resolve native tag', {
      consequence: 'no-op',
    });
  }
  NativeLuciq.removePrivateView(nativeTag);
};

/**
 * Shows default Luciq prompt.
 */
export const show = () => {
  Logger.debug(LuciqDebugTags.CORE, 'show');
  NativeLuciq.show();
};

export const onReportSubmitHandler = (handler?: (report: Report) => void) => {
  Logger.debug(LuciqDebugTags.CORE, 'onReportSubmitHandler registered', {
    hasHandler: !!handler,
  });
  emitter.addListener(NativeEvents.PRESENDING_HANDLER, (report) => {
    const { tags, consoleLogs, luciqLogs, userAttributes, fileAttachments } = report;
    const reportObj = new Report(tags, consoleLogs, luciqLogs, userAttributes, fileAttachments);
    handler && handler(reportObj);
  });

  NativeLuciq.setPreSendingHandler(handler);
};

/**
 * Helper to clear the state change timeout
 */
const _clearStateChangeTimeout = (): void => {
  if (_stateChangeTimeout) {
    clearTimeout(_stateChangeTimeout);
    _stateChangeTimeout = undefined;
  }
};

/**
 * Handles React Navigation's __unsafe_action__ event
 * This fires WHEN a navigation action is dispatched (the start of navigation)
 */
const _onNavigationAction = (event?: any): void => {
  // Check for noop actions that shouldn't create spans
  if (event?.data?.noop) {
    Logger.debug(LuciqDebugTags.APM_SCREEN_LOADING, 'navigation noop, no span');
    return;
  }

  // Skip non-navigation actions (like SET_PARAMS, OPEN_DRAWER, etc.)
  const actionType = event?.data?.action?.type;
  if (
    actionType &&
    ['SET_PARAMS', 'OPEN_DRAWER', 'CLOSE_DRAWER', 'TOGGLE_DRAWER'].includes(actionType)
  ) {
    Logger.debug(LuciqDebugTags.APM_SCREEN_LOADING, 'skipping non-navigation action', {
      actionType,
    });
    return;
  }

  // If there's an existing active span, it means navigation was interrupted
  // Discard the previous span as it never completed
  if (_activeNavigationSpanId) {
    Logger.debug(LuciqDebugTags.APM_SCREEN_LOADING, 'discarding incomplete previous span', {
      spanId: _activeNavigationSpanId,
    });
    // Mark the span as cancelled/error since state change never occurred
    const span = ScreenLoadingManager.getActiveSpan(_activeNavigationSpanId);
    if (span) {
      ScreenLoadingManager.endSpan(_activeNavigationSpanId);
    }
    _activeNavigationSpanId = null;
    _clearStateChangeTimeout();
  }

  // Create a new span for this navigation action
  // We don't know the destination screen yet, so use a placeholder name
  if (ScreenLoadingManager.isFeatureEnabled()) {
    const span = ScreenLoadingManager.createSpan('NavigationPending', false);
    if (span) {
      _activeNavigationSpanId = span.spanId;
      Logger.debug(LuciqDebugTags.APM_SCREEN_LOADING, 'span started on navigation dispatch', {
        spanId: span.spanId,
      });

      // Set a safety timeout to discard the span if state never changes
      // This prevents memory leaks from incomplete navigations
      _stateChangeTimeout = setTimeout(() => {
        if (_activeNavigationSpanId === span.spanId) {
          Logger.warn(LuciqDebugTags.APM_SCREEN_LOADING, 'navigation span timed out', {
            spanId: span.spanId,
            timeoutMs: STATE_CHANGE_TIMEOUT_MS,
          });
          ScreenLoadingManager.endSpan(span.spanId);
          _activeNavigationSpanId = null;
        }
      }, STATE_CHANGE_TIMEOUT_MS);
    }
  }
};

/**
 * Handles React Navigation's state event
 * This fires AFTER the navigation state has changed (the screen is mounted)
 */
const _onNavigationStateChange = (): void => {
  if (!_navigationRef?.current) {
    return;
  }

  const previousRouteName = _currentRoute;
  const currentRoute = _navigationRef.current.getCurrentRoute();
  const currentRouteName = currentRoute?.name || null;

  // If no route or same route, ignore
  if (!currentRouteName || previousRouteName === currentRouteName) {
    // Still need to clean up the span if one was created
    if (_activeNavigationSpanId) {
      Logger.debug(LuciqDebugTags.APM_SCREEN_LOADING, 'navigation resulted in same route', {
        spanId: _activeNavigationSpanId,
        currentRouteName,
      });
      ScreenLoadingManager.endSpan(_activeNavigationSpanId);
      _activeNavigationSpanId = null;
      _clearStateChangeTimeout();
    }
    return;
  }

  // Capture the span ID BEFORE clearing it so we can pass it to reportScreenChange
  let spanIdForReport: string | null = _activeNavigationSpanId;

  // Complete the active navigation span if one exists
  if (_activeNavigationSpanId) {
    // Now that we know the actual route name, check if it's excluded
    if (ScreenLoadingManager.isRouteExcluded(currentRouteName)) {
      Logger.debug(LuciqDebugTags.APM_SCREEN_LOADING, 'route excluded, discarding span', {
        spanId: _activeNavigationSpanId,
        currentRouteName,
      });
      ScreenLoadingManager.discardSpan(_activeNavigationSpanId);
      spanIdForReport = null;
      _activeNavigationSpanId = null;
      _clearStateChangeTimeout();
    } else {
      const span = ScreenLoadingManager.getActiveSpan(_activeNavigationSpanId);
      if (span) {
        // Update the span name from placeholder to actual screen name
        span.screenName = currentRouteName;

        // End the span - the native frame tracker will provide the actual render timestamp
        ScreenLoadingManager.endSpan(_activeNavigationSpanId)
          .then(() => {
            Logger.debug(LuciqDebugTags.APM_SCREEN_LOADING, 'span completed for navigation', {
              currentRouteName,
            });
          })
          .catch((error) => {
            Logger.warn(LuciqDebugTags.APM_SCREEN_LOADING, 'endSpan failed on navigation', {
              message: (error as Error)?.message,
              name: (error as Error)?.name,
            });
          });
      }

      // Clear the active span and timeout
      _activeNavigationSpanId = null;
      _clearStateChangeTimeout();
    }
  }

  // Update the current route for the rest of Luciq's tracking
  _currentRoute = currentRouteName;

  // Report to native
  NativeLuciq.reportScreenChange(currentRouteName, spanIdForReport);
};

export const onNavigationStateChange = (
  prevState: NavigationStateV4,
  currentState: NavigationStateV4,
  _action: NavigationAction,
) => {
  const currentScreen = LuciqUtils.getActiveRouteName(currentState);
  const prevScreen = LuciqUtils.getActiveRouteName(prevState);

  if (Logger.isDebugEnabled()) {
    Logger.debug(LuciqDebugTags.SCREEN_TRACKING, 'onNavigationStateChange (react-navigation v4)', {
      prevScreen,
      currentScreen,
      changed: prevScreen !== currentScreen,
    });
  }

  if (prevScreen !== currentScreen) {
    // Start Screen Loading measurement for v4
    let screenLoadingSpanId: string | null = null;
    if (ScreenLoadingManager.isFeatureEnabled()) {
      const span = ScreenLoadingManager.createSpan(currentScreen || 'Unknown', false);
      if (span) {
        screenLoadingSpanId = span.spanId;
      }
    }

    reportCurrentViewForAndroid(currentScreen);
    if (_currentScreen != null && _currentScreen !== firstScreen) {
      NativeLuciq.reportScreenChange(_currentScreen, screenLoadingSpanId);
      _currentScreen = null;
    }
    _currentScreen = currentScreen;
    setTimeout(() => {
      if (currentScreen && _currentScreen === currentScreen) {
        NativeLuciq.reportScreenChange(currentScreen, screenLoadingSpanId);
        _currentScreen = null;
      }

      // End Screen Loading measurement for v4
      if (screenLoadingSpanId) {
        ScreenLoadingManager.endSpan(screenLoadingSpanId).catch((error) => {
          Logger.warn(LuciqDebugTags.APM_SCREEN_LOADING, 'endSpan failed (v4)', {
            spanId: screenLoadingSpanId,
            message: (error as Error)?.message,
            name: (error as Error)?.name,
          });
        });
      }
    }, 1000);
  }
};

export const onStateChange = (state?: NavigationStateV5) => {
  if (Logger.isDebugEnabled()) {
    Logger.debug(LuciqDebugTags.SCREEN_TRACKING, 'onStateChange (react-navigation v5/v6)', {
      hasState: !!state,
      hasNavigationRef: !!_navigationRef?.current,
    });
  }
  if (!state) {
    return;
  }

  // Delegate to the new state change handler for Screen Loading
  // This handles reportScreenChange when setNavigationListener was called
  _onNavigationStateChange();

  // When setNavigationListener is used, _onNavigationStateChange already handles
  // reportScreenChange properly - skip legacy logic to avoid duplicate calls
  if (_navigationRef?.current) {
    return;
  }

  // Fallback: Legacy screen tracking for users who only use onStateChange without setNavigationListener
  const currentScreen = LuciqUtils.getFullRoute(state);
  reportCurrentViewForAndroid(currentScreen);
  if (_currentScreen !== null && _currentScreen !== firstScreen) {
    NativeLuciq.reportScreenChange(_currentScreen, null);
    _currentScreen = null;
  }

  _currentScreen = currentScreen;
  setTimeout(() => {
    if (_currentScreen === currentScreen) {
      NativeLuciq.reportScreenChange(currentScreen, null);
      _currentScreen = null;
    }
  }, 1000);
};

/**
 * Sets a listener for screen change
 *  @param navigationRef a refrence of a navigation container
 *
 */
export const setNavigationListener = (
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>,
) => {
  // Store the navigationRef for Screen Loading tracking
  _navigationRef = navigationRef;

  if (Logger.isDebugEnabled()) {
    Logger.debug(LuciqDebugTags.SCREEN_TRACKING, 'setNavigationListener called', {
      hasNavigationRef: !!navigationRef,
      refIsReady: !!navigationRef?.current,
    });
  }

  if (!navigationRef?.current) {
    Logger.warn(
      LuciqDebugTags.SCREEN_TRACKING,
      'setNavigationListener: navigation ref not available, cannot set listeners',
    );
    return;
  }

  // Register the __unsafe_action__ listener for span creation
  // This listener fires on navigation dispatch (start of navigation)
  navigationRef.current.addListener('__unsafe_action__', _onNavigationAction);

  // NOTE: We do NOT register a 'state' listener here because the user is expected
  // to pass Luciq.onStateChange to NavigationContainer's onStateChange prop.
  // Registering both would cause duplicate reportScreenChange calls.

  Logger.debug(
    LuciqDebugTags.SCREEN_TRACKING,
    'screen loading listener registered (__unsafe_action__)',
  );

  // return stateListener;
};

export const reportScreenChange = (screenName: string) => {
  if (Logger.isDebugEnabled()) {
    Logger.debug(LuciqDebugTags.SCREEN_TRACKING, 'reportScreenChange', {
      screenNameLength: screenName?.length ?? 0,
    });
  }
  NativeLuciq.reportScreenChange(screenName, null);
};

/**
 * Add feature flags to the next report.
 * @param featureFlags An array of feature flags to add to the next report.
 */
export const addFeatureFlags = (featureFlags: FeatureFlag[]) => {
  const entries = featureFlags.map((item) => [item.name, item.variant || '']);
  const flags = Object.fromEntries(entries);
  NativeLuciq.addFeatureFlags(flags);
};

/**
 * Add a feature flag to the to next report.
 */
export const addFeatureFlag = (featureFlag: FeatureFlag) => {
  addFeatureFlags([featureFlag]);
};

/**
 * Remove feature flags from the next report.
 * @param featureFlags An array of  feature flags to remove from the next report.
 */
export const removeFeatureFlags = (featureFlags: string[]) => {
  NativeLuciq.removeFeatureFlags(featureFlags);
};

/**
 * Remove a feature flag from the next report.
 * @param name the name of the feature flag to remove from the next report.
 */
export const removeFeatureFlag = (name: string) => {
  removeFeatureFlags([name]);
};

/**
 * Clear all feature flags
 */
export const removeAllFeatureFlags = () => {
  NativeLuciq.removeAllFeatureFlags();
};

/**
 * This API has to be call when using custom app rating prompt
 */
export const willRedirectToStore = () => {
  NativeLuciq.willRedirectToStore();
};

/**
 * This API has be called when changing the default Metro server port (8081) to exclude the DEV URL from network logging.
 */
export const setMetroDevServerPort = (port: number) => {
  LuciqRNConfig.metroDevServerPort = port.toString();
};

export const componentDidAppearListener = (event: ComponentDidAppearEvent) => {
  if (Logger.isDebugEnabled()) {
    Logger.debug(LuciqDebugTags.SCREEN_TRACKING, 'componentDidAppear (RNN)', {
      componentNameLength: event.componentName?.length ?? 0,
      isFirstScreen: _isFirstScreen,
      hasLastScreen: !!_lastScreen,
    });
  }
  if (_isFirstScreen) {
    _lastScreen = event.componentName;
    _isFirstScreen = false;
    return;
  }
  if (_lastScreen !== event.componentName) {
    NativeLuciq.reportScreenChange(event.componentName, null);
    _lastScreen = event.componentName;
  }
};

/**
 * Sets listener to feature flag changes
 * @param handler A callback that gets the update value of the flag
 */
export const _registerFeatureFlagsChangeListener = (
  handler: (payload: {
    isW3ExternalTraceIDEnabled: boolean;
    isW3ExternalGeneratedHeaderEnabled: boolean;
    isW3CaughtHeaderEnabled: boolean;
    networkBodyLimit: number;
  }) => void,
) => {
  emitter.addListener(NativeEvents.ON_FEATURE_FLAGS_CHANGE, (payload) => {
    handler(payload);
  });
  NativeLuciq.registerFeatureFlagsChangeListener();
};

/**
 * Sets the auto mask screenshots types.
 * @param autoMaskingTypes The masking type to be applied.
 */
export const enableAutoMasking = (autoMaskingTypes: AutoMaskingType[]) => {
  NativeLuciq.enableAutoMasking(autoMaskingTypes);
};

/**
 * Sets a custom theme for Luciq UI elements.
 *
 * This method provides comprehensive theming support. It will automatically use LCQTheme
 * if available in the SDK version, otherwise falls back to individual theming methods.
 *
 * @param theme - Configuration object containing theme properties
 *
 * @example
 * ```typescript
 * // Basic usage with primary color (always supported)
 * Luciq.setTheme({
 *   primaryColor: '#FF6B6B'
 * });
 *
 * // Comprehensive theming (uses LCQTheme when available)
 * Luciq.setTheme({
 *   primaryColor: '#FF6B6B',
 *   secondaryTextColor: '#666666',
 *   primaryTextColor: '#333333',
 *   titleTextColor: '#000000',
 *   backgroundColor: '#FFFFFF',
 *   primaryTextStyle: 'bold',
 *   secondaryTextStyle: 'normal',
 *   titleTextStyle: 'bold',
 *   ctaTextStyle: 'bold',
 *   primaryFontPath: '/data/user/0/ai.yourapp/files/fonts/YourFont.ttf',
 *   secondaryFontPath: '/data/user/0/ai.yourapp/files/fonts/YourFont.ttf',
 *   ctaTextType: '/data/user/0/ai.yourapp/files/fonts/YourFont.ttf',
 *   primaryFontAsset: 'fonts/YourFont.ttf',
 *   secondaryFontAsset: 'fonts/YourFont.ttf'
 * });
 * ```
 */
export const setTheme = (theme: ThemeConfig) => {
  NativeLuciq.setTheme(theme);
};
/**
 * Enables or disables displaying in full-screen mode, hiding the status and navigation bars.
 * @param isEnabled A boolean to enable/disable setFullscreen.
 */
export const setFullscreen = (isEnabled: boolean) => {
  if (Platform.OS === 'android') {
    NativeLuciq.setFullscreen(isEnabled);
  }
};
