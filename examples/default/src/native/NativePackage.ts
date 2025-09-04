import { NativeModules as ReactNativeModules } from 'react-native';

import type { CrashReportingExampleNativeModule } from './NativeCrashReporting';

export interface LuciqExampleNativePackage {
  CrashReportingExampleModule: CrashReportingExampleNativeModule;
}

export const NativeExampleModules = ReactNativeModules as LuciqExampleNativePackage;
