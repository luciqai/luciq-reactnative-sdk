import { Platform } from 'react-native';

import { NativeAPM } from '../native/NativeAPM';
import { NativeLuciq } from '../native/NativeLuciq';
import { CustomSpan } from '../models/CustomSpan';

/**
 * Enables or disables APM
 * @param isEnabled
 */
export const setEnabled = (isEnabled: boolean) => {
  NativeAPM.setEnabled(isEnabled);
};

/**
 * If APM is enabled, Luciq SDK starts collecting data about the app launch time by default.
 * This API is used to give user more control over this behavior.
 * @param isEnabled
 */
export const setAppLaunchEnabled = (isEnabled: boolean) => {
  NativeAPM.setAppLaunchEnabled(isEnabled);
};

/**
 * To define when an app launch is complete,
 * such as when it's intractable, use the end app launch API.
 * You can then view this data with the automatic cold app launch.
 */
export const endAppLaunch = () => {
  NativeAPM.endAppLaunch();
};

/**
 * Enables or disables APM Network Metric
 * @param isEnabled - a boolean indicates either iOS monitoring is enabled or disabled.
 */
export const setNetworkEnabledIOS = (isEnabled: boolean) => {
  if (Platform.OS === 'ios') {
    NativeLuciq.setNetworkLoggingEnabled(isEnabled);
  }
};

/**
 * Enables or disables APM UI Responsiveness tracking feature
 * @param isEnabled
 */
export const setAutoUITraceEnabled = (isEnabled: boolean) => {
  NativeAPM.setAutoUITraceEnabled(isEnabled);
};

/**
 * Starts an AppFlow with the specified name.
 *
 * On starting two flows with the same name, the older flow will end with a force abandon end reason.
 * The AppFlow name cannot exceed 150 characters; otherwise, it's truncated,
 * leading and trailing whitespaces are also ignored.
 *
 * @param name - The name of the AppFlow. It cannot be an empty string or null.
 *               A new AppFlow is started if APM is enabled, the feature is enabled,
 *               and the Luciq SDK is initialized.
 */
export const startFlow = (name: string) => {
  NativeAPM.startFlow(name);
};

/**
 * Ends an AppFlow with the given name.
 *
 * @param name - The name of the AppFlow to end. It cannot be an empty string or null.
 */
export const endFlow = (name: string) => {
  NativeAPM.endFlow(name);
};

/**
 * Sets custom attributes for an AppFlow with a given name.
 *
 * Setting an attribute value to null will remove the corresponding key if it already exists.
 * Attribute keys cannot exceed 30 characters and leading/trailing whitespaces are ignored.
 * Empty strings or null for attribute keys are not accepted.
 *
 * Attribute values cannot exceed 60 characters and leading/trailing whitespaces are ignored.
 * Empty strings for attribute values are not accepted, but null can be used to remove an attribute.
 *
 * If an AppFlow is ended, attributes will not be added and existing ones will not be updated.
 *
 * @param name - The name of the AppFlow. It cannot be an empty string or null.
 * @param key - The key of the attribute. It cannot be an empty string or null.
 * @param [value] - The value of the attribute. It cannot be an empty string. Use null to remove the attribute.
 */

export const setFlowAttribute = (name: string, key: string, value?: string | null) => {
  NativeAPM.setFlowAttribute(name, key, value);
};

/**
 * Initiates a UI trace with the specified name using a native module.
 * @param {string} name - The `name` parameter in the `startUITrace` function is a string that
 * represents the name of the UI trace that you want to start. This name is used to identify and track
 * the specific UI trace within the application.
 */
export const startUITrace = (name: string) => {
  NativeAPM.startUITrace(name);
};

/**
 * Ends the currently running custom trace.
 */
export const endUITrace = () => {
  NativeAPM.endUITrace();
};

/**
 * Used for internal testing.
 */
export const _lcqSleep = () => {
  NativeAPM.lcqSleep();
};

/**
 * Enables or disables Screen Render feature
 * @param isEnabled
 */
export const setScreenRenderingEnabled = (isEnabled: boolean) => {
  NativeAPM.setScreenRenderingEnabled(isEnabled);
};

// Add at the end of the file (after existing exports)

/**
 * Active custom spans tracking
 * @internal
 */
export const _activeSpans = new Set<CustomSpan>();

/**
 * Maximum concurrent custom spans allowed
 * @internal
 */
const MAX_CONCURRENT_SPANS = 100;

/**
 * Starts a custom span for performance tracking.
 *
 * A custom span measures the duration of an arbitrary operation that is not
 * automatically tracked by the SDK. The span must be manually ended by calling
 * the `end()` method on the returned span object.
 *
 * @param name - The name of the span. Cannot be empty. Max 150 characters.
 *               Leading and trailing whitespace will be trimmed.
 *
 * @returns Promise<CustomSpan | null> - The span object to end later, or null if:
 *   - Name is empty after trimming
 *   - SDK is not initialized
 *   - APM is disabled
 *   - Custom spans feature is disabled
 *   - Maximum concurrent spans limit (100) reached
 *
 * @example
 * ```typescript
 * const span = await APM.startCustomSpan('Load User Profile');
 * if (span) {
 *   try {
 *     // ... perform operation ...
 *   } finally {
 *     await span.end();
 *   }
 * }
 * ```
 */
export const startCustomSpan = async (name: string): Promise<CustomSpan | null> => {
  try {
    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      console.error('[CustomSpan] Name cannot be empty');
      return null;
    }

    // Check SDK initialization
    const isInitialized = await NativeLuciq.isBuilt();
    if (!isInitialized) {
      console.error('[CustomSpan] SDK is not initialized');
      return null;
    }

    // Check APM enabled
    const isAPMEnabled = await NativeAPM.isAPMEnabled();
    if (!isAPMEnabled) {
      console.log('[CustomSpan] APM is disabled');
      return null;
    }

    // Check custom spans enabled
    const isCustomSpanEnabled = await NativeAPM.isCustomSpanEnabled();
    if (!isCustomSpanEnabled) {
      console.log('[CustomSpan] Custom spans feature is disabled');
      return null;
    }

    // Check concurrent span limit
    if (_activeSpans.size >= MAX_CONCURRENT_SPANS) {
      console.error(
        `[CustomSpan] Maximum number of concurrent custom spans (${MAX_CONCURRENT_SPANS}) reached. ` +
          'Please end some spans before starting new ones.',
      );
      return null;
    }

    // Truncate name if needed
    let spanName = trimmedName;
    if (spanName.length > 150) {
      spanName = spanName.substring(0, 150);
      console.log('[CustomSpan] Name truncated to 150 characters');
    }

    // Create and register span with callbacks
    const span = new CustomSpan(spanName, _unregisterSpan, _syncCustomSpan);
    _activeSpans.add(span);
    return span;
  } catch (error) {
    console.error('[CustomSpan] Error starting span:', error);
    return null;
  }
};

/**
 * Records a completed custom span with pre-recorded timestamps.
 *
 * Use this method when you have already recorded the start and end times
 * of an operation and want to report it retroactively.
 *
 * @param name - The name of the span. Cannot be empty. Max 150 characters.
 *               Leading and trailing whitespace will be trimmed.
 * @param startDate - The start time of the operation
 * @param endDate - The end time of the operation (must be after startDate)
 *
 * @returns Promise<void> - Resolves when the span has been recorded, or logs error if:
 *   - Name is empty after trimming
 *   - End date is not after start date
 *   - SDK is not initialized
 *   - APM is disabled
 *   - Custom spans feature is disabled
 *
 * @example
 * ```typescript
 * const start = new Date();
 * // ... operation already completed ...
 * const end = new Date();
 * await APM.addCompletedCustomSpan('Cache Lookup', start, end);
 * ```
 */
export const addCompletedCustomSpan = async (
  name: string,
  startDate: Date,
  endDate: Date,
): Promise<void> => {
  try {
    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      console.error('[CustomSpan] Name cannot be empty');
      return;
    }

    // Validate timestamps
    if (endDate <= startDate) {
      console.error('[CustomSpan] End date must be after start date');
      return;
    }

    // Check SDK initialization
    const isInitialized = await NativeLuciq.isBuilt();
    if (!isInitialized) {
      console.error('[CustomSpan] SDK is not initialized');
      return;
    }

    // Check APM enabled
    const isAPMEnabled = await NativeAPM.isAPMEnabled();
    if (!isAPMEnabled) {
      console.log('[CustomSpan] APM is disabled');
      return;
    }

    // Check custom spans enabled
    const isCustomSpanEnabled = await NativeAPM.isCustomSpanEnabled();
    if (!isCustomSpanEnabled) {
      console.log('[CustomSpan] Custom spans feature is disabled');
      return;
    }

    // Truncate name if needed
    let spanName = trimmedName;
    if (spanName.length > 150) {
      spanName = spanName.substring(0, 150);
      console.log('[CustomSpan] Name truncated to 150 characters');
    }

    // Convert to microseconds
    const startMicros = startDate.getTime() * 1000;
    const endMicros = endDate.getTime() * 1000;

    // Send to native SDK
    await _syncCustomSpan(spanName, startMicros, endMicros);
  } catch (error) {
    console.error('[CustomSpan] Error adding completed span:', error);
  }
};

/**
 * Internal method to unregister a span from active tracking
 * @internal
 */
export const _unregisterSpan = (span: CustomSpan): void => {
  _activeSpans.delete(span);
};

/**
 * Internal method to sync custom span data to native SDK
 * @internal
 */
export const _syncCustomSpan = async (
  name: string,
  startTimestamp: number,
  endTimestamp: number,
): Promise<void> => {
  // Validate inputs (safety net)
  if (!name || name.trim().length === 0) {
    console.error('[CustomSpan] Internal error: Name cannot be empty');
    return;
  }

  if (endTimestamp <= startTimestamp) {
    console.error('[CustomSpan] Internal error: End timestamp must be after start timestamp');
    return;
  }

  // Truncate name if needed (safety net)
  let spanName = name.trim();
  if (spanName.length > 150) {
    spanName = spanName.substring(0, 150);
  }

  // Send to native bridge
  await NativeAPM.syncCustomSpan(spanName, startTimestamp, endTimestamp);
};
