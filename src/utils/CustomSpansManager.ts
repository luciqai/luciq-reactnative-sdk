import { NativeAPM } from '../native/NativeAPM';
import { NativeLuciq } from '../native/NativeLuciq';
import { CustomSpan } from '../models/CustomSpan';
import { LuciqStrings } from '../constants/Strings';
import { LuciqDebugTags } from '../constants/DebugTags';
import { Logger } from './logger';

const TAG = LuciqDebugTags.APM_CUSTOM_SPAN;

/**
 * Tracks currently active custom spans
 * @internal
 */
const activeSpans = new Set<CustomSpan>();

/**
 * Maximum concurrent custom spans allowed at any time
 * @internal
 */
const MAX_CONCURRENT_SPANS = 100;

/**
 * Internal: unregister a span from active tracking
 * @internal
 */
const unregisterSpan = (span: CustomSpan): void => {
  activeSpans.delete(span);
  Logger.debug(TAG, 'unregisterSpan', { activeSpansCount: activeSpans.size });
};

/**
 * Internal: sync custom span data to native SDK
 * @internal
 */
const syncCustomSpan = async (
  name: string,
  startTimestamp: number,
  endTimestamp: number,
): Promise<void> => {
  // Validate inputs (safety net)
  if (!name || name.trim().length === 0) {
    Logger.error(TAG, LuciqStrings.customSpanNameEmpty);
    return;
  }

  if (endTimestamp <= startTimestamp) {
    Logger.error(TAG, LuciqStrings.customSpanEndTimeBeforeStartTime, {
      startTimestamp,
      endTimestamp,
    });
    return;
  }

  // Truncate name if needed (safety net)
  let spanName = name.trim();
  if (spanName.length > 150) {
    spanName = spanName.substring(0, 150);
  }

  Logger.debug(TAG, 'syncCustomSpan -> native', {
    name: spanName,
    startTimestamp,
    endTimestamp,
    durationMicros: endTimestamp - startTimestamp,
  });
  await NativeAPM.syncCustomSpan(spanName, startTimestamp, endTimestamp);
};

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
 */
export const startCustomSpan = async (name: string): Promise<CustomSpan | null> => {
  Logger.debug(TAG, 'startCustomSpan invoked', {
    nameLength: name?.length ?? 0,
    activeSpansCount: activeSpans.size,
  });
  try {
    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      Logger.error(TAG, LuciqStrings.customSpanNameEmpty);
      return null;
    }

    // Check SDK initialization
    const isInitialized = await NativeLuciq.isBuilt();
    Logger.debug(TAG, 'gate: NativeLuciq.isBuilt', { isInitialized });
    if (!isInitialized) {
      Logger.error(TAG, LuciqStrings.customSpanSDKNotInitializedMessage);
      return null;
    }

    // Check APM enabled
    const isAPMEnabled = await NativeAPM.isAPMEnabled();
    Logger.debug(TAG, 'gate: NativeAPM.isAPMEnabled', { isAPMEnabled });
    if (!isAPMEnabled) {
      Logger.warn(TAG, LuciqStrings.customSpanAPMDisabledMessage);
      return null;
    }

    // Check custom spans enabled
    const isCustomSpanEnabled = await NativeAPM.isCustomSpanEnabled();
    Logger.debug(TAG, 'gate: NativeAPM.isCustomSpanEnabled', { isCustomSpanEnabled });
    if (!isCustomSpanEnabled) {
      Logger.warn(TAG, LuciqStrings.customSpanDisabled);
      return null;
    }

    // Check concurrent span limit
    if (activeSpans.size >= MAX_CONCURRENT_SPANS) {
      Logger.error(TAG, LuciqStrings.customSpanLimitReached, {
        activeSpansCount: activeSpans.size,
        max: MAX_CONCURRENT_SPANS,
      });
      return null;
    }

    // Truncate name if needed
    let spanName = trimmedName;
    if (spanName.length > 150) {
      spanName = spanName.substring(0, 150);
      Logger.warn(TAG, LuciqStrings.customSpanNameTruncated, {
        originalLength: trimmedName.length,
      });
    }

    // Create and register span with callbacks
    const span = new CustomSpan(spanName, unregisterSpan, syncCustomSpan);
    activeSpans.add(span);
    Logger.debug(TAG, 'startCustomSpan succeeded', {
      name: spanName,
      activeSpansCount: activeSpans.size,
    });
    return span;
  } catch (error) {
    Logger.error(TAG, 'startCustomSpan failed', {
      message: (error as Error)?.message,
      name: (error as Error)?.name,
    });
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
 * @returns Promise<void>
 */
export const addCompletedCustomSpan = async (
  name: string,
  startDate: Date,
  endDate: Date,
): Promise<void> => {
  Logger.debug(TAG, 'addCompletedCustomSpan invoked', {
    nameLength: name?.length ?? 0,
    startMs: startDate?.getTime?.(),
    endMs: endDate?.getTime?.(),
  });
  try {
    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      Logger.error(TAG, LuciqStrings.customSpanNameEmpty);
      return;
    }

    // Validate timestamps
    if (endDate <= startDate) {
      Logger.error(TAG, LuciqStrings.customSpanEndTimeBeforeStartTime, {
        startMs: startDate.getTime(),
        endMs: endDate.getTime(),
      });
      return;
    }

    // Check SDK initialization
    const isInitialized = await NativeLuciq.isBuilt();
    Logger.debug(TAG, 'gate: NativeLuciq.isBuilt', { isInitialized });
    if (!isInitialized) {
      Logger.error(TAG, LuciqStrings.customSpanSDKNotInitializedMessage);
      return;
    }

    // Check APM enabled
    const isAPMEnabled = await NativeAPM.isAPMEnabled();
    Logger.debug(TAG, 'gate: NativeAPM.isAPMEnabled', { isAPMEnabled });
    if (!isAPMEnabled) {
      Logger.warn(TAG, LuciqStrings.customSpanAPMDisabledMessage);
      return;
    }

    // Check custom spans enabled
    const isCustomSpanEnabled = await NativeAPM.isCustomSpanEnabled();
    Logger.debug(TAG, 'gate: NativeAPM.isCustomSpanEnabled', { isCustomSpanEnabled });
    if (!isCustomSpanEnabled) {
      Logger.warn(TAG, LuciqStrings.customSpanDisabled);
      return;
    }

    // Truncate name if needed
    let spanName = trimmedName;
    if (spanName.length > 150) {
      spanName = spanName.substring(0, 150);
      Logger.warn(TAG, LuciqStrings.customSpanNameTruncated, {
        originalLength: trimmedName.length,
      });
    }

    // Convert to microseconds
    const startMicros = startDate.getTime() * 1000;
    const endMicros = endDate.getTime() * 1000;

    // Send to native SDK
    await syncCustomSpan(spanName, startMicros, endMicros);
  } catch (error) {
    Logger.error(TAG, 'addCompletedCustomSpan failed', {
      message: (error as Error)?.message,
      name: (error as Error)?.name,
    });
  }
};

/**
 * Test-only helper to clear active spans between tests.
 * @internal
 */
export const __resetCustomSpansForTests = (): void => {
  activeSpans.clear();
};
