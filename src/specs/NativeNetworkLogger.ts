import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  isNativeInterceptionEnabled(): boolean;

  registerNetworkLogsListener(type: string | null): void;

  updateNetworkLogSnapshot(
    url: string,
    callbackID: string,
    requestBody: string | null,
    responseBody: string | null,
    responseCode: number,
    requestHeaders: UnsafeObject,
    responseHeaders: UnsafeObject,
  ): void;

  hasAPMNetworkPlugin(): Promise<boolean>;

  resetNetworkLogsListener(): void;

  setNetworkLoggingRequestFilterPredicateIOS(id: string, value: boolean): void;

  forceStartNetworkLoggingIOS(): void;

  forceStopNetworkLoggingIOS(): void;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('LCQNetworkLogger');
