import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setEnabled(isEnabled: boolean): void;
  setNetworkLogsEnabled(isEnabled: boolean): void;
  setLuciqLogsEnabled(isEnabled: boolean): void;
  setUserStepsEnabled(isEnabled: boolean): void;
  getSessionReplayLink(): Promise<string>;
  setSyncCallback(): Promise<void>;
  evaluateSync(shouldSync: boolean): void;
  setCapturingMode(mode: string): void;
  setScreenshotQuality(quality: string): void;
  setScreenshotCaptureInterval(intervalMs: number): void;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('LCQSessionReplay');
