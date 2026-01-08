import { NativeFeatureRequests } from '../native/NativeFeatureRequests';
import type { ActionType } from '../utils/Enums';

/**
 * Enables and disables everything related to feature requests.
 *
 * @param isEnabled
 */
export const setEnabled = (isEnabled: boolean) => {
  console.log('[LCQ-RN] FeatureRequests.setEnabled called', { isEnabled });
  NativeFeatureRequests.setEnabled(isEnabled);
};

/**
 * Sets whether users are required to enter an email address or not when
 * sending reports.
 * Defaults to YES.
 *
 * @param isEmailFieldRequired A boolean to indicate whether email field is required or not.
 * @param types An enum that indicates which action types will have the isEmailFieldRequired
 */
export const setEmailFieldRequired = (isEmailFieldRequired: boolean, type: ActionType) => {
  console.log('[LCQ-RN] FeatureRequests.setEmailFieldRequired called', { isEmailFieldRequired, type });
  NativeFeatureRequests.setEmailFieldRequiredForFeatureRequests(isEmailFieldRequired, [
    type,
  ] as ActionType[]);
};

/**
 * Shows the UI for feature requests list
 */
export const show = () => {
  console.log('[LCQ-RN] FeatureRequests.show called');
  NativeFeatureRequests.show();
};
