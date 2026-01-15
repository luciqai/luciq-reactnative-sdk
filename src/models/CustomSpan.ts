/**
 * Callback to unregister a span from tracking
 */
type UnregisterCallback = (span: CustomSpan) => void;

/**
 * Callback to sync span data to native SDK
 */
type SyncCallback = (name: string, startTimestamp: number, endTimestamp: number) => Promise<void>;

/**
 * Represents a custom span for performance tracking.
 * A span measures the duration of an operation and reports it to the native SDK.
 */
export class CustomSpan {
  private name: string;
  private startTime: number; // Date.now() in milliseconds
  private startMonotonic: number; // performance.now() in milliseconds
  private endTime?: number;
  private duration?: number;
  private hasEnded: boolean = false;
  private endPromise?: Promise<void>;
  private unregisterCallback: UnregisterCallback;
  private syncCallback: SyncCallback;

  /**
   * Creates a new custom span. The span starts immediately upon creation.
   * @internal - Use APM.startCustomSpan() instead
   */
  constructor(name: string, unregisterCallback: UnregisterCallback, syncCallback: SyncCallback) {
    this.name = name;
    this.startTime = Date.now();
    this.startMonotonic = performance.now();
    this.unregisterCallback = unregisterCallback;
    this.syncCallback = syncCallback;
  }

  /**
   * Ends this custom span and reports it to the native SDK.
   * This method is idempotent - calling it multiple times is safe.
   * Subsequent calls will wait for the first call to complete.
   */
  async end(): Promise<void> {
    // Thread-safe check using Promise-based locking
    if (this.hasEnded) {
      if (this.endPromise) {
        await this.endPromise;
      }
      return;
    }

    // Create lock and mark as ended
    let resolveEnd: () => void;
    this.endPromise = new Promise((resolve) => {
      resolveEnd = resolve;
    });
    this.hasEnded = true;

    try {
      // Unregister from active spans
      this.unregisterCallback(this);

      // Calculate duration using monotonic clock
      const endMonotonic = performance.now();
      this.duration = endMonotonic - this.startMonotonic;

      // Calculate end time using wall clock
      this.endTime = this.startTime + this.duration;

      // Convert to microseconds for native SDK
      const startMicros = this.startTime * 1000;
      const endMicros = this.endTime * 1000;

      // Send to native SDK
      await this.syncCallback(this.name, startMicros, endMicros);
    } finally {
      // Release lock
      resolveEnd!();
    }
  }

  /**
   * Get the span name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Check if the span has ended
   */
  isEnded(): boolean {
    return this.hasEnded;
  }

  /**
   * Get the span duration in milliseconds (only available after end())
   */
  getDuration(): number | undefined {
    return this.duration;
  }
}
