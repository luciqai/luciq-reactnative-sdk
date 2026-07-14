import Luciq from '@luciq/react-native';

/**
 * Bridge performance benchmark harness.
 *
 * Compares Old Architecture (NativeModules / async bridge) against
 * New Architecture (TurboModules / JSI) by exercising two real public SDK
 * calls in tight loops:
 *
 *   - void dispatch  -> `setUserAttribute` : JS -> native, no return value.
 *                       Old arch enqueues + serializes onto the bridge queue;
 *                       new arch is a direct synchronous JSI call.
 *   - round trip     -> `getUserAttribute` : JS -> native -> JS (Promise).
 *                       Captures full request/response latency.
 *
 * All results are printed as machine-parseable `[BENCH] key=value` lines so
 * the run-android.sh / run-ios.sh scripts can scrape them from logcat / the
 * simulator console. Results are also returned for on-screen display.
 */

export interface LatencyStats {
  samples: number;
  totalMs: number;
  avgMs: number;
  p50Ms: number;
  p90Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
}

export interface BenchmarkResult {
  arch: 'new' | 'old' | 'unknown';
  iterations: number;
  voidDispatch: LatencyStats;
  roundTrip: LatencyStats;
  ttiMs: number | null;
}

const now = (): number => {
  const perf = (global as unknown as { performance?: { now?: () => number } }).performance;
  if (perf && typeof perf.now === 'function') {
    return perf.now();
  }
  return Date.now();
};

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
};

const summarize = (durations: number[]): LatencyStats => {
  const sorted = [...durations].sort((a, b) => a - b);
  const total = sorted.reduce((sum, d) => sum + d, 0);
  return {
    samples: sorted.length,
    totalMs: round(total),
    avgMs: round(total / (sorted.length || 1)),
    p50Ms: round(percentile(sorted, 50)),
    p90Ms: round(percentile(sorted, 90)),
    p99Ms: round(percentile(sorted, 99)),
    minMs: round(sorted[0] ?? 0),
    maxMs: round(sorted[sorted.length - 1] ?? 0),
  };
};

const round = (n: number): number => Math.round(n * 1000) / 1000;

const detectArch = (): 'new' | 'old' | 'unknown' => {
  // RN sets this global to true when the New Architecture is enabled.
  const flag = global as unknown as { RN$Bridgeless?: boolean; __turboModuleProxy?: unknown };
  if (flag.RN$Bridgeless === true || flag.__turboModuleProxy != null) {
    return 'new';
  }
  if (flag.__turboModuleProxy === undefined && flag.RN$Bridgeless === undefined) {
    return 'old';
  }
  return 'unknown';
};

const emit = (key: string, value: string | number): void => {
  // Single-line, greppable. Do NOT change the format without updating the
  // scraping regex in benchmark/run-*.sh.
  console.log(`[BENCH] ${key}=${value}`);
};

const emitStats = (prefix: string, stats: LatencyStats): void => {
  emit(`${prefix}_samples`, stats.samples);
  emit(`${prefix}_avg_ms`, stats.avgMs);
  emit(`${prefix}_p50_ms`, stats.p50Ms);
  emit(`${prefix}_p90_ms`, stats.p90Ms);
  emit(`${prefix}_p99_ms`, stats.p99Ms);
  emit(`${prefix}_min_ms`, stats.minMs);
  emit(`${prefix}_max_ms`, stats.maxMs);
};

/**
 * Runs the bridge benchmark. Warms up the JIT / native module, then measures
 * void-dispatch and round-trip latency over `iterations` samples each.
 */
export const runBridgeBenchmark = async (iterations = 2000): Promise<BenchmarkResult> => {
  const arch = detectArch();
  const key = 'bench_attr';

  // Warmup: pay one-time costs (lazy TurboModule init, module lookup, JIT).
  for (let i = 0; i < 200; i++) {
    Luciq.setUserAttribute(key, `warm_${i}`);
    // eslint-disable-next-line no-await-in-loop
    await Luciq.getUserAttribute(key);
  }

  // --- void dispatch (JS -> native, fire and forget) ---
  const voidDurations: number[] = new Array(iterations);
  for (let i = 0; i < iterations; i++) {
    const start = now();
    Luciq.setUserAttribute(key, `v_${i}`);
    voidDurations[i] = now() - start;
  }

  // --- round trip (JS -> native -> JS, awaited sequentially) ---
  const rtDurations: number[] = new Array(iterations);
  for (let i = 0; i < iterations; i++) {
    const start = now();
    // eslint-disable-next-line no-await-in-loop
    await Luciq.getUserAttribute(key);
    rtDurations[i] = now() - start;
  }

  const voidDispatch = summarize(voidDurations);
  const roundTrip = summarize(rtDurations);
  const ttiMs = readTti();

  emit('arch', arch);
  emit('iterations', iterations);
  if (ttiMs != null) {
    emit('tti_ms', round(ttiMs));
  }
  emitStats('void', voidDispatch);
  emitStats('rt', roundTrip);
  emit('done', 1);

  return { arch, iterations, voidDispatch, roundTrip, ttiMs };
};

/**
 * Time-to-interactive: milliseconds from the earliest JS evaluation
 * (`global.__BENCH_JS_START__`, stamped at the top of index.js) to the moment
 * this is called - i.e. after the JS bundle loaded, React mounted, and
 * Luciq.init() returned. Captures the JS-side startup cost where arch
 * differences (bridgeless init, lazy TurboModules) surface.
 */
export const readTti = (): number | null => {
  const start = (global as unknown as { __BENCH_JS_START__?: number }).__BENCH_JS_START__;
  if (typeof start !== 'number') {
    return null;
  }
  return Date.now() - start;
};

let ttiEmitted = false;

/** Emits the TTI marker exactly once per process. Call from App after init. */
export const emitTtiOnce = (): void => {
  if (ttiEmitted) {
    return;
  }
  ttiEmitted = true;
  const tti = readTti();
  if (tti != null) {
    emit('tti_ms', round(tti));
    emit('tti_done', 1);
  }
};
