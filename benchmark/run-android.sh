#!/usr/bin/env bash
# Android bridge/startup/memory benchmark runner.
#
# Builds a release APK of the example app on the CURRENT git branch + current
# arch flags, installs it, then cold-starts it N times. Per run it captures:
#   - launch_total_ms : `am start -W` TotalTime (full cold start, OS metric)
#   - tti_ms          : JS time-to-interactive from the [BENCH] marker
#   - void_/rt_ *     : bridge latency stats from the [BENCH] marker
#   - mem_pss_kb      : TOTAL PSS from dumpsys meminfo (post-benchmark, idle)
#
# Results are appended to results.csv. Requires: adb, a booted emulator/device,
# BENCHMARK_AUTORUN=true in benchmarkConfig.ts.
#
# Usage: run-android.sh <label> [runs] [--no-build]
#   label    e.g. old-arch | new-arch  (free-form tag written to the CSV)
#   runs     number of cold starts (default 5)
set -euo pipefail

LABEL="${1:?usage: run-android.sh <label> [runs] [--no-build]}"
RUNS="${2:-5}"
NO_BUILD="${3:-}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/examples/default"
PKG="ai.luciq.react.example"
APK="$APP/android/app/build/outputs/apk/release/app-release.apk"
CSV="$ROOT/benchmark/results.csv"
HEADER="label,platform,arch,run,tti_ms,launch_total_ms,mem_pss_kb,void_avg_ms,void_p90_ms,rt_avg_ms,rt_p50_ms,rt_p90_ms,rt_p99_ms"

command -v adb >/dev/null || { echo "adb not found" >&2; exit 1; }
adb get-state >/dev/null 2>&1 || { echo "no android device/emulator connected" >&2; exit 1; }

if [[ ! -f "$CSV" ]]; then echo "$HEADER" > "$CSV"; fi

if [[ "$NO_BUILD" != "--no-build" ]]; then
  echo ">> Building release APK on branch $(git -C "$ROOT" rev-parse --abbrev-ref HEAD) ..."
  ( cd "$APP/android" && ./gradlew clean assembleRelease )
fi

[[ -f "$APK" ]] || { echo "APK not found: $APK" >&2; exit 1; }

echo ">> Installing APK ..."
adb install -r "$APK" >/dev/null

# Resolve the launchable component (e.g. ai.luciq.react.example/.MainActivity).
COMPONENT="$(adb shell cmd package resolve-activity --brief "$PKG" 2>/dev/null | tail -n1 | tr -d '\r')"
[[ -n "$COMPONENT" ]] || COMPONENT="$PKG/.MainActivity"
echo ">> Launch component: $COMPONENT"

# grep the last value of a [BENCH] key from a logcat dump ($1=key, $2=file)
bench_val() { grep -oE "\[BENCH\] $1=[^ ]+" "$2" | tail -n1 | cut -d= -f2 | tr -d '\r'; }

for ((i=1; i<=RUNS; i++)); do
  echo ">> Run $i/$RUNS"
  adb shell am force-stop "$PKG"
  adb shell pm clear "$PKG" >/dev/null   # cold start: wipe warm caches/state
  adb logcat -c

  LAUNCH_OUT="$(adb shell am start -W -n "$COMPONENT")"
  LAUNCH_TOTAL="$(echo "$LAUNCH_OUT" | grep -E 'TotalTime:' | grep -oE '[0-9]+' | head -n1)"

  # Wait for the benchmark to finish (autorun prints [BENCH] done=1).
  LOG="$(mktemp)"
  for ((t=0; t<90; t++)); do
    sleep 2
    adb logcat -d > "$LOG"
    if grep -q '\[BENCH\] done=1' "$LOG"; then break; fi
  done

  if ! grep -q '\[BENCH\] done=1' "$LOG"; then
    echo "   WARNING: benchmark did not complete within timeout (run $i)" >&2
  fi

  # Sample memory while the app sits idle post-benchmark.
  MEM_PSS="$(adb shell dumpsys meminfo "$PKG" 2>/dev/null | grep -E '^\s*TOTAL(\s+PSS)?[: ]' | grep -oE '[0-9]+' | head -n1)"

  ARCH="$(bench_val arch "$LOG")"
  TTI="$(bench_val tti_ms "$LOG")"
  VOID_AVG="$(bench_val void_avg_ms "$LOG")"
  VOID_P90="$(bench_val void_p90_ms "$LOG")"
  RT_AVG="$(bench_val rt_avg_ms "$LOG")"
  RT_P50="$(bench_val rt_p50_ms "$LOG")"
  RT_P90="$(bench_val rt_p90_ms "$LOG")"
  RT_P99="$(bench_val rt_p99_ms "$LOG")"
  rm -f "$LOG"

  echo "$LABEL,android,${ARCH:-?},$i,${TTI:-},${LAUNCH_TOTAL:-},${MEM_PSS:-},${VOID_AVG:-},${VOID_P90:-},${RT_AVG:-},${RT_P50:-},${RT_P90:-},${RT_P99:-}" >> "$CSV"
  echo "   launch=${LAUNCH_TOTAL}ms tti=${TTI}ms pss=${MEM_PSS}KB rt_avg=${RT_AVG}ms void_avg=${VOID_AVG}ms"
done

echo ">> Done. Rows appended to $CSV"
