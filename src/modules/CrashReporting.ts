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
 * Enables and disables capturing native C++ NDK crashes.
 * @param isEnabled
 */
export const setNDKCrashesEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setNDKCrashesEnabled', { isEnabled, platform: Platform.OS });
  if (Platform.OS === 'android') {
    NativeCrashReporting.setNDKCrashesEnabled(isEnabled);
  }
};
