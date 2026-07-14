#!/usr/bin/env bash
# End-to-end A/B benchmark: Old Architecture (dev branch, NativeModules, new
# arch OFF) vs New Architecture (feat/new-arch-migration-library, TurboModules,
# new arch ON).
#
# The example app consumes the SDK from source (package.json
# "react-native": "src/index.ts"), so checking out a branch swaps both the JS
# and the native SDK. This script stamps the (additive) benchmark harness onto
# whichever branch is checked out via `git checkout <ref> -- <files>`, flips the
# app's arch flags to match, builds, and runs.
#
# Prerequisites:
#   - clean git working tree
#   - harness committed on HARNESS_REF (default: current branch)
#   - android: booted emulator/device ; ios: booted simulator
#
# Usage: ab-run.sh <android|ios|both> [runs]
set -euo pipefail

PLATFORM="${1:?usage: ab-run.sh <android|ios|both> [runs]}"
RUNS="${2:-5}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OLD_BRANCH="dev"
NEW_BRANCH="feat/new-arch-migration-library"
HARNESS_REF="$(git rev-parse --abbrev-ref HEAD)"
START_BRANCH="$HARNESS_REF"

HARNESS_FILES=(
  examples/default/index.js
  examples/default/src/App.tsx
  examples/default/src/navigation/RootTab.tsx
  examples/default/src/screens/BenchmarkScreen.tsx
  examples/default/src/utils/benchmark.ts
  examples/default/src/utils/benchmarkConfig.ts
)
# Files set-arch.sh mutates - restored to branch state after each config.
ARCH_FILES=(examples/default/android/gradle.properties examples/default/ios/Podfile)

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "working tree is dirty; commit or stash first" >&2
  exit 1
fi

restore() {
  git checkout -- "${HARNESS_FILES[@]}" "${ARCH_FILES[@]}" 2>/dev/null || true
  git clean -fq -- "${HARNESS_FILES[@]}" 2>/dev/null || true
  git checkout "$START_BRANCH"
}
trap restore EXIT

run_platform() {
  local label="$1"
  if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    bash "$ROOT/benchmark/run-android.sh" "$label" "$RUNS"
  fi
  if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    bash "$ROOT/benchmark/run-ios.sh" "$label" "$RUNS"
  fi
}

do_config() {
  local branch="$1" arch="$2" label="$3"
  echo "==================================================================="
  echo ">> CONFIG: $label  (branch=$branch, newArch=$arch)"
  echo "==================================================================="
  git checkout "$branch"
  # Stamp the harness (additive; the 3 tracked files are identical across
  # dev/new-arch so this introduces only the benchmark instrumentation).
  git checkout "$HARNESS_REF" -- "${HARNESS_FILES[@]}"
  bash "$ROOT/benchmark/set-arch.sh" "$arch"
  ( cd "$ROOT/examples/default" && yarn install --frozen-lockfile >/dev/null 2>&1 || yarn install )
  run_platform "$label"
  # Reset this config's edits before the next checkout.
  git checkout -- "${HARNESS_FILES[@]}" "${ARCH_FILES[@]}" 2>/dev/null || true
  git clean -fq -- "${HARNESS_FILES[@]}" 2>/dev/null || true
}

do_config "$OLD_BRANCH" off old-arch
do_config "$NEW_BRANCH" on  new-arch

echo ">> A/B complete. Summarize with: python3 benchmark/summarize.py"
