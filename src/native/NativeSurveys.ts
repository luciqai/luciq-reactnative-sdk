import {
  NativeEventEmitter,
  NativeModule,
  NativeModules as ReactNativeModules,
} from 'react-native';

import SurveysTurboSpec from '../specs/NativeSurveys';

export interface Survey {
  title: string;
}

export interface SurveysNativeModule extends NativeModule {
  // Essential APIs //
  setEnabled(isEnabled: boolean): void;
  setAutoShowingEnabled(autoShowingSurveysEnabled: boolean): void;
  showSurvey(surveyToken: string): void;
  showSurveysIfAvailable(): void;
  getAvailableSurveys(): Promise<Survey[]>;
  hasRespondedToSurvey(surveyToken: string): Promise<boolean>;

  // Misc APIs //
  setShouldShowWelcomeScreen(shouldShowWelcomeScreen: boolean): void;
  setAppStoreURL(appStoreURL: string): void;

  // Callbacks //
  setOnShowHandler(): void;
  setOnDismissHandler(): void;
}

export const NativeSurveys = (SurveysTurboSpec ??
  ReactNativeModules.LCQSurveys) as unknown as SurveysNativeModule;

export enum NativeEvents {
  WILL_SHOW_SURVEY_HANDLER = 'LCQWillShowSurvey',
  DID_DISMISS_SURVEY_HANDLER = 'LCQDidDismissSurvey',
}

export const emitter = new NativeEventEmitter(NativeSurveys);
