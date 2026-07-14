#!/usr/bin/env bash
# Toggle the example app's New Architecture flags to match the SDK branch
# under test. Old-arch SDK (dev) must run with new arch OFF; new-arch SDK
# (feat/new-arch-migration-library) with new arch ON. Otherwise the RN interop
# layer masks the very difference we are measuring.
#
# Usage: set-arch.sh <on|off>
set -euo pipefail

MODE="${1:-}"
if [[ "$MODE" != "on" && "$MODE" != "off" ]]; then
  echo "usage: $0 <on|off>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/examples/default"
GRADLE_PROPS="$APP/android/gradle.properties"
PODFILE="$APP/ios/Podfile"

if [[ "$MODE" == "on" ]]; then
  ANDROID_VAL="true"
  IOS_VAL="1"
else
  ANDROID_VAL="false"
  IOS_VAL="0"
fi

# Android: newArchEnabled=<bool>
if grep -q '^newArchEnabled=' "$GRADLE_PROPS"; then
  sed -i.bak "s/^newArchEnabled=.*/newArchEnabled=$ANDROID_VAL/" "$GRADLE_PROPS" && rm -f "$GRADLE_PROPS.bak"
else
  echo "newArchEnabled=$ANDROID_VAL" >> "$GRADLE_PROPS"
fi

# iOS: ENV['RCT_NEW_ARCH_ENABLED'] = '<0|1>'
sed -i.bak "s/ENV\['RCT_NEW_ARCH_ENABLED'\] = '.*'/ENV['RCT_NEW_ARCH_ENABLED'] = '$IOS_VAL'/" "$PODFILE" && rm -f "$PODFILE.bak"

echo "New Architecture set to: $MODE (android newArchEnabled=$ANDROID_VAL, ios RCT_NEW_ARCH_ENABLED=$IOS_VAL)"
echo "Reminder: run 'pod install' (ios) / clean gradle build (android) after toggling."
