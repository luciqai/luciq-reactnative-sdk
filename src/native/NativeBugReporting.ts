import {
  NativeEventEmitter,
  NativeModule,
  NativeModules as ReactNativeModules,
} from 'react-native';

import type {
  ExtendedBugReportMode,
  FloatingButtonPosition,
  InvocationEvent,
  InvocationOption,
  RecordingButtonPosition,
  ReportType,
  userConsentActionType,
} from '../utils/Enums';
import BugReportingTurboSpec from '../specs/NativeBugReporting';

export interface BugReportingNativeModule extends NativeModule {
  // Essential APIs //
  setEnabled(isEnabled: boolean): void;
  show(type: ReportType, options: InvocationOption[]): void;

  // Customization APIs //
  setInvocationEvents(events: InvocationEvent[]): void;
  setOptions(options: InvocationOption[]): void;
  setExtendedBugReportMode(mode: ExtendedBugReportMode): void;
  setReportTypes(types: ReportType[]): void;
  setDisclaimerText(text: string): void;
  setCommentMinimumCharacterCount(limit: number, reportTypes: ReportType[]): void;
  setFloatingButtonEdge(edge: FloatingButtonPosition, offset: number): void;
  setVideoRecordingFloatingButtonPosition(buttonPosition: RecordingButtonPosition): void;
  setEnabledAttachmentTypes(
    screenshot: boolean,
    extraScreenshot: boolean,
    galleryImage: boolean,
    screenRecording: boolean,
  ): void;

  // Screen Recording APIs //
  setAutoScreenRecordingEnabled(isEnabled: boolean): void;
  setAutoScreenRecordingDuration(maxDuration: number): void;
  setViewHierarchyEnabled(isEnabled: boolean): void;

  // Shaking Threshold APIs //
  setShakingThresholdForiPhone(threshold: number): void;
  setShakingThresholdForiPad(threshold: number): void;
  setShakingThresholdForAndroid(threshold: number): void;

  // Callbacks //
  setOnInvokeHandler(): void;
  setDidSelectPromptOptionHandler(): void;
  setOnSDKDismissedHandler(): void;

  addUserConsent(
    key: string,
    description: string,
    mandatory: boolean,
    checked: boolean,
    actionType?: userConsentActionType,
  ): void;

  setProactiveReportingConfigurations(
    enabled: boolean,
    gapBetweenModals: number,
    modalDelayAfterDetection: number,
  ): void;
}

export const NativeBugReporting = (BugReportingTurboSpec ??
  ReactNativeModules.LCQBugReporting) as unknown as BugReportingNativeModule;

export enum NativeEvents {
  ON_INVOKE_HANDLER = 'LCQpreInvocationHandler',
  ON_DISMISS_HANDLER = 'LCQpostInvocationHandler',
  DID_SELECT_PROMPT_OPTION_HANDLER = 'LCQDidSelectPromptOptionHandler',
}

export const emitter = new NativeEventEmitter(NativeBugReporting);
