// Models
import type { LuciqConfig } from './models/LuciqConfig';
import Report from './models/Report';
import type { ThemeConfig } from './models/ThemeConfig';
import {
  createScreenLoadingConfig,
  defaultScreenLoadingConfig,
  type ScreenLoadingConfig,
} from './models/ScreenLoadingConfig';
// Modules
import * as APM from './modules/APM';
import * as BugReporting from './modules/BugReporting';
import * as CrashReporting from './modules/CrashReporting';
import * as FeatureRequests from './modules/FeatureRequests';
import * as Luciq from './modules/Luciq';
import * as NetworkLogger from './modules/NetworkLogger';
import type { NetworkData, NetworkDataObfuscationHandler } from './modules/NetworkLogger';
import {
  createProactiveReportingConfig,
  type ProactiveReportingConfigOptions,
} from './models/ProactiveReportingConfigs';
import * as Replies from './modules/Replies';
import type { Survey } from './modules/Surveys';
import * as Surveys from './modules/Surveys';
import * as SessionReplay from './modules/SessionReplay';
import type { SessionMetadata } from './models/SessionMetadata';
import * as LuciqScreenLoading from './components/LuciqScreenLoading';
import type { ScreenLoadingProps } from './components/LuciqScreenLoading';
// Navigation Timing
import {
  NavigationTimingProvider,
  useNavigationTiming,
  type NavigationTimingContextValue,
} from './components/NavigationTimingProvider';
// Navigation Container
import {
  LuciqNavigationContainer,
  type LuciqNavigationContainerProps,
} from './components/LuciqNavigationContainer';
// Screen Loading HOC
import {
  withScreenLoading,
  type WithScreenLoadingOptions,
  type WithScreenLoadingInjectedProps,
} from './components/withScreenLoading';
// Hooks
import {
  useScreenLoading,
  useScreenLoadingState,
  type UseScreenLoadingOptions,
  type UseScreenLoadingReturn,
  type UseScreenLoadingStateOptions,
} from './hooks';

export * from './utils/Enums';
export {
  Report,
  APM,
  BugReporting,
  CrashReporting,
  FeatureRequests,
  NetworkLogger,
  SessionReplay,
  Replies,
  Surveys,
  ProactiveReportingConfigOptions,
  createProactiveReportingConfig,
  LuciqScreenLoading,
  // Navigation Timing
  NavigationTimingProvider,
  useNavigationTiming,
  // Navigation Container
  LuciqNavigationContainer,
  // Screen Loading HOC
  withScreenLoading,
  // Screen Loading Config
  createScreenLoadingConfig,
  defaultScreenLoadingConfig,
  // Screen Loading Hooks
  useScreenLoading,
  useScreenLoadingState,
};
export type {
  LuciqConfig,
  Survey,
  NetworkData,
  NetworkDataObfuscationHandler,
  SessionMetadata,
  ThemeConfig,
  // Navigation Timing Types
  NavigationTimingContextValue,
  // Navigation Container Types
  LuciqNavigationContainerProps,
  // Screen Loading HOC Types
  WithScreenLoadingOptions,
  WithScreenLoadingInjectedProps,
  // Screen Loading Config Types
  ScreenLoadingConfig,
  // Screen Loading Types
  ScreenLoadingProps,
  // Screen Loading Hook Types
  UseScreenLoadingOptions,
  UseScreenLoadingReturn,
  UseScreenLoadingStateOptions,
};

export default Luciq;
