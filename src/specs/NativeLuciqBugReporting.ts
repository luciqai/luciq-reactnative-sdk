import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setEnabled(isEnabled: boolean): void;
  show(type: string, options: Array<string>): void;

  setInvocationEvents(events: Array<string>): void;
  setOptions(options: Array<string>): void;
  setExtendedBugReportMode(mode: string): void;
  setReportTypes(types: Array<string>): void;
  setDisclaimerText(text: string): void;
  setCommentMinimumCharacterCount(limit: number, reportTypes: Array<string>): void;
  setFloatingButtonEdge(edge: string, offset: number): void;
  setVideoRecordingFloatingButtonPosition(buttonPosition: string): void;
  setEnabledAttachmentTypes(
    screenshot: boolean,
    extraScreenshot: boolean,
    galleryImage: boolean,
    screenRecording: boolean,
  ): void;

  setAutoScreenRecordingEnabled(isEnabled: boolean): void;
  setAutoScreenRecordingDuration(maxDuration: number): void;
  setViewHierarchyEnabled(isEnabled: boolean): void;

  setShakingThresholdForiPhone(threshold: number): void;
  setShakingThresholdForiPad(threshold: number): void;
  setShakingThresholdForAndroid(threshold: number): void;

  setOnInvokeHandler(): void;
  setDidSelectPromptOptionHandler(): void;
  setOnSDKDismissedHandler(): void;

  addUserConsent(
    key: string,
    description: string,
    mandatory: boolean,
    checked: boolean,
    actionType: string | null,
  ): void;

  setProactiveReportingConfigurations(
    enabled: boolean,
    gapBetweenModals: number,
    modalDelayAfterDetection: number,
  ): void;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('LCQBugReporting');
