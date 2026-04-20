import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  getAllConstants(): UnsafeObject;

  // Essential APIs //
  setEnabled(isEnabled: boolean): void;
  isBuilt(): Promise<boolean>;
  init(
    token: string,
    invocationEvents: Array<string>,
    debugLogsLevel: string,
    useNativeNetworkInterception: boolean,
    codePushVersion: string | null,
    appVariant: string | null,
    options: UnsafeObject | null,
    overAirVersion: UnsafeObject | null,
  ): void;
  show(): void;

  // Misc APIs //
  setCodePushVersion(version: string): void;
  setOverAirVersion(OTAserviceVersion: UnsafeObject): void;
  setAppVariant(appVariant: string): void;
  setLCQLogPrintsToConsole(printsToConsole: boolean): void;
  setSessionProfilerEnabled(isEnabled: boolean): void;

  // Customization APIs //
  setLocale(sdkLocale: string): void;
  setColorTheme(sdkTheme: string): void;
  setPrimaryColor(color: number | null): void;
  setString(string: string, key: string): void;

  // Network APIs //
  networkLogAndroid(
    url: string,
    requestBody: string,
    responseBody: string | null,
    method: string,
    responseCode: number,
    requestHeaders: string,
    responseHeaders: string,
    duration: number,
  ): void;

  networkLogIOS(
    url: string,
    method: string,
    requestBody: string | null,
    requestBodySize: number,
    responseBody: string | null,
    responseBodySize: number,
    responseCode: number,
    requestHeaders: UnsafeObject,
    responseHeaders: UnsafeObject,
    contentType: string,
    errorDomain: string,
    errorCode: number,
    startTime: number,
    duration: number,
    gqlQueryName: string | null,
    serverErrorMessage: string | null,
    w3cExternalTraceAttributes: UnsafeObject,
  ): void;

  setNetworkLoggingEnabled(isEnabled: boolean): void;
  setNetworkLogBodyEnabled(isEnabled: boolean): void;

  // Repro Steps APIs //
  setReproStepsConfig(
    bugMode: string,
    crashMode: string,
    sessionReplay: string,
  ): void;
  setTrackUserSteps(isEnabled: boolean): void;
  reportScreenChange(firstScreen: string): void;
  reportCurrentViewChange(screenName: string): void;
  addPrivateView(nativeTag: number | null): void;
  removePrivateView(nativeTag: number | null): void;

  // Logging APIs //
  logVerbose(message: string): void;
  logInfo(message: string): void;
  logDebug(message: string): void;
  logError(message: string): void;
  logWarn(message: string): void;
  clearLogs(): void;

  // User APIs //
  identifyUser(email: string, name: string, id: string | null): void;
  logOut(): void;
  logUserEvent(name: string): void;
  setUserData(data: string): void;

  // User Attributes APIs //
  setUserAttribute(key: string, value: string): void;
  getUserAttribute(key: string): Promise<string>;
  removeUserAttribute(key: string): void;
  getAllUserAttributes(): Promise<UnsafeObject>;
  clearAllUserAttributes(): void;

  // Welcome Message APIs //
  showWelcomeMessageWithMode(mode: string): void;
  setWelcomeMessageMode(mode: string): void;

  // Tags APIs //
  appendTags(tags: Array<string>): void;
  resetTags(): void;
  getTags(): Promise<Array<string>>;

  // Experiments APIs //
  addFeatureFlags(featureFlags: UnsafeObject): void;
  removeFeatureFlags(featureFlags: Array<string>): void;
  removeAllFeatureFlags(): void;

  // Files APIs //
  setFileAttachment(filePath: string, fileName: string | null): void;

  // Report APIs //
  setPreSendingHandler(): void;
  appendTagToReport(tag: string): void;
  appendConsoleLogToReport(consoleLog: string): void;
  setUserAttributeToReport(key: string, value: string): void;
  logDebugToReport(log: string): void;
  logVerboseToReport(log: string): void;
  logWarnToReport(log: string): void;
  logErrorToReport(log: string): void;
  logInfoToReport(log: string): void;
  addFileAttachmentWithURLToReport(url: string, filename: string | null): void;
  addFileAttachmentWithDataToReport(data: string, filename: string | null): void;
  willRedirectToStore(): void;

  // W3C Feature Flags
  isW3ExternalTraceIDEnabled(): Promise<boolean>;
  isW3ExternalGeneratedHeaderEnabled(): Promise<boolean>;
  isW3CaughtHeaderEnabled(): Promise<boolean>;

  // Feature Flags Listener for Android
  registerFeatureFlagsChangeListener(): void;
  setOnFeaturesUpdatedListener(): void;
  enableAutoMasking(autoMaskingTypes: Array<string>): void;
  getNetworkBodyMaxSize(): Promise<number>;

  setTheme(theme: UnsafeObject): void;
  setFullscreen(isEnabled: boolean): void;

  // WebView APIs //
  setWebViewMonitoringEnabled(isEnabled: boolean): void;
  setWebViewNetworkTrackingEnabled(isEnabled: boolean): void;
  setWebViewUserInteractionsTrackingEnabled(isEnabled: boolean): void;

  // Event emitter plumbing
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('Luciq');
