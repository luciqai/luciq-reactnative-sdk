import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setEnabled(isEnabled: boolean): void;
  setAutoShowingEnabled(autoShowingSurveysEnabled: boolean): void;
  showSurvey(surveyToken: string): void;
  showSurveysIfAvailable(): void;
  getAvailableSurveys(): Promise<Object>;
  hasRespondedToSurvey(surveyToken: string): Promise<boolean>;

  setShouldShowWelcomeScreen(shouldShowWelcomeScreen: boolean): void;
  setAppStoreURL(appStoreURL: string): void;

  setOnShowHandler(): void;
  setOnDismissHandler(): void;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('LCQSurveys');
