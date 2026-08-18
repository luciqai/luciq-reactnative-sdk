import type { SurveysNativeModule } from '../../src/native/NativeSurveys';

const mockSurveys: SurveysNativeModule = {
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  setEnabled: jest.fn(),
  setAppStoreURL: jest.fn(),
  showSurveysIfAvailable: jest.fn(),
  getAvailableSurveys: jest.fn(),
  setAutoShowingEnabled: jest.fn(),
  setOnShowHandler: jest.fn(),
  unsetOnShowHandler: jest.fn(),
  setOnDismissHandler: jest.fn(),
  unsetOnDismissHandler: jest.fn(),
  showSurvey: jest.fn(),
  hasRespondedToSurvey: jest.fn(),
  setShouldShowWelcomeScreen: jest.fn(),
};

export default mockSurveys;
