#!/usr/bin/env python3
"""Aggregate benchmark/results.csv into an old-vs-new comparison with % gains.

Groups rows by (platform, label), takes the median across runs for each metric,
then reports the New Architecture gain relative to Old Architecture.

Usage: python3 benchmark/summarize.py [results.csv]
"""
import csv
import os
import statistics
import sys

METRICS = [
    ("tti_ms", "Startup / TTI (ms)", "lower"),
    ("launch_total_ms", "Cold start am-start (ms)", "lower"),
    ("mem_pss_kb", "Memory (Android KB / iOS MB)", "lower"),
    ("void_avg_ms", "Void dispatch avg (ms)", "lower"),
    ("rt_avg_ms", "Round trip avg (ms)", "lower"),
    ("rt_p90_ms", "Round trip p90 (ms)", "lower"),
    ("rt_p99_ms", "Round trip p99 (ms)", "lower"),
]


def median(values):
    nums = [float(v) for v in values if v not in ("", None)]
    return statistics.median(nums) if nums else None


def load(path):
    groups = {}
    with open(path) as fh:
        for row in csv.DictReader(fh):
            key = (row["platform"], row["label"])
            groups.setdefault(key, []).append(row)
    return groups


def gain(old, new):
    if old in (None, 0) or new is None:
        return None
    return (old - new) / old * 100.0


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "results.csv")
    if not os.path.exists(path):
        sys.exit(f"no results file: {path}")

    groups = load(path)
    platforms = sorted({p for p, _ in groups})

    for platform in platforms:
        old = groups.get((platform, "old-arch"))
        new = groups.get((platform, "new-arch"))
        print(f"\n=== {platform.upper()} (old-arch n={len(old or [])}, new-arch n={len(new or [])}) ===")
        if not old or not new:
            print("  need both old-arch and new-arch rows for this platform")
            continue
        print(f"  {'metric':<32}{'old':>12}{'new':>12}{'gain':>10}")
        for field, label, _ in METRICS:
            o = median([r[field] for r in old])
            n = median([r[field] for r in new])
            if o is None and n is None:
                continue
            g = gain(o, n)
            gs = f"{g:+.1f}%" if g is not None else "n/a"
            os_ = f"{o:.3f}" if o is not None else "-"
            ns_ = f"{n:.3f}" if n is not None else "-"
            print(f"  {label:<32}{os_:>12}{ns_:>12}{gs:>10}")
    print("\n(gain = reduction vs old arch; positive = new arch is faster/leaner)")


if __name__ == "__main__":
    main()
