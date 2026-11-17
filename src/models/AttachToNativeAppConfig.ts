import type { LogLevel, NetworkInterceptionMode } from '../utils/Enums';

/**
 * Configuration for `Luciq.attachToNativeApp`, used by hybrid apps where the native app already
 * started Luciq. Everything else (token, invocation events, app variant, secure-flag handling)
 * comes from the native app's own Luciq setup.
 */
export interface AttachToNativeAppConfig {
  /**
   * An optional LogLevel to indicate the verbosity of the React Native SDK's own logs.
   * It does not change the native SDK's log level, which the native app sets. Default is Error.
   */
  debugLogsLevel?: LogLevel;

  /**
   * An optional network interception mode, this determines whether network interception
   * is done in the JavaScript side or in the native Android and iOS SDK side.
   *
   * In a hybrid app, `NetworkInterceptionMode.native` lets the native app's network logging
   * (and its masking) capture React Native requests too.
   *
   * @default NetworkInterceptionMode.javascript
   */
  networkInterceptionMode?: NetworkInterceptionMode;
}
