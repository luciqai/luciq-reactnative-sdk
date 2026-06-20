import { NativeFeatureRequests } from '../native/NativeFeatureRequests';
import type { ActionType } from '../utils/Enums';
import { Logger } from '../utils/logger';
import { LuciqDebugTags } from '../constants/DebugTags';

const TAG = LuciqDebugTags.FEATURE_REQUESTS;

/**
 * Enables and disables everything related to feature requests.
 *
 * @param isEnabled
 */
export const setEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setEnabled', { isEnabled });
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
  Logger.debug(TAG, 'setEmailFieldRequired', { isEmailFieldRequired, type });
  NativeFeatureRequests.setEmailFieldRequiredForFeatureRequests(isEmailFieldRequired, [
    type,
  ] as ActionType[]);
};

/**
 * Shows the UI for feature requests list
 */
export const show = () => {
  Logger.debug(TAG, 'show called');
  NativeFeatureRequests.show();
};
