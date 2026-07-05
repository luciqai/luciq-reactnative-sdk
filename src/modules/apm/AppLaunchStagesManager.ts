import { NativeAPM } from '../../native/NativeAPM';
import { Logger } from '../../utils/logger';
import { LuciqDebugTags } from '../../constants/DebugTags';
import { nowMicros, toEpochMicros } from '../../utils/LuciqUtils';

const TAG = LuciqDebugTags.APM_APP_LAUNCH;

/**
 * App Launch Stages Measurement
 *
 * Splits a single cold-launch duration into four named stages:
 *
 *   [1] Native / Pre-JS    process start -> JS engine ready
 *   [2] JS Load & Execute  JS-start -> root render start
 *   [3] First Render       render start -> mount / first frame
 *   [4] To Interactive     mount -> `endAppLaunch()`
 *
 * The SDK cannot observe anything before its own JS runs, so `jsStartMonotonicUs`
 * (captured at module load) is the earliest anchor available on the JS side.
 * Stage 1 is therefore computed natively as `(js-start epoch - native
 * process-start)`; this manager only measures and reports the JS-side boundaries
 * (Stages 2-4) plus that anchor.
 *
 * Marks are supplied by `LuciqCaptureAppLaunch` (render start + mount) and by
 * `APM.endAppLaunch()` (interactive). When the wrapper component is not used the
 * render/mount marks are absent and the report degrades gracefully to the JS
 * total (`js_total_mus`), still allowing native to compute Stage 1.
 */

// Captured at module load: the earliest JS timestamp the SDK can observe.
const jsStartMonotonicUs = nowMicros();

class AppLaunchStagesManagerClass {
  private isInitialized: boolean = false;
  private isEnabled: boolean = false;
  private renderStartUs?: number;
  private mountUs?: number;
  private hasReported: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // The native ingestion API may not exist yet (JS can ship ahead of the
      // native SDK). Feature-detect it and stay quietly disabled if it's absent
      // rather than logging an error on every launch.
      if (typeof NativeAPM.isAppLaunchStagesEnabled !== 'function') {
        Logger.debug(TAG, 'native app launch stages API unavailable; feature disabled');
        this.isEnabled = false;
        this.isInitialized = true;
        return;
      }

      this.isEnabled = await NativeAPM.isAppLaunchStagesEnabled();
      Logger.debug(TAG, 'manager initialized', { isEnabled: this.isEnabled });
      this.isInitialized = true;
    } catch (error) {
      Logger.error(TAG, 'initialize failed', {
        message: (error as Error)?.message,
        name: (error as Error)?.name,
      });
      this.isEnabled = false;
    }
  }

  isFeatureEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Marks the start of the root component's first render (Stage 2 end / Stage 3
   * start). Recorded once; ignored when the feature is disabled.
   * @param timestampUs Monotonic microsecond timestamp (`nowMicros()`).
   */
  markRenderStart(timestampUs: number): void {
    if (!this.isEnabled || this.renderStartUs !== undefined) {
      return;
    }
    this.renderStartUs = timestampUs;
    Logger.debug(TAG, 'render start marked', { timestampUs });
  }

  /**
   * Marks the root component mount / first frame (Stage 3 end / Stage 4 start).
   * Recorded once; ignored when the feature is disabled.
   * @param timestampUs Monotonic microsecond timestamp (`nowMicros()`).
   */
  markMounted(timestampUs: number): void {
    if (!this.isEnabled || this.mountUs !== undefined) {
      return;
    }
    this.mountUs = timestampUs;
    Logger.debug(TAG, 'mount marked', { timestampUs });
  }

  /**
   * Marks the app as interactive (Stage 4 end) and reports the stage breakdown
   * to native. Reports at most once per launch; ignored when the feature is
   * disabled. Never throws into the host app.
   */
  markInteractive(): void {
    if (!this.isEnabled) {
      return;
    }
    if (this.hasReported) {
      Logger.debug(TAG, 'stages already reported, ignoring');
      return;
    }

    try {
      const interactiveUs = nowMicros();
      const stages = this.buildStages(interactiveUs);
      const jsStartEpochUs = Math.round(toEpochMicros(jsStartMonotonicUs));

      this.hasReported = true;

      Logger.debug(TAG, 'reporting app launch stages', {
        jsStartEpochUs,
        stageKeys: Object.keys(stages),
      });

      NativeAPM.syncAppLaunchStages(jsStartEpochUs, stages);
    } catch (error) {
      Logger.error(TAG, 'markInteractive failed', {
        message: (error as Error)?.message,
        name: (error as Error)?.name,
      });
    }
  }

  /**
   * Builds the JS-side stage map. Durations are monotonic microsecond deltas;
   * `*_st_mus` keys are epoch-micros start anchors (matching screen-loading
   * conventions). Keys are omitted when their inputs are missing so native
   * tolerates a partial (wrapper-less) report.
   */
  private buildStages(interactiveUs: number): Record<string, number> {
    const stages: Record<string, number> = {};

    // Stage 2 - JS Load & Execute: js-start -> render start
    if (this.renderStartUs !== undefined) {
      stages.rnd_st_mus = Math.round(toEpochMicros(this.renderStartUs));
      stages.js_exec_mus = Math.round(this.renderStartUs - jsStartMonotonicUs);
    }

    // Stage 3 - First Render: render start -> mount
    if (this.renderStartUs !== undefined && this.mountUs !== undefined) {
      stages.mnt_st_mus = Math.round(toEpochMicros(this.mountUs));
      stages.rnd_mus = Math.round(this.mountUs - this.renderStartUs);
    }

    // Stage 4 - To Interactive: mount -> interactive (endAppLaunch)
    if (this.mountUs !== undefined) {
      stages.tti_mus = Math.round(interactiveUs - this.mountUs);
    }

    // Total JS time: js-start -> interactive. Always present so native can
    // compute the JS portion even when render/mount marks are absent.
    stages.js_total_mus = Math.round(interactiveUs - jsStartMonotonicUs);

    return stages;
  }
}

export const AppLaunchStagesManager = new AppLaunchStagesManagerClass();
