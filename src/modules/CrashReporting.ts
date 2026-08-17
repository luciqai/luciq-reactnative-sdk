import type { ExtendedError } from 'react-native/Libraries/Core/Devtools/parseErrorStack';

import { NativeCrashReporting } from '../native/NativeCrashReporting';
import LuciqUtils from '../utils/LuciqUtils';
import { Platform } from 'react-native';
import type { NonFatalOptions } from '../models/NonFatalOptions';
import { NonFatalErrorLevel } from '../utils/Enums';
import { Logger } from '../utils/logger';
import { LuciqDebugTags } from '../constants/DebugTags';

const TAG = LuciqDebugTags.CRASH_REPORTING;

/**
 * Enables and disables everything related to crash reporting including intercepting
 * errors in the global error handler. It is enabled by default.
 * @param isEnabled
 */
export const setEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setEnabled', { isEnabled });
  NativeCrashReporting.setEnabled(isEnabled);
};

/**
 * Send handled JS error object
 * @param error Error object to be sent to Luciq's servers
 * @param nonFatalOptions extra config for the non-fatal error sent with Error Object
 */
export const reportError = (error: ExtendedError, nonFatalOptions: NonFatalOptions = {}) => {
  const isErrorInstance = error instanceof Error;
  Logger.debug(TAG, 'reportError invoked', {
    isErrorInstance,
    errorName: isErrorInstance ? (error as Error).name : typeof error,
    // Error messages can contain user data (emails, IDs, server response excerpts).
    // Log only the length so the trace stays diagnostic without leaking content.
    errorMessageLength: isErrorInstance ? ((error as Error).message?.length ?? 0) : 0,
    stackPresent: isErrorInstance && !!(error as Error).stack,
    level: nonFatalOptions.level,
    fingerprintPresent: !!nonFatalOptions.fingerprint,
    userAttributeKeyCount: nonFatalOptions.userAttributes
      ? Object.keys(nonFatalOptions.userAttributes).length
      : 0,
  });
  if (isErrorInstance) {
    let level = NonFatalErrorLevel.error;
    if (nonFatalOptions.level != null) {
      level = nonFatalOptions.level;
    }
    return LuciqUtils.sendCrashReport(error, (data) => {
      Logger.debug(TAG, 'reportError -> native sendHandledJSCrash', {
        errorName: (error as Error).name,
        level,
        fingerprintPresent: !!nonFatalOptions.fingerprint,
      });
      return NativeCrashReporting.sendHandledJSCrash(
        data,
        nonFatalOptions.userAttributes,
        nonFatalOptions.fingerprint,
        level,
      );
    });
  } else {
    Logger.warn(TAG, 'reportError omitted: only Error instances are supported', {
      receivedType: typeof error,
    });
    return;
  }
};

/**
 * Enables or disables JS thread hang detection.
 *
 * A native watchdog thread monitors the JS thread's message queue and detects
 * hangs of >= 3 seconds (matching the native App Hangs threshold), including
 * hangs the app never recovers from (reported
 * on the next launch). Hangs are reported as non-fatal issues named
 * `JSThreadHang` with the hang duration attached. Automatically disabled in
 * development builds (Metro reloads and debuggers block the JS thread
 * legitimately).
 * @param isEnabled
 */
export const setJSHangEnabled = (isEnabled: boolean): boolean => {
  try {
    NativeCrashReporting.setJSHangEnabled(isEnabled);
    Logger.debug(LuciqDebugTags.JS_HANG, 'setJSHangEnabled', { isEnabled });
    return true;
  } catch (error) {
    // Version-skewed or missing native module must never crash the host app.
    Logger.error(LuciqDebugTags.JS_HANG, 'Failed to configure JS hang detection', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return false;
  }
};

/**
 * Enables and disables capturing native C++ NDK crashes.
 * @param isEnabled
 */
export const setNDKCrashesEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setNDKCrashesEnabled', { isEnabled, platform: Platform.OS });
  if (Platform.OS === 'android') {
    NativeCrashReporting.setNDKCrashesEnabled(isEnabled);
  }
};
