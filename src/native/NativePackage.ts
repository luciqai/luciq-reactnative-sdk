import { NativeModules as ReactNativeModules, TurboModuleRegistry } from 'react-native';

import type { ApmNativeModule } from './NativeAPM';
import type { BugReportingNativeModule } from './NativeBugReporting';
import type { CrashReportingNativeModule } from './NativeCrashReporting';
import type { FeatureRequestsNativeModule } from './NativeFeatureRequests';
import type { LuciqNativeModule } from './NativeLuciq';
import type { RepliesNativeModule } from './NativeReplies';
import type { SurveysNativeModule } from './NativeSurveys';
import type { SessionReplayNativeModule } from './NativeSessionReplay';
import type { NetworkLoggerNativeModule } from './NativeNetworkLogger';
import type { Spec as ApmSpec } from './specs/NativeAPM';
import type { Spec as BugReportingSpec } from './specs/NativeBugReporting';
import type { Spec as CrashReportingSpec } from './specs/NativeCrashReporting';
import type { Spec as FeatureRequestsSpec } from './specs/NativeFeatureRequests';
import type { Spec as LuciqSpec } from './specs/NativeLuciq';
import type { Spec as NetworkLoggerSpec } from './specs/NativeNetworkLogger';
import type { Spec as RepliesSpec } from './specs/NativeReplies';
import type { Spec as SessionReplaySpec } from './specs/NativeSessionReplay';
import type { Spec as SurveysSpec } from './specs/NativeSurveys';

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

const legacy = ReactNativeModules as LuciqNativePackage;

function resolve<TSpec, TLegacy>(name: string, fallback: TLegacy): TLegacy {
  return (TurboModuleRegistry.get<TSpec & object>(name) as unknown as TLegacy | null) ?? fallback;
}

const LCQAPM = resolve<ApmSpec, ApmNativeModule>('LCQAPM', legacy.LCQAPM);
const LCQBugReporting = resolve<BugReportingSpec, BugReportingNativeModule>(
  'LCQBugReporting',
  legacy.LCQBugReporting,
);
const LCQCrashReporting = resolve<CrashReportingSpec, CrashReportingNativeModule>(
  'LCQCrashReporting',
  legacy.LCQCrashReporting,
);
const LCQFeatureRequests = resolve<FeatureRequestsSpec, FeatureRequestsNativeModule>(
  'LCQFeatureRequests',
  legacy.LCQFeatureRequests,
);
const Luciq = resolve<LuciqSpec, LuciqNativeModule>('Luciq', legacy.Luciq);
const LCQReplies = resolve<RepliesSpec, RepliesNativeModule>('LCQReplies', legacy.LCQReplies);
const LCQSurveys = resolve<SurveysSpec, SurveysNativeModule>('LCQSurveys', legacy.LCQSurveys);
const LCQSessionReplay = resolve<SessionReplaySpec, SessionReplayNativeModule>(
  'LCQSessionReplay',
  legacy.LCQSessionReplay,
);
const LCQNetworkLogger = resolve<NetworkLoggerSpec, NetworkLoggerNativeModule>(
  'LCQNetworkLogger',
  legacy.LCQNetworkLogger,
);

export const NativeModules: LuciqNativePackage = {
  LCQAPM,
  LCQBugReporting,
  LCQCrashReporting,
  LCQFeatureRequests,
  Luciq,
  LCQReplies,
  LCQSurveys,
  LCQSessionReplay,
  LCQNetworkLogger,
};
