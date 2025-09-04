import { NativeModules as ReactNativeModules } from 'react-native';

import type { ApmNativeModule } from './NativeAPM';
import type { BugReportingNativeModule } from './NativeBugReporting';
import type { CrashReportingNativeModule } from './NativeCrashReporting';
import type { FeatureRequestsNativeModule } from './NativeFeatureRequests';
import type { LuciqNativeModule } from './NativeLuciq';
import type { RepliesNativeModule } from './NativeReplies';
import type { SurveysNativeModule } from './NativeSurveys';
import type { SessionReplayNativeModule } from './NativeSessionReplay';
import type { NetworkLoggerNativeModule } from './NativeNetworkLogger';

export interface LuciqNativePackage {
  LCQAPM: ApmNativeModule;
  LCQBugReporting: BugReportingNativeModule;
  LCQCrashReporting: CrashReportingNativeModule;
  LCQFeatureRequests: FeatureRequestsNativeModule;
  Luciq: LuciqNativeModule;
  LCQReplies: RepliesNativeModule;
  LCQSurveys: SurveysNativeModule;
  LCQSessionReplay: SessionReplayNativeModule;
  LCQNetworkLogger: NetworkLoggerNativeModule;
}

export const NativeModules = ReactNativeModules as LuciqNativePackage;
