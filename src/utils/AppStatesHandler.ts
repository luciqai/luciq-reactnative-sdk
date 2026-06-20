import { AppState, type AppStateStatus } from 'react-native';

import { Logger } from './logger';
import { LuciqDebugTags } from '../constants/DebugTags';

const TAG = LuciqDebugTags.APP_STATE;

let subscription: any = null;

// Register the event listener manually
export const addAppStateListener = (handleAppStateChange: (state: AppStateStatus) => void) => {
  Logger.debug(TAG, 'addAppStateListener called', { alreadyRegistered: !!subscription });
  if (!subscription) {
    subscription = AppState.addEventListener('change', (state) => {
      Logger.debug(TAG, 'app state changed', { state });
      handleAppStateChange(state);
    });
  }
};

// Unregister the event listener manually
//todo: find where to Unregister appState listener
export const removeAppStateListener = () => {
  Logger.debug(TAG, 'removeAppStateListener called', { wasRegistered: !!subscription });
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
};
