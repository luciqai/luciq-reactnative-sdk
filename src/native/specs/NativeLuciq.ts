import type { TurboModule } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getAllConstants(): UnsafeObject;
  setEnabled(isEnabled: boolean): void;
  isBuilt(): Promise<boolean>;
  init(
    token: string,
    invocationEvents: string[],
    debugLogsLevel: string,
    useNativeNetworkInterception: boolean,
    codePushVersion: string | null,
    appVariant: string | null,
    options: UnsafeObject | null,
    overAirVersion: UnsafeObject | null,
  ): void;
  show(): void;

  setCodePushVersion(version: string): void;
  setOverAirVersion(OTAserviceVersion: UnsafeObject): void;
  setAppVariant(appVariant: string): void;
  setLCQLogPrintsToConsole(printsToConsole: boolean): void;
  setSessionProfilerEnabled(isEnabled: boolean): void;

  setLocale(sdkLocale: string): void;
  setColorTheme(sdkTheme: string): void;
  setPrimaryColor(color: number | null): void;
  setString(string: string, key: string): void;

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

  logVerbose(message: string): void;
  logInfo(message: string): void;
  logDebug(message: string): void;
  logError(message: string): void;
  logWarn(message: string): void;
  clearLogs(): void;

  identifyUser(email: string, name: string, id: string | null): void;
  logOut(): void;
  logUserEvent(name: string): void;
  setUserData(data: string): void;

  setUserAttribute(key: string, value: string): void;
  getUserAttribute(key: string): Promise<string>;
  removeUserAttribute(key: string): void;
  getAllUserAttributes(): Promise<UnsafeObject>;
  clearAllUserAttributes(): void;

  showWelcomeMessageWithMode(mode: string): void;
  setWelcomeMessageMode(mode: string): void;

  appendTags(tags: string[]): void;
  resetTags(): void;
  getTags(): Promise<string[]>;

  addFeatureFlags(featureFlags: UnsafeObject): void;
  removeFeatureFlags(featureFlags: string[]): void;
  removeAllFeatureFlags(): void;

  setFileAttachment(filePath: string, fileName: string | null): void;

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

  isW3ExternalTraceIDEnabled(): Promise<boolean>;
  isW3ExternalGeneratedHeaderEnabled(): Promise<boolean>;
  isW3CaughtHeaderEnabled(): Promise<boolean>;

  registerFeatureFlagsChangeListener(): void;
  setOnFeaturesUpdatedListener(): void;
  enableAutoMasking(autoMaskingTypes: string[]): void;
  getNetworkBodyMaxSize(): Promise<number>;

  setTheme(theme: UnsafeObject): void;
  setFullscreen(isEnabled: boolean): void;

  setWebViewMonitoringEnabled(isEnabled: boolean): void;
  setWebViewNetworkTrackingEnabled(isEnabled: boolean): void;
  setWebViewUserInteractionsTrackingEnabled(isEnabled: boolean): void;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Luciq');
