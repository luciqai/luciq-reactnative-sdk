import { Platform } from 'react-native';

import { NativeEvents, NativeSurveys, emitter } from '../native/NativeSurveys';
import type { Survey } from '../native/NativeSurveys';

export type { Survey };

/**
 * Sets whether surveys are enabled or not.
 * If you disable surveys on the SDK but still have active surveys on your Luciq dashboard,
 * those surveys are still going to be sent to the device, but are not going to be
 * shown automatically.
 * To manually display any available surveys, call `Luciq.showSurveyIfAvailable()`.
 * Defaults to `true`.
 * @param isEnabled A boolean to set whether Luciq Surveys is enabled or disabled.
 */
export const setEnabled = (isEnabled: boolean) => {
  console.log('[LCQ-RN] Surveys.setEnabled called', { isEnabled });
  NativeSurveys.setEnabled(isEnabled);
};

/**
 * Shows one of the surveys that were not shown before, that also have conditions
 * that match the current device/user.
 * Does nothing if there are no available surveys or if a survey has already been shown
 * in the current session.
 */
export const showSurveyIfAvailable = () => {
  console.log('[LCQ-RN] Surveys.showSurveyIfAvailable called');
  NativeSurveys.showSurveysIfAvailable();
};

/**
 * Returns an array containing the available surveys.
 */
export const getAvailableSurveys = async (): Promise<Survey[] | null> => {
  console.log('[LCQ-RN] Surveys.getAvailableSurveys called');
  const surveys = await NativeSurveys.getAvailableSurveys();

  return surveys;
};

/**
 * Sets whether auto surveys showing are enabled or not.
 * @param autoShowingSurveysEnabled A boolean to indicate whether the
 *                                surveys auto showing are enabled or not.
 */
export const setAutoShowingEnabled = (autoShowingSurveysEnabled: boolean) => {
  console.log('[LCQ-RN] Surveys.setAutoShowingEnabled called', { autoShowingSurveysEnabled });
  NativeSurveys.setAutoShowingEnabled(autoShowingSurveysEnabled);
};

/**
 * Sets a block of code to be executed just before the survey's UI is presented.
 * This block is executed on the UI thread. Could be used for performing any UI changes before
 * the survey's UI is shown.
 * @param onShowHandler - A block of code that gets executed before
 * presenting the survey's UI.
 */
export const setOnShowHandler = (onShowHandler: () => void) => {
  console.log('[LCQ-RN] Surveys.setOnShowHandler called');
  emitter.addListener(NativeEvents.WILL_SHOW_SURVEY_HANDLER, onShowHandler);
  NativeSurveys.setOnShowHandler(onShowHandler);
};

/**
 * Sets a block of code to be executed right after the survey's UI is dismissed.
 * This block is executed on the UI thread. Could be used for performing any UI
 * changes after the survey's UI is dismissed.
 * @param onDismissHandler - A block of code that gets executed after
 * the survey's UI is dismissed.
 */
export const setOnDismissHandler = (onDismissHandler: () => void) => {
  console.log('[LCQ-RN] Surveys.setOnDismissHandler called');
  emitter.addListener(NativeEvents.DID_DISMISS_SURVEY_HANDLER, onDismissHandler);
  NativeSurveys.setOnDismissHandler(onDismissHandler);
};

/**
 * Shows survey with a specific token.
 * Does nothing if there are no available surveys with that specific token.
 * Answered and cancelled surveys won't show up again.
 * @param surveyToken - A String with a survey token.
 *
 */
export const showSurvey = (surveyToken: string) => {
  console.log('[LCQ-RN] Surveys.showSurvey called', { surveyToken });
  NativeSurveys.showSurvey(surveyToken);
};

/**
 * Returns true if the survey with a specific token was answered before.
 * Will return false if the token does not exist or if the survey was not answered before.
 * @param surveyToken - A String with a survey token.
 * the survey has been responded to or not.
 *
 */
export const hasRespondedToSurvey = async (surveyToken: string): Promise<boolean | null> => {
  console.log('[LCQ-RN] Surveys.hasRespondedToSurvey called', { surveyToken });
  const hasResponded = await NativeSurveys.hasRespondedToSurvey(surveyToken);

  return hasResponded;
};

/**
 * Setting an option for all the surveys to show a welcome screen before
 * the user starts taking the survey.
 * @param shouldShowWelcomeScreen A boolean for setting whether the
 *                                welcome screen should show.
 */
export const setShouldShowWelcomeScreen = (shouldShowWelcomeScreen: boolean) => {
  console.log('[LCQ-RN] Surveys.setShouldShowWelcomeScreen called', { shouldShowWelcomeScreen });
  NativeSurveys.setShouldShowWelcomeScreen(shouldShowWelcomeScreen);
};

/**
 * iOS Only
 * Sets url for the published iOS app on AppStore, You can redirect
 * NPS Surveys or AppRating Surveys to AppStore to let users rate your app on AppStore itself.
 * @param appStoreURL A String url for the published iOS app on AppStore
 */

export const setAppStoreURL = (appStoreURL: string) => {
  console.log('[LCQ-RN] Surveys.setAppStoreURL called', { appStoreURL });
  if (Platform.OS === 'ios') {
    NativeSurveys.setAppStoreURL(appStoreURL);
  }
};
