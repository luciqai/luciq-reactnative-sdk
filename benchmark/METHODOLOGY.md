# New Architecture Performance Benchmark - Methodology

Measures the performance gain of migrating `@luciq/react-native` from the Old
Architecture (NativeModules, async bridge) to the New Architecture
(TurboModules, JSI / bridgeless).

## What is compared

| Config    | Git branch                          | SDK bridge      | App arch flag |
| --------- | ----------------------------------- | --------------- | ------------- |
| old-arch  | `dev`                               | NativeModules   | OFF           |
| new-arch  | `feat/new-arch-migration-library`   | TurboModules    | ON            |

The example app consumes the SDK from source (`package.json`
`"react-native": "src/index.ts"`), so checking out a branch swaps both the JS
and native SDK. The app-level arch flag **must** match the SDK branch
(`set-arch.sh`) - otherwise RN's interop layer routes old-style modules through
the new runtime and hides the difference we are measuring.

## Metrics

### 1. Startup time

- **tti_ms (primary, both platforms).** Time from the earliest JS evaluation
  (`global.__BENCH_JS_START__`, stamped at the top of `index.js`) to just after
  React mounts and `Luciq.init()` returns (`emitTtiOnce()` in `App.tsx`). This
  is where arch differences surface: bridgeless startup and lazy TurboModule
  init change how quickly JS becomes interactive.
- **launch_total_ms (Android only).** `adb shell am start -W` `TotalTime` -
  full OS-level cold start to first frame. Arch-agnostic launcher metric, kept
  as a cross-check.
- **iOS full launch.** `simctl` has no reliable cold-start wall clock. For a
  true launch profile use Instruments:
  `xcrun xctrace record --template 'App Launch' --launch -- <app>`. The scripts
  rely on `tti_ms` as the startup proxy.

### 2. Bridge call latency

Two real public SDK calls exercised in tight loops (`benchmark.ts`):

- **void dispatch** - `Luciq.setUserAttribute(key, val)`: JS -> native, no
  return. Old arch serializes + enqueues on the bridge message queue; new arch
  is a direct synchronous JSI call. Measures call/enqueue overhead.
- **round trip** - `await Luciq.getUserAttribute(key)`: JS -> native -> JS
  Promise, awaited sequentially. Measures full request/response latency - the
  headline bridge-latency number.

Each metric runs `BENCHMARK_ITERATIONS` (default 2000) samples after a 200-call
warmup (pays lazy-init + JIT costs). Reported: avg, p50, p90, p99, min, max.
Timing uses `performance.now()` when available, else `Date.now()`.

### 3. Memory consumption

- **Android** - `adb shell dumpsys meminfo <pkg>` TOTAL PSS (KB), sampled while
  the app sits idle right after the benchmark completes.
- **iOS** - physical footprint (MB) of the app process via `footprint`
  (fallback `vmmap --summary`), same idle point. Stored in the `mem_pss_kb`
  column (unit differs per platform - see README).

## Controls

- **Cold start.** Android does `am force-stop` + `pm clear` before each launch.
  iOS does `simctl terminate` + relaunch. Autorun waits
  `BENCHMARK_AUTORUN_DELAY_MS` (3s) so the first frame settles before measuring.
- **Release builds only.** Dev bundles and the Metro server distort every
  metric. Android = `assembleRelease`; iOS = `-configuration Release`.
- **Same device, same run.** Run old-arch and new-arch back to back on the same
  physical device/simulator, same OS version, plugged in, no other heavy apps.
- **Sample size.** >= 5 cold-start runs per config (`RUNS`); `summarize.py`
  takes the median across runs to reject outliers. Increase for tighter CIs.
- **Warmup.** Latency loops discard the first 200 calls.
- **Identical JS.** The benchmark instrumentation is byte-identical across both
  branches (stamped via `git checkout <ref> -- <files>` in `ab-run.sh`), so any
  delta is attributable to the arch, not the harness.

## Caveats

- The JS module wrappers (`src/modules/Luciq.ts`) add a constant `Logger.debug`
  cost on both branches; it cancels in the A/B delta but inflates absolute
  latency vs a raw native call.
- Simulator memory/timing is indicative, not device-accurate. Prefer a physical
  device for headline numbers; simulator is fine for relative comparison.
- `dumpsys` PSS fluctuates; the median over runs is the stable figure.
- Sequential awaited round-trips measure per-call latency, not throughput.
  Batched/parallel throughput is a separate benchmark (not covered here).

## Reproducing

See `README.md` for the exact commands.
