import type { TurboModule } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setEnabled(isEnabled: boolean): void;

  networkLogAndroid(
    requestStartTime: number,
    requestDuration: number,
    requestHeaders: string,
    requestBody: string,
    requestBodySize: number,
    requestMethod: string,
    requestUrl: string,
    requestContentType: string,
    responseHeaders: string,
    responseBody: string | null,
    responseBodySize: number,
    statusCode: number,
    responseContentType: string,
    errorDomain: string,
    w3cExternalTraceAttributes: UnsafeObject,
    gqlQueryName: string | null,
    serverErrorMessage: string | null,
  ): void;

  setAppLaunchEnabled(isEnabled: boolean): void;
  endAppLaunch(): void;

  startFlow(name: string): void;
  endFlow(name: string): void;
  setFlowAttribute(name: string, key: string, value: string | null): void;

  setAutoUITraceEnabled(isEnabled: boolean): void;
  startUITrace(name: string): void;
  endUITrace(): void;
  lcqSleep(): void;

  setScreenRenderingEnabled(isEnabled: boolean): void;

  syncCustomSpan(name: string, startTimestamp: number, endTimestamp: number): Promise<void>;
  isCustomSpanEnabled(): Promise<boolean>;
  isAPMEnabled(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('LCQAPM');
