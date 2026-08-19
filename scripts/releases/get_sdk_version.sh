#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/../.." && pwd)

# "version": "xx.x.x+x", -> xx.x.x
sdk_version=$(grep -m1 -E '"version"[[:space:]]*:' "$repo_root/package.json" |
  cut -f2 -d':' | tr -d '" ,' | cut -f1 -d'+')

echo "$sdk_version"
