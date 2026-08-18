import { NativeEventEmitter, NativeModules as ReactNativeModules } from 'react-native';
import type { NativeModule } from 'react-native';

import SessionReplayTurboSpec from '../specs/NativeSessionReplay';

export interface SessionReplayNativeModule extends NativeModule {
  setEnabled(isEnabled: boolean): void;
  setNetworkLogsEnabled(isEnabled: boolean): void;
  setLuciqLogsEnabled(isEnabled: boolean): void;
  setUserStepsEnabled(isEnabled: boolean): void;
  getSessionReplayLink(): Promise<string>;
  setSyncCallback(): Promise<void>;
  evaluateSync(shouldSync: boolean): void;
  setCapturingMode(mode: any): void;
  setScreenshotQuality(quality: any): void;
  setScreenshotCaptureInterval(intervalMs: number): void;
}

export const NativeSessionReplay = (SessionReplayTurboSpec ??
  ReactNativeModules.LCQSessionReplay) as unknown as SessionReplayNativeModule;
export enum NativeEvents {
  SESSION_REPLAY_ON_SYNC_CALLBACK_INVOCATION = 'LCQSessionReplayOnSyncCallback',
}

export const emitter = new NativeEventEmitter(NativeSessionReplay);
