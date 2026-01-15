import { NativeAPM } from '../native/NativeAPM';
import { NativeLuciq } from '../native/NativeLuciq';
import { CustomSpan } from '../models/CustomSpan';
import { LuciqStrings } from '../constants/Strings';

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
    console.error(LuciqStrings.customSpanNameEmpty);
    return;
  }

  if (endTimestamp <= startTimestamp) {
    console.error(LuciqStrings.customSpanEndTimeBeforeStartTime);
    return;
  }

  // Truncate name if needed (safety net)
  let spanName = name.trim();
  if (spanName.length > 150) {
    spanName = spanName.substring(0, 150);
  }

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
  try {
    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      console.error(LuciqStrings.customSpanNameEmpty);
      return null;
    }

    // Check SDK initialization
    const isInitialized = await NativeLuciq.isBuilt();
    if (!isInitialized) {
      console.error(LuciqStrings.customSpanSDKNotInitializedMessage);
      return null;
    }

    // Check APM enabled
    const isAPMEnabled = await NativeAPM.isAPMEnabled();
    if (!isAPMEnabled) {
      console.log(LuciqStrings.customSpanAPMDisabledMessage);
      return null;
    }

    // Check custom spans enabled
    const isCustomSpanEnabled = await NativeAPM.isCustomSpanEnabled();
    if (!isCustomSpanEnabled) {
      console.log(LuciqStrings.customSpanDisabled);
      return null;
    }

    // Check concurrent span limit
    if (activeSpans.size >= MAX_CONCURRENT_SPANS) {
      console.error(LuciqStrings.customSpanLimitReached);
      return null;
    }

    // Truncate name if needed
    let spanName = trimmedName;
    if (spanName.length > 150) {
      spanName = spanName.substring(0, 150);
      console.log(LuciqStrings.customSpanNameTruncated);
    }

    // Create and register span with callbacks
    const span = new CustomSpan(spanName, unregisterSpan, syncCustomSpan);
    activeSpans.add(span);
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
 * @returns Promise<void>
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
      console.error(LuciqStrings.customSpanNameEmpty);
      return;
    }

    // Validate timestamps
    if (endDate <= startDate) {
      console.error(LuciqStrings.customSpanEndTimeBeforeStartTime);
      return;
    }

    // Check SDK initialization
    const isInitialized = await NativeLuciq.isBuilt();
    if (!isInitialized) {
      console.error(LuciqStrings.customSpanSDKNotInitializedMessage);
      return;
    }

    // Check APM enabled
    const isAPMEnabled = await NativeAPM.isAPMEnabled();
    if (!isAPMEnabled) {
      console.log(LuciqStrings.customSpanAPMDisabledMessage);
      return;
    }

    // Check custom spans enabled
    const isCustomSpanEnabled = await NativeAPM.isCustomSpanEnabled();
    if (!isCustomSpanEnabled) {
      console.log(LuciqStrings.customSpanDisabled);
      return;
    }

    // Truncate name if needed
    let spanName = trimmedName;
    if (spanName.length > 150) {
      spanName = spanName.substring(0, 150);
      console.log(LuciqStrings.customSpanNameTruncated);
    }

    // Convert to microseconds
    const startMicros = startDate.getTime() * 1000;
    const endMicros = endDate.getTime() * 1000;

    // Send to native SDK
    await syncCustomSpan(spanName, startMicros, endMicros);
  } catch (error) {
    console.error('[CustomSpan] Error adding completed span:', error);
  }
};

/**
 * Test-only helper to clear active spans between tests.
 * @internal
 */
export const __resetCustomSpansForTests = (): void => {
  activeSpans.clear();
};
