import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setEnabled(isEnabled: boolean): void;
  show(): void;
  setEmailFieldRequiredForFeatureRequests(
    isEmailFieldRequired: boolean,
    types: Array<string>,
  ): void;
}

export default TurboModuleRegistry.get<Spec>('LCQFeatureRequests');
