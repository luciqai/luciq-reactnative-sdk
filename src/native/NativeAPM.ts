import type { NativeModule } from 'react-native';
import { NativeEventEmitter, NativeModules as ReactNativeModules } from 'react-native';

import type { W3cExternalTraceAttributes } from '../models/W3cExternalTraceAttributes';
import ApmTurboSpec from '../specs/NativeAPM';

export interface ApmNativeModule extends NativeModule {
  // Essential APIs //
  setEnabled(isEnabled: boolean): void;

  // Network APIs //
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
    w3cExternalTraceAttributes: W3cExternalTraceAttributes,
    gqlQueryName?: string,
    serverErrorMessage?: string,
  ): void;

  // App Launches APIs //
  setAppLaunchEnabled(isEnabled: boolean): void;
  endAppLaunch(): void;

  // Execution Traces APIs //
  // App Flows APIs //
  startFlow(name: string): void;
  endFlow(name: string): void;
  setFlowAttribute(name: string, key: string, value?: string | null): void;

  // UI Traces APIs //
  setAutoUITraceEnabled(isEnabled: boolean): void;
  startUITrace(name: string): void;
  endUITrace(): void;
  lcqSleep(): void;

  // Screen Rendering //
  setScreenRenderingEnabled(isEnabled: boolean): void;

  // Custom Spans APIs //
  syncCustomSpan(name: string, startTimestamp: number, endTimestamp: number): Promise<void>;

  isCustomSpanEnabled(): Promise<boolean>;

  isAPMEnabled(): Promise<boolean>;
}

export const NativeAPM = (ApmTurboSpec ??
  ReactNativeModules.LCQAPM) as unknown as ApmNativeModule;

export const emitter = new NativeEventEmitter(NativeAPM);
