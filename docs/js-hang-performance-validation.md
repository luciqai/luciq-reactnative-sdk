# JS Hang Performance Validation

Risk inventory (Hermes sampling tradeoffs, what is mitigated vs open):
[`js-hang-risks.md`](./js-hang-risks.md).

JS hang monitoring remains disabled by default until release builds satisfy these
budgets on a representative low-end Android device and the oldest supported iPhone.

## Acceptance budgets

- Monitoring idle CPU: less than 0.25 percentage points above baseline.
- Monitoring wakeups: no more than two native wakeups per second while active and
  zero while backgrounded.
- JS queue work: one outstanding probe maximum; no queued-probe growth during a hang.
- Idle allocations: no per-tick stack or JSON allocation.
- Sampling: bounded to one short diagnostic window per hang and always stopped on
  timeout, recovery, background, disable, or invalidation.
- Profile disk size: at most 1 MiB and deleted after parsing or rejection.
- Serialized report: at most 64 KiB.
- Memory: less than 2 MiB transient increase while parsing a maximum-size profile.
- Startup: less than 1 ms synchronous JS work when disabled.

## Scenarios

Measure each scenario with monitoring disabled and enabled:

1. Five minutes active and idle.
2. Five minutes of navigation, timers, networking, and animations without a hang.
3. A stall below the configured threshold.
4. A recovered stall just above the threshold.
5. A 20-second stall.
6. A permanent stall followed by process termination.
7. Background/foreground transitions during monitoring and during sampling.
8. React bridge reload, Fast Refresh, and native module invalidation.

For each run, record CPU, wakeups, allocations, peak memory, bridge calls, profile
bytes, payload bytes, report count, measured duration, stack-capture mode, and the
top symbolicated frame.

## Rollout gate

Enable only through the native remote feature flag with a kill switch and per-session
rate limit. Start with internal builds, then a small production cohort. Roll back on
budget regression, profiler ownership conflict, report storms, or false positives
caused by lifecycle/debugger transitions.
