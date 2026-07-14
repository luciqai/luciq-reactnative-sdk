/**
 * Benchmark harness configuration.
 *
 * AUTORUN: when true, the bridge benchmark runs automatically once per cold
 * start (shortly after Luciq.init) and prints `[BENCH]` lines to the console.
 * This is what run-android.sh / run-ios.sh scrape - keep it true for
 * scripted A/B runs. Set false for normal example-app usage; you can still
 * trigger a run manually from the "Benchmark" tab.
 */
export const BENCHMARK_AUTORUN = true;

/** Samples per latency metric. Higher = more stable percentiles, slower run. */
export const BENCHMARK_ITERATIONS = 2000;

/** Delay after init before autorun, letting the first frame settle. */
export const BENCHMARK_AUTORUN_DELAY_MS = 3000;
