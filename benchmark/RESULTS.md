# New Architecture Benchmark - Results

Old Architecture (`dev`, NativeModules) vs New Architecture
(`feat/new-arch-migration-library`, TurboModules/JSI). 5 cold-start runs per
config; values below are **medians**. Latency = 2000 samples/run after a
200-call warmup. Arch confirmed at runtime (`arch=old|new`).

Environment: Android emulator + iOS simulator (iPhone 17), Release builds,
Hermes. RN 0.75.4. 2026-07-15.

## Android

| Metric                     | Old      | New      | Change        |
| -------------------------- | -------- | -------- | ------------- |
| Cold start `am start -W`   | 658 ms   | 452 ms   | **-31% (better)** |
| Startup TTI (JS)           | 164 ms   | 133 ms   | -19% (better) |
| Round trip p50             | 2.48 ms  | 2.33 ms  | -6% (better)  |
| Round trip p90             | 3.08 ms  | 2.69 ms  | -13% (better) |
| Round trip p99             | 5.76 ms  | 4.62 ms  | -20% (better) |
| Memory (TOTAL PSS)         | 113 MB   | 162 MB   | **+43% (worse)** |

## iOS (simulator)

| Metric                     | Old      | New      | Change        |
| -------------------------- | -------- | -------- | ------------- |
| Startup TTI (JS)           | 39 ms    | 62 ms    | +23 ms (worse, tiny) |
| Round trip p50             | 0.173 ms | 0.162 ms | -6% (better)  |
| Round trip p90             | 0.185 ms | 0.171 ms | -8% (better)  |
| Round trip p99             | 0.224 ms | 0.205 ms | -8% (better)  |
| Memory (phys footprint)    | 51 MB    | 72 MB    | **+41% (worse)** |

## Reading of the data

- **Bridge latency: modest, consistent win.** Round-trip tail latency (p90/p99)
  improves ~8-20% on both platforms; medians improve slightly. The gain is real
  but small in absolute terms - this SDK's calls are light, so the JSI vs bridge
  difference is a fraction of a ms per call. iOS round trips are ~15x faster
  than Android in absolute terms on both archs.
- **Android startup: clear win.** Full cold start -31%, JS TTI -19%.
- **iOS startup: slightly worse (JS TTI +23 ms).** Bridgeless init cost. Note
  the *full* iOS launch was not captured (simctl limitation), so this is only
  the JS-interactive slice; treat as inconclusive, not a headline regression.
- **Memory: regression on both platforms (+41-43%).** The New Architecture
  runtime (Fabric/TurboModule codegen, JSI) carries a higher baseline footprint.
  This is the most significant and consistent finding.
- **Void dispatch is noise.** Both archs measured 1-5 microseconds; the
  summarizer's "-200%/-400%" is sub-microsecond jitter, not signal. Ignore it -
  the awaited round trip is the meaningful latency metric.

## Caveats

- iOS numbers are from the **simulator**, not a device - indicative only.
  Re-run on a physical device for headline memory/startup figures.
- Android cold-start TTI is noisy at n=5 (31-477 ms range); increase runs for a
  tighter interval before quoting startup gains.
- Memory sampled right after a 2000-iteration attribute-setting benchmark on
  both archs equally; the delta holds but absolute values are inflated vs idle.
- Single machine, single OS version. Not a multi-device matrix.

## Verdict

Not a uniform "performance gain." The migration buys **lower bridge-latency
tails and faster Android cold start**, at the cost of a **~40% higher memory
footprint** and a small iOS JS-startup regression. Whether it is net-positive
depends on whether the app is latency/startup-bound (favor new arch) or
memory-constrained (weigh the regression). Confirm on physical devices before
publishing.
