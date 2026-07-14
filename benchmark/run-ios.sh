#!/usr/bin/env bash
# iOS (simulator) bridge/startup/memory benchmark runner.
#
# Builds a Release .app of the example app on the CURRENT git branch + current
# arch flags, installs it on the booted simulator, then cold-starts it N times.
# Per run it captures:
#   - tti_ms      : JS time-to-interactive from the [BENCH] marker (startup proxy)
#   - void_/rt_ * : bridge latency stats from the [BENCH] marker
#   - mem_mb      : physical footprint of the app process (footprint/vmmap)
#
# simctl has no reliable cold-start wall-clock metric, so startup is measured
# via the JS TTI marker (where the arch difference lives). For full launch
# timing use the "App Launch" Instruments template (see METHODOLOGY.md).
#
# Results are appended to results.csv. Requires: xcrun, a booted simulator,
# BENCHMARK_AUTORUN=true in benchmarkConfig.ts.
#
# Usage: run-ios.sh <label> [runs] [--no-build]
set -euo pipefail

LABEL="${1:?usage: run-ios.sh <label> [runs] [--no-build]}"
RUNS="${2:-5}"
NO_BUILD="${3:-}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/examples/default"
APP_BUNDLE="$APP/ios/build/Build/Products/Release-iphonesimulator/LuciqExample.app"
CSV="$ROOT/benchmark/results.csv"
HEADER="label,platform,arch,run,tti_ms,launch_total_ms,mem_pss_kb,void_avg_ms,void_p90_ms,rt_avg_ms,rt_p50_ms,rt_p90_ms,rt_p99_ms"

command -v xcrun >/dev/null || { echo "xcrun not found" >&2; exit 1; }
xcrun simctl list devices | grep -q '(Booted)' || { echo "no booted simulator; run: xcrun simctl boot <udid>" >&2; exit 1; }

if [[ ! -f "$CSV" ]]; then echo "$HEADER" > "$CSV"; fi

if [[ "$NO_BUILD" != "--no-build" ]]; then
  echo ">> pod install ..."
  ( cd "$APP/ios" && RCT_NEW_ARCH_ENABLED="$(grep -oE "RCT_NEW_ARCH_ENABLED'\] = '[01]'" Podfile | grep -oE "[01]'" | tr -d "'")" pod install )
  echo ">> Building Release .app on branch $(git -C "$ROOT" rev-parse --abbrev-ref HEAD) ..."
  ( cd "$APP/ios" && xcrun xcodebuild \
      -scheme LuciqExample -workspace LuciqExample.xcworkspace \
      -configuration Release -sdk iphonesimulator \
      -destination 'generic/platform=iOS Simulator' \
      -derivedDataPath build build )
fi

[[ -d "$APP_BUNDLE" ]] || { echo "app bundle not found: $APP_BUNDLE" >&2; exit 1; }

BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP_BUNDLE/Info.plist")"
echo ">> Bundle id: $BUNDLE_ID"
echo ">> Installing app ..."
xcrun simctl install booted "$APP_BUNDLE"

bench_val() { grep -oE "\[BENCH\] $1=[^ ]+" "$2" | tail -n1 | cut -d= -f2 | tr -d '\r'; }

# Physical footprint (MB) of the running app process on the sim host. The
# installed app runs from the simulator container (…/LuciqExample.app/LuciqExample),
# not the derived-data bundle, so match on the generic installed path.
app_mem_mb() {
  local pid
  pid="$(pgrep -f 'LuciqExample.app/LuciqExample' | head -n1 || true)"
  [[ -n "$pid" ]] || { echo ""; return; }
  if command -v footprint >/dev/null 2>&1; then
    footprint -- "$pid" 2>/dev/null | grep -iE 'phys_footprint|Physical footprint' | grep -oE '[0-9.]+ *MB' | head -n1 | grep -oE '[0-9.]+'
  else
    vmmap --summary "$pid" 2>/dev/null | grep -i 'Physical footprint:' | head -n1 | grep -oE '[0-9.]+' | head -n1
  fi
}

for ((i=1; i<=RUNS; i++)); do
  echo ">> Run $i/$RUNS"
  xcrun simctl terminate booted "$BUNDLE_ID" >/dev/null 2>&1 || true
  sleep 1

  LOG="$(mktemp)"
  # Stream console (console.log) to LOG in the background.
  xcrun simctl launch --console-pty booted "$BUNDLE_ID" > "$LOG" 2>&1 &
  LAUNCH_PID=$!

  for ((t=0; t<90; t++)); do
    sleep 2
    if grep -q '\[BENCH\] done=1' "$LOG"; then break; fi
  done
  if ! grep -q '\[BENCH\] done=1' "$LOG"; then
    echo "   WARNING: benchmark did not complete within timeout (run $i)" >&2
  fi

  MEM_MB="$(app_mem_mb)"
  kill "$LAUNCH_PID" >/dev/null 2>&1 || true

  ARCH="$(bench_val arch "$LOG")"
  TTI="$(bench_val tti_ms "$LOG")"
  VOID_AVG="$(bench_val void_avg_ms "$LOG")"
  VOID_P90="$(bench_val void_p90_ms "$LOG")"
  RT_AVG="$(bench_val rt_avg_ms "$LOG")"
  RT_P50="$(bench_val rt_p50_ms "$LOG")"
  RT_P90="$(bench_val rt_p90_ms "$LOG")"
  RT_P99="$(bench_val rt_p99_ms "$LOG")"
  rm -f "$LOG"

  # mem stored in the mem_pss_kb column as MB for iOS (see METHODOLOGY.md).
  echo "$LABEL,ios,${ARCH:-?},$i,${TTI:-},,${MEM_MB:-},${VOID_AVG:-},${VOID_P90:-},${RT_AVG:-},${RT_P50:-},${RT_P90:-},${RT_P99:-}" >> "$CSV"
  echo "   tti=${TTI}ms mem=${MEM_MB}MB rt_avg=${RT_AVG}ms void_avg=${VOID_AVG}ms"
done

echo ">> Done. Rows appended to $CSV"
