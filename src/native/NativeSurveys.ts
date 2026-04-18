import { NativeEventEmitter, NativeModule } from 'react-native';

import { NativeModules } from './NativePackage';

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

export const NativeSurveys = NativeModules.LCQSurveys;

export enum NativeEvents {
  WILL_SHOW_SURVEY_HANDLER = 'LCQWillShowSurvey',
  DID_DISMISS_SURVEY_HANDLER = 'LCQDidDismissSurvey',
}

export const emitter = new NativeEventEmitter(NativeSurveys);
