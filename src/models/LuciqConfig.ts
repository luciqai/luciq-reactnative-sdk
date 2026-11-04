import type { InvocationEvent, LogLevel, NetworkInterceptionMode } from '../utils/Enums';
import type { OverAirUpdate } from './OverAirUpdate';

export interface LuciqConfig {
  /**
   * The token that identifies the app. You can find it on your dashboard.
   */
  token: string;
  /**
   * An array of events that invoke the SDK's UI.
   */
  invocationEvents: InvocationEvent[];
  /**
   * An optional LogLevel to indicate the verbosity of SDK logs. Default is Error.
   */
  debugLogsLevel?: LogLevel;

  /**
   * An optional code push version to be used for all reports.
   */
  codePushVersion?: string;

  /**
   * An optional flag to override SDK screenshot security behavior.
   */
  ignoreAndroidSecureFlag?: boolean;

  /**
   * An optional flag to report screens that aren't React Native under their own names.
   *
   * By default every screen in a React Native app is treated as a React Native screen, so a
   * native screen (an Android Activity or iOS view controller written natively, or a
   * third-party SDK screen such as a payment sheet) is labelled with the last JavaScript route
   * and its native repro steps are dropped. When `true`, only React Native screens use the
   * JavaScript routes; every native screen is reported with its own name, repro steps and user
   * steps.
   *
   * Requires a native Luciq SDK that supports hybrid apps; older native SDKs ignore it.
   *
   * @default false
   */
  trackNativeScreens?: boolean;

  /**
   * An optional current App variant to be used for filtering data.
   */
  appVariant?: string;

  /**
   * An optional network interception mode, this determines whether network interception
   * is done in the JavaScript side or in the native Android and iOS SDK side.
   *
   * When set to `NetworkInterceptionMode.native`, configuring network logging
   * should be done through native code not JavaScript (e.g. network request obfuscation).
   *
   * @default NetworkInterceptionMode.javascript
   */
  networkInterceptionMode?: NetworkInterceptionMode;

  /**
   * An optional over air service update version to be used for all reports.
   */
  overAirVersion?: OverAirUpdate;
}
