export interface PluginProps {
  name?: string;
  forceUploadSourceMaps?: boolean;
  addScreenRecordingBugReportingPermission?: boolean;
  addBugReportingIosMediaPermission?: boolean;
  /**
   * Starts the native SDK before the JS bundle loads so crashes during native startup
   * (Application.onCreate / AppDelegate / native module init) are captured. Requires `token`.
   */
  enablePreInitCrashCapture?: boolean;
  /**
   * App token used for pre-init. Falls back to `config.extra.luciq.token`. Required when
   * `enablePreInitCrashCapture` is true.
   */
  token?: string;
  /**
   * Overrides the SDK screenshot security behavior (Android `FLAG_SECURE`) at pre-init build time.
   * Only applied when `enablePreInitCrashCapture` is true.
   */
  ignoreAndroidSecureFlag?: boolean;
}
