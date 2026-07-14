# New Architecture Benchmark Harness

Measures the performance gain of the New Architecture migration (TurboModules /
JSI) over the Old Architecture (NativeModules) for `@luciq/react-native`:
**startup time, bridge call latency, memory consumption**.

Read `METHODOLOGY.md` for what each metric means and how it is controlled.

## Files

| File                    | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `set-arch.sh`           | Toggle the example app's New Arch flags (`on`/`off`)         |
| `run-android.sh`        | Build + install + cold-start N times on Android, scrape CSV  |
| `run-ios.sh`            | Same for the iOS simulator                                   |
| `ab-run.sh`             | Full A/B: dev (old) vs new-arch branch, both platforms       |
| `summarize.py`          | Aggregate `results.csv` -> old-vs-new table with % gains     |
| `results-template.csv`  | CSV schema (results are written to `results.csv`)            |

Harness code lives in the example app:
`examples/default/src/utils/benchmark.ts`, `benchmarkConfig.ts`,
`src/screens/BenchmarkScreen.tsx`, plus a TTI stamp in `index.js` and an
autorun hook in `src/App.tsx`.

## Quick start (automated A/B)

```bash
# Android emulator OR iOS simulator must be booted first.
# Run from the new-arch branch (harness must be committed here).
bash benchmark/ab-run.sh both 7      # 7 cold starts per config
python3 benchmark/summarize.py
```

`ab-run.sh` checks out `dev` (arch off) then `feat/new-arch-migration-library`
(arch on), stamps the harness onto each, builds release, runs, and appends to
`benchmark/results.csv`.

## Manual single-config run

```bash
# 1. Match the app arch flag to the checked-out SDK branch:
bash benchmark/set-arch.sh on        # new-arch branch  (or 'off' for dev)

# 2. iOS: pod install after toggling. Android: the script does a clean build.
(cd examples/default/ios && pod install)

# 3. Run (label is free-form; use old-arch / new-arch for summarize.py):
bash benchmark/run-android.sh new-arch 5
bash benchmark/run-ios.sh     new-arch 5
```

`--no-build` as the 3rd arg reuses the last build:
`bash benchmark/run-android.sh new-arch 5 --no-build`.

## Manual on-device run

Open the app -> **Benchmark** tab -> **Run benchmark**. Shows TTI + latency
stats on screen. `BENCHMARK_AUTORUN` in `benchmarkConfig.ts` (default `true`)
also runs it once per cold start and prints `[BENCH]` lines to the console.

## Output

`results.csv` columns:

```
label,platform,arch,run,tti_ms,launch_total_ms,mem_pss_kb,
void_avg_ms,void_p90_ms,rt_avg_ms,rt_p50_ms,rt_p90_ms,rt_p99_ms
```

- `mem_pss_kb`: Android = TOTAL PSS in **KB**; iOS = physical footprint in **MB**.
- `launch_total_ms`: Android only (`am start -W`).

`summarize.py` prints per-platform medians and the new-arch gain (positive =
faster / leaner).

## Requirements

- Android: `adb`, a booted emulator/device, JDK + Android SDK for `gradlew`.
- iOS: Xcode, a booted simulator, CocoaPods, `footprint`/`vmmap` (built in).
- `BENCHMARK_AUTORUN=true` (default) for the scripted runners.
- Clean git tree for `ab-run.sh`.
