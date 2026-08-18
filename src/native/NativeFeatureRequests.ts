import type { NativeModule } from 'react-native';
import { NativeModules as ReactNativeModules } from 'react-native';

import type { ActionType } from '../utils/Enums';
import FeatureRequestsTurboSpec from '../specs/NativeFeatureRequests';

export interface FeatureRequestsNativeModule extends NativeModule {
  setEnabled(isEnabled: boolean): void;
  show(): void;
  setEmailFieldRequiredForFeatureRequests(isEmailFieldRequired: boolean, types: ActionType[]): void;
}

export const NativeFeatureRequests = (FeatureRequestsTurboSpec ??
  ReactNativeModules.LCQFeatureRequests) as unknown as FeatureRequestsNativeModule;
