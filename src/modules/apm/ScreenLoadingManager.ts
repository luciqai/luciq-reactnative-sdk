import { NativeAPM } from '../../native/NativeAPM';
import { Logger } from '../../utils/logger';

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

class ScreenLoadingManagerClass {
  private activeSpans: Map<string, ScreenLoadingSpan> = new Map();
  private isInitialized: boolean = false;
  private isEnabled: boolean = false;
  private isEndScreenLoadingEnabled: boolean = false;
  private maxConcurrentSpans: number = 50;
  private excludedRoutes: Set<string> = new Set();

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check feature flag
      this.isEnabled = await NativeAPM.isScreenLoadingEnabled();
      this.isEndScreenLoadingEnabled = await NativeAPM.isEndScreenLoadingEnabled();
      if (this.isEnabled) {
        await NativeAPM.initScreenFrameTracking();
        this.isInitialized = true;
        Logger.log('[ScreenLoading] Manager initialized, feature enabled');
      } else {
        Logger.log('[ScreenLoading] Feature disabled by flag');
      }
    } catch (error) {
      Logger.error('[ScreenLoading] Failed to initialize:', error);
      this.isEnabled = false;
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
   * @returns The created span or null if the feature is not enabled
   */
  createSpan(screenName: string, isManual: boolean = false): ScreenLoadingSpan | null {
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
    const startTimestamp = Date.now() * 1000; // Convert to microseconds

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
        span.endTimestamp = frameTimestamp;
        span.ttid = frameTimestamp - span.startTimestamp;
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

    const logData = {
      type: 'screen_loading',
      span_id: span.spanId,
      screen_name: span.screenName,
      start_timestamp_us: span.startTimestamp,
      end_timestamp_us: span.endTimestamp,
      ttid_us: span.ttid,
      ttid_ms: span.ttid ? span.ttid / 1000 : undefined,
      is_manual: span.isManual,
      attributes: attributesObject,
    };

    Logger.log('[ScreenLoading] Measurement:', JSON.stringify(logData, null, 2));

    // Sync screen loading data to native layer (also pass converted object)
    NativeAPM.syncScreenLoading(
      Number(span.spanId),
      span.screenName,
      span.startTimestamp,
      span.ttid!,
      attributesObject,
    );
  }

  /**
   * End a screen loading span
   * @param timeStampMicro The timestamp in microseconds
   * @param uiTraceId The UI trace ID
   */
  endScreenLoading(timeStampMicro: number, uiTraceId: number): void {
    if (!this.isEndScreenLoadingFeatureEnabled()) {
      Logger.warn('[ScreenLoading] End screen loading feature is not enabled');
      return;
    }
    try {
      NativeAPM.endScreenLoading(timeStampMicro, uiTraceId);
    } catch (error) {
      Logger.error('[ScreenLoading] Failed to end screen loading:', error);
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
