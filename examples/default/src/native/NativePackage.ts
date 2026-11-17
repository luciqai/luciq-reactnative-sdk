import { NativeModules as ReactNativeModules } from 'react-native';

import type { CrashReportingExampleNativeModule } from './NativeCrashReporting';
import type { NativeScreensExampleNativeModule } from './NativeScreens';

export interface LuciqExampleNativePackage {
  CrashReportingExampleModule: CrashReportingExampleNativeModule;
  NativeScreensExampleModule: NativeScreensExampleNativeModule;
}

export const NativeExampleModules = ReactNativeModules as LuciqExampleNativePackage;
