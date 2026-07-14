import { NativeSessionReplay, NativeEvents, emitter } from '../native/NativeSessionReplay';
import type { SessionMetadata } from '../models/SessionMetadata';
import type { CapturingMode, ScreenshotQuality } from '../utils/Enums';
import { Logger } from '../utils/logger';
import { LuciqDebugTags } from '../constants/DebugTags';

const TAG = LuciqDebugTags.SESSION_REPLAY;

/**
 * Enables or disables Session Replay for your Luciq integration.
 *
 * By default, Session Replay is enabled if it is available in your current plan
 *
 * @param isEnabled
 *
 * @example
 * ```ts
 * SessionReplay.setEnabled(true);
 * ```
 */
export const setEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setEnabled', { isEnabled });
  NativeSessionReplay.setEnabled(isEnabled);
};

/**
 * Enables or disables network logs for Session Replay.
 *
 * By default, network logs are enabled.
 *
 * @param isEnabled
 *
 * @example
 * ```ts
 * SessionReplay.setNetworkLogsEnabled(true);
 * ```
 */
export const setNetworkLogsEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setNetworkLogsEnabled', { isEnabled });
  NativeSessionReplay.setNetworkLogsEnabled(isEnabled);
};

/**
 * Enables or disables Luciq logs for Session Replay.
 *
 * By default, Luciq logs are enabled.
 *
 * @param isEnabled
 *
 * @example
 * ```ts
 * SessionReplay.setLuciqLogsEnabled(true);
 * ```
 */
export const setLuciqLogsEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setLuciqLogsEnabled', { isEnabled });
  NativeSessionReplay.setLuciqLogsEnabled(isEnabled);
};

/**
 * Enables or disables capturing of user steps  for Session Replay.
 *
 * By default, user steps are enabled.
 *
 * @param isEnabled
 *
 * @example
 * ```ts
 * SessionReplay.setUserStepsEnabled(true);
 * ```
 */
export const setUserStepsEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setUserStepsEnabled', { isEnabled });
  NativeSessionReplay.setUserStepsEnabled(isEnabled);
};

/**
 * Retrieves current session's replay link.
 *
 * @example
 * ```ts
 * SessionReplay.getSessionReplayLink();
 * ```
 */
export const getSessionReplayLink = async (): Promise<string> => {
  Logger.debug(TAG, 'getSessionReplayLink invoked');
  const link = await NativeSessionReplay.getSessionReplayLink();
  // Avoid logging the link itself (may identify the session); log only presence.
  Logger.debug(TAG, 'getSessionReplayLink resolved', { hasLink: !!link });
  return link;
};

/**
 * Set a callback for whether this session should sync
 *
 * @param handler

 * @example
 * ```ts
 * SessionReplay.setSyncCallback((metadata) => {
 *    return metadata.device == "Xiaomi M2007J3SY" &&
 *         metadata.os == "OS Level 33" &&
 *         metadata.appVersion == "3.1.4 (4)" ||
 *         metadata.sessionDurationInSeconds > 20;
 * });
 * ```
 */
export const setSyncCallback = async (
  handler: (payload: SessionMetadata) => boolean,
): Promise<void> => {
  Logger.debug(TAG, 'setSyncCallback registered');
  emitter.addListener(NativeEvents.SESSION_REPLAY_ON_SYNC_CALLBACK_INVOCATION, (payload) => {
    const result = handler(payload);
    const shouldSync = Boolean(result);

    if (Logger.isDebugEnabled()) {
      Logger.debug(TAG, 'sync callback evaluated', {
        payloadKeys: payload ? Object.keys(payload) : [],
        resultType: typeof result,
        shouldSync,
      });
    }

    if (typeof result !== 'boolean') {
      Logger.warn(
        TAG,
        `The callback passed to SessionReplay.setSyncCallback was expected to return a boolean but returned "${result}". The value has been cast to boolean, proceeding with ${shouldSync}.`,
      );
    }

    NativeSessionReplay.evaluateSync(shouldSync);
  });

  return NativeSessionReplay.setSyncCallback();
};

/**
 * Sets the capturing mode for Session Replay screenshots.
 *
 * - `navigation`: Captures screenshots only when users navigate between screens (default).
 * - `interactions`: Captures screenshots on screen navigation and user interactions.
 * - `frequency`: Captures screenshots at a fixed time interval for video-like playback.
 *
 * Note: Should be called before SDK initialization for best results.
 *
 * @param mode The capturing mode to use.
 *
 * @example
 * ```ts
 * import { CapturingMode } from '@luciq/react-native';
 *
 * SessionReplay.setCapturingMode(CapturingMode.frequency);
 * ```
 */
export const setCapturingMode = (mode: CapturingMode) => {
  Logger.debug(TAG, 'setCapturingMode', { mode });
  NativeSessionReplay.setCapturingMode(mode);
};

/**
 * Sets the visual quality of captured Session Replay screenshots.
 *
 * - `high`: 50% WebP compression - Best visual quality (~62 screenshots per session).
 * - `normal`: 25% WebP compression - Balanced quality and storage (~104 screenshots per session, default).
 * - `greyscale`: Grayscale + 25% WebP compression - Maximum storage efficiency (~130 screenshots per session).
 *
 * @param quality The screenshot quality profile to use.
 *
 * @example
 * ```ts
 * import { ScreenshotQuality } from '@luciq/react-native';
 *
 * SessionReplay.setScreenshotQuality(ScreenshotQuality.high);
 * ```
 */
export const setScreenshotQuality = (quality: ScreenshotQuality) => {
  Logger.debug(TAG, 'setScreenshotQuality', { quality });
  NativeSessionReplay.setScreenshotQuality(quality);
};

/**
 * Sets the capture interval for Session Replay when using frequency capturing mode.
 *
 * This determines how often screenshots are captured when `CapturingMode.frequency` is set.
 *
 * @param intervalMs Time between captures in milliseconds. Minimum: 500ms, Default: 1000ms.
 *
 * @example
 * ```ts
 * // Capture every 500ms (2 FPS)
 * SessionReplay.setScreenshotCaptureInterval(500);
 *
 * // Capture every 2 seconds
 * SessionReplay.setScreenshotCaptureInterval(2000);
 * ```
 */
export const setScreenshotCaptureInterval = (intervalMs: number) => {
  Logger.debug(TAG, 'setScreenshotCaptureInterval', { intervalMs });
  NativeSessionReplay.setScreenshotCaptureInterval(intervalMs);
};
