import { NativeAPM } from '../../native/NativeAPM';
import { Logger } from '../../utils/logger';
import { fromEpochMicros, nowMicros, toEpochMicros } from '../../utils/LuciqUtils';

export interface ScreenLoadingSpan {
  spanId: string;
  screenName: string;
  startTimestamp: number;
  endTimestamp?: number;
  ttid?: number;
  status: 'pending' | 'measuring' | 'completed' | 'error';
  isManual: boolean;
  attributes: Map<string, number>;
}

/**
 * Automatic Screen Loading Measurement
 *
 * Start point: `__unsafe_action__` navigation event (below).
 *   - Fires when a navigation action is dispatched, before the target screen mounts.
 *   - `ScreenLoadingManager.createSpan()` records `nowMicros()` as the span start.
 *
 * End point: `_onNavigationStateChange()` (called from `onStateChange`).
 *   - Fires after navigation state has settled and the new screen is mounted.
 *   - `ScreenLoadingManager.endSpan()` fetches the native frame timestamp from
 *     CADisplayLink (iOS) / Choreographer (Android) to mark actual render completion.
 *   - The TTID is: native frame timestamp − span start.
 *
 *
 * Manual Screen Loading Measurement
 *
 * Start point: Component instantiation (lazy init block before first render).
 *   - `nowMicros()` is captured as `constructorTimestampRef` and passed to
 *     `ScreenLoadingManager.createSpan()` as the span's start timestamp.
 *
 * End point: `useLayoutEffect` (fires synchronously after React commits DOM
 *   mutations, before the browser paints).
 *   - `ScreenLoadingManager.endSpan()` fetches the native frame timestamp
 *     from CADisplayLink (iOS) / Choreographer (Android) to mark the actual
 *     render completion. The TTID is: native frame timestamp − span start.
 *
 * Both approaches share the same `endSpan()` path so TTID values are comparable.
 */

class ScreenLoadingManagerClass {
  private activeSpans: Map<string, ScreenLoadingSpan> = new Map();
  private isInitialized: boolean = false;
  private isEnabled: boolean = false;
  private isEndScreenLoadingEnabled: boolean = false;
  private isFrameTrackingInitialized: boolean = false;
  private activeSpanId: string | null = null;
  private maxConcurrentSpans: number = 50;
  private excludedRoutes: Set<string> = new Set();

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check feature flags
      this.isEnabled = await NativeAPM.isScreenLoadingEnabled();
      this.isEndScreenLoadingEnabled = await NativeAPM.isEndScreenLoadingEnabled();
      if (this.isEnabled) {
        await NativeAPM.initScreenFrameTracking();
        this.isFrameTrackingInitialized = true;
        Logger.log('[ScreenLoading] Manager initialized, feature enabled');
      } else {
        Logger.log('[ScreenLoading] Feature disabled by flag');
      }
      this.isInitialized = true;
    } catch (error) {
      Logger.error('[ScreenLoading] Failed to initialize:', error);
      this.isEnabled = false;
    }
  }

  async refreshFlags(): Promise<void> {
    try {
      this.isEnabled = await NativeAPM.isScreenLoadingEnabled();
      this.isEndScreenLoadingEnabled = await NativeAPM.isEndScreenLoadingEnabled();

      if (this.isEnabled && !this.isFrameTrackingInitialized) {
        await NativeAPM.initScreenFrameTracking();
        this.isFrameTrackingInitialized = true;
        Logger.log('[ScreenLoading] Frame tracking initialized after flag refresh');
      }

      Logger.log(
        `[ScreenLoading] Flags refreshed - enabled: ${this.isEnabled}, endScreenLoading: ${this.isEndScreenLoadingEnabled}`,
      );
    } catch (error) {
      Logger.error('[ScreenLoading] Failed to refresh flags:', error);
    }
  }

  /**
   * Exclude specific routes from automatic screen loading measurement
   * @param routes Array of route names to exclude
   */
  excludeRoutes(routes: string[]): void {
    routes.forEach((route) => this.excludedRoutes.add(route));
    Logger.log('[ScreenLoading] Excluded routes:', Array.from(this.excludedRoutes));
  }

  /**
   * Include previously excluded routes back into screen loading measurement
   * @param routes Array of route names to include (or empty to clear all exclusions)
   */
  includeRoutes(routes?: string[]): void {
    if (!routes || routes.length === 0) {
      this.excludedRoutes.clear();
      Logger.log('[ScreenLoading] Cleared all route exclusions');
    } else {
      routes.forEach((route) => this.excludedRoutes.delete(route));
      Logger.log('[ScreenLoading] Removed exclusions for:', routes);
    }
  }

  /**
   * Check if a route is excluded from measurement
   */
  isRouteExcluded(routeName: string): boolean {
    return this.excludedRoutes.has(routeName);
  }

  /**
   * Create a new screen loading span
   * @param screenName Name of the screen
   * @param isManual Whether the span is manual (not automatically created)
   * @param startTimestampParam Optional start timestamp in microseconds (defaults to nowMicros())
   * @returns The created span or null if the feature is not enabled
   */
  createSpan(
    screenName: string,
    isManual: boolean = false,
    startTimestampParam?: number,
  ): ScreenLoadingSpan | null {
    if (!this.isEnabled) {
      return null;
    }

    // Check if route is excluded (only for automatic tracking)
    if (!isManual && this.isRouteExcluded(screenName)) {
      Logger.log(`[ScreenLoading] Route "${screenName}" is excluded from automatic measurement`);
      return null;
    }

    // Cleanup if exceeding capacity
    if (this.activeSpans.size >= this.maxConcurrentSpans) {
      this.cleanupOldestSpans();
    }

    const spanId = Date.now().toString();
    const startTimestamp = startTimestampParam ?? nowMicros();

    const span: ScreenLoadingSpan = {
      spanId,
      screenName,
      startTimestamp,
      status: 'pending',
      isManual,
      attributes: new Map<string, number>(),
    };

    this.activeSpans.set(spanId, span);

    // Register with native for frame tracking
    NativeAPM.setActiveScreenSpanId(spanId);
    if (!isManual) {
      this.activeSpanId = spanId;
    }
    span.status = 'measuring';

    Logger.log(
      `[ScreenLoading] Created span ${spanId} for screen "${screenName}" (${isManual ? 'manual' : 'automatic'})`,
    );

    return span;
  }

  /**
   * End a screen loading span
   * @param spanId The ID of the span to end
   */
  async endSpan(spanId: string): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const span = this.activeSpans.get(spanId);
    if (!span || span.status === 'completed') {
      return;
    }

    try {
      // Get frame timestamp from native with retry logic
      // The native frame callback (CADisplayLink/Choreographer) may not have executed yet
      // if endSpan is called very quickly after createSpan. Retry up to 3 times with
      // a delay of ~20ms (slightly more than one frame at 60fps) between attempts.
      const maxRetries = 3;
      const retryDelayMs = 20;
      let frameTimestamp: number | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        frameTimestamp = await NativeAPM.getScreenTimeToDisplay(spanId);

        if (frameTimestamp) {
          break;
        }

        // Wait for next frame before retrying (only if not last attempt)
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }

      if (frameTimestamp) {
        // Native returns epoch microseconds; convert to monotonic for consistent internal math
        span.endTimestamp = fromEpochMicros(frameTimestamp);
        span.ttid = span.endTimestamp - span.startTimestamp;

        span.status = 'completed';

        // Log the measurement
        this.logScreenLoading(span);
      } else {
        span.status = 'error';
        Logger.warn(`[ScreenLoading] No frame timestamp available for span ${spanId}`);
      }
    } catch (error) {
      span.status = 'error';
      Logger.error(`[ScreenLoading] Failed to get timestamp for span ${spanId}:`, error);
    }

    // Cleanup after a delay
    setTimeout(() => {
      this.activeSpans.delete(spanId);
    }, 5000);
  }

  /**
   * Log a screen loading span
   * @param span The span to log
   */
  private logScreenLoading(span: ScreenLoadingSpan): void {
    // Convert Map to plain object for JSON serialization (JSON.stringify cannot serialize Maps)
    const attributesObject = Object.fromEntries(span.attributes);

    const startEpochUs = Math.round(toEpochMicros(span.startTimestamp));
    const endEpochUs = span.endTimestamp ? Math.round(toEpochMicros(span.endTimestamp)) : undefined;

    const logData = {
      span_id: span.spanId,
      screen_name: span.screenName,
      start_timestamp_us: startEpochUs,
      end_timestamp_us: endEpochUs,
      ttid_us: span.ttid ? Math.round(span.ttid) : undefined,
      ttid_ms: span.ttid ? Math.round(span.ttid) / 1000 : undefined,
      is_manual: span.isManual,
      attributes: attributesObject,
    };

    Logger.log('[ScreenLoading] Measurement:', JSON.stringify(logData, null, 2));

    // Sync screen loading data to native layer (also pass converted object)
    if (span.isManual) {
      NativeAPM.syncManualScreenLoading(
        span.screenName,
        startEpochUs,
        Math.round(span.ttid!),
        attributesObject,
      );
    } else {
      NativeAPM.syncScreenLoading(
        Number(span.spanId),
        span.screenName,
        startEpochUs,
        Math.round(span.ttid!),
        attributesObject,
      );
    }
  }

  /**
   * End a screen loading span using the current timestamp and active span ID
   */
  endScreenLoading(): void {
    if (!this.isEndScreenLoadingFeatureEnabled()) {
      Logger.error('[ScreenLoading] End screen loading feature is not enabled');
      return;
    }
    if (!this.activeSpanId) {
      Logger.warn('[ScreenLoading] No active span to end screen loading');
      return;
    }
    try {
      const timeStampMicro = Math.round(toEpochMicros(nowMicros()));
      const uiTraceId = Number(this.activeSpanId);
      NativeAPM.endScreenLoading(timeStampMicro, uiTraceId);
      Logger.log(
        `[ScreenLoading] endScreenLoading() was called at ${timeStampMicro} for ui trace id "${uiTraceId}"`,
      );
    } catch (error) {
      Logger.error('[ScreenLoading] Failed to end screen loading:', error);
    }
  }

  /**
   * Discard a span without logging or syncing it to native.
   * Used when a span should be silently dropped (e.g., excluded route resolved after creation).
   */
  discardSpan(spanId: string): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      this.activeSpans.delete(spanId);
      Logger.log(`[ScreenLoading] Discarded span ${spanId} for screen "${span.screenName}"`);
    }
  }

  getActiveSpan(spanId: string): ScreenLoadingSpan | undefined {
    return this.activeSpans.get(spanId);
  }

  getAllActiveSpans(): ScreenLoadingSpan[] {
    return Array.from(this.activeSpans.values());
  }

  addSpanAttribute(spanId: string, key: string, value: number): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.attributes.set(key, value);
    }
  }

  private cleanupOldestSpans(): void {
    const sortedSpans = Array.from(this.activeSpans.entries()).sort(
      (a, b) => a[1].startTimestamp - b[1].startTimestamp,
    );

    const toRemove = Math.max(0, sortedSpans.length - 30);
    for (let i = 0; i < toRemove; i++) {
      this.activeSpans.delete(sortedSpans[i][0]);
    }
  }

  isFeatureEnabled(): boolean {
    return this.isEnabled;
  }

  isEndScreenLoadingFeatureEnabled(): boolean {
    return this.isEnabled && this.isEndScreenLoadingEnabled;
  }
}

export const ScreenLoadingManager = new ScreenLoadingManagerClass();
