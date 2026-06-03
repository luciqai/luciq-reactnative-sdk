import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  setEnabled(isEnabled: boolean): void;
  sendJSCrash(data: UnsafeObject): Promise<void>;
  sendHandledJSCrash(
    data: UnsafeObject,
    userAttributes: UnsafeObject | null,
    fingerprint: string | null,
    nonFatalExceptionLevel: string | null,
  ): Promise<void>;
  setNDKCrashesEnabled(isEnabled: boolean): Promise<void>;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('LCQCrashReporting');
