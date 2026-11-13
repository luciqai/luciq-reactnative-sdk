import type { NativeModule } from 'react-native';

import { NativeExampleModules } from './NativePackage';

export interface NativeScreensExampleNativeModule extends NativeModule {
  /** Shows a plain native screen (an Activity on Android, a view controller on iOS). */
  openNativeScreen(): void;
}

export const NativeExampleScreens = NativeExampleModules.NativeScreensExampleModule;
