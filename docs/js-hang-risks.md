# JS Hang Detection - Risks and Tradeoffs

Status of risks in the current RN SDK implementation. Companion docs:
[`js-hang-performance-validation.md`](./js-hang-performance-validation.md)
(acceptance budgets) and [`js-hang-app-hang-spi.md`](./js-hang-app-hang-spi.md)
(native App Hang SPI).

Legend:

- **Mitigated** - fixed or fail-closed in code for default production builds.
- **Partial** - bounded or opt-in only; residual risk remains when enabled.
- **Open** - known and not fixed; must stay in the rollout gate.

---

## 1. Feature layers

| Layer | Default behavior | Purpose |
| ----- | ---------------- | ------- |
| Watchdog (ping/pong) | Off until `jsHangDetection.enabled` / `setJSHangEnabled(true)` | Detect JS event-loop stalls >= 3 s |
| Disk marker | Written only while a hang is in progress | Report hangs the process never recovered from |
| Hermes sampling | **Off** unless host opts into exclusive ownership | Attribute a culprit JS stack |
| Report sink | Non-fatal `JSThreadHang` (temporary) | Dashboard validation until native hang SPI ships |

Most production risk of the full design lives in Hermes sampling. Default builds
still take watchdog + marker + duration-only report risk, which is much smaller.

---

## 2. Hermes sampling - risks and tradeoffs

Hermes exposes a **process-global** sampling profiler (`enable` / `disable` /
`dumpSampledTraceToFile`) with **no ownership token** and **no current-owner
query**. Starting it mid-hang is the only practical way to get a JS culprit
stack without instrumenting the app. That design forces every risk below.

### 2.1 Process-global ownership conflict

| | |
| --- | --- |
| **Risk** | Another owner (RN diagnostics, Flipper, another SDK, future RN tooling) may already be sampling, or may start while we are sampling. `disable()` then stops *their* profiler, or our dump mixes with theirs. |
| **Tradeoff** | Correct stacks require exclusive ownership. Without a Hermes API for ownership, we cannot safely sample in multi-owner processes. |
| **Status** | **Mitigated for default builds** - fail closed. iOS requires `LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP=1`; Android requires manifest `ai.luciq.reactnative.JSHangHermesProfilerExclusiveOwnership=true`. Without the switch, capability is `unavailable_process_global_ownership` and reports are duration-only. |
| **Residual** | **Open when opt-in is set.** The flag is a host promise, not a runtime lock. A second owner can still conflict; we cannot detect it. |

### 2.2 CPU / battery cost while sampling

| | |
| --- | --- |
| **Risk** | Hermes sampling walks JS stacks on a timer. Cost scales with sample rate and hang length. On low-end devices this can worsen an already hung app (CPU, thermal, battery). |
| **Tradeoff** | Longer windows improve stack confidence; shorter windows reduce cost and post-recovery contamination. |
| **Status** | **Partial.** Sampling starts only after the hang threshold (3 s), not continuously. Windows are capped (~1 s iOS, ~750 ms Android). Stopped on timeout, recovery, background, disable, and invalidation. Idle watchdog does not sample. |
| **Residual** | **Open.** Budgets in `js-hang-performance-validation.md` are acceptance criteria, not yet proven as a release gate. Cost during an active hang is intentional but unquantified on the target device matrix. |

### 2.3 Sampling never stops (leaky / broken disable)

| | |
| --- | --- |
| **Risk** | RN's Android JNI registration wires the Java `disable()` binding to native `enable()` (`HermesSamplingProfiler.cpp`). Calling disable re-arms sampling, which then runs until process death. Verified in the shipped sources of every release tag: all 136 releases from 0.70.0 through 0.85.3 are broken; fixed only in 0.86.0+, never backported. |
| **Tradeoff** | Skip stacks below 0.86 (safe, duration-only) vs shipping an SDK-owned JNI shim that calls `HermesRuntime::disableSamplingProfiler` directly (works on all versions, adds a native build step). |
| **Status** | **Mitigated.** Android stops sampling through the SDK-owned JNI shim (`libluciq-rn-jshang.so`, `android/src/main/cpp/`): `dlopen("libhermes.so", RTLD_NOLOAD)` plus `dlsym` of `HermesRuntime::disableSamplingProfiler` - an arg-less static whose mangled name is stable across Hermes releases and exported on all four ABIs. RN's broken Java `disable()` binding is never called. When the symbol cannot be resolved (JSC app, Hermes not loaded yet) the profiler fails closed (`unavailable_native_disable_shim`) and hangs stay duration-only. iOS is unaffected (calls Hermes C++ APIs directly). |
| **Residual** | The shim compiles from source via CMake in the consumer build (requires NDK, standard for RN libraries with C++). The prebuilt-Maven-AAR delivery from the original plan remains an option if source builds prove problematic. Mangled-symbol pinning is validated against shipped `libhermes.so` per RN release. |

### 2.4 Wrong culprit (post-recovery / non-hang samples)

| | |
| --- | --- |
| **Risk** | Trace timestamps are relative to an engine-private clock. Samples taken after the JS thread recovers can dominate the modal leaf and blame innocent post-hang work. |
| **Tradeoff** | Parse the full dump (simpler, more false attribution) vs filter to a recovery-relative window (more code, still approximate). |
| **Status** | **Partial.** On recovery, parsers keep only samples within `sampleWindow` from the earliest sample (relative filter). Mid-hang dump-before-death paths keep the full window. Modal leaf + parent walk is used instead of a single snapshot. |
| **Residual** | **Open.** Relative windows cannot map to wall clock. Short hangs may yield few samples. Modal leaf is a heuristic, not a proof of the blocking call. |

### 2.5 Disk / memory / parse cost of `.cpuprofile`

| | |
| --- | --- |
| **Risk** | Hermes can dump large JSON. Parsing on the report path can spike memory and block a worker; leftover files waste disk; corrupt dumps can throw. |
| **Tradeoff** | Richer stacks need more of the dump; hard caps reduce fidelity. |
| **Status** | **Mitigated (bounds).** Max profile file 1 MiB (delete/reject oversize). Max 512 samples inspected. Max 64 emitted frames / parent-walk caps. Strings truncated to 512. Trace deleted after parse or on abort. Intermediates cleared on start/abort/previous-process cleanup. Report work is off the watchdog tick (separate queue / executor). |
| **Residual** | **Partial.** Peak memory while parsing a max-size profile is budgeted (< 2 MiB) but not validated as a release gate. iOS previous-process leftover reparse still touches disk on next launch. |

### 2.6 Profiler enable/disable races and lifecycle

| | |
| --- | --- |
| **Risk** | Backgrounding, bridge reload, module `invalidate`, or a second hang while dumping can leave the profiler enabled, double-disable, or report with a stale path. |
| **Tradeoff** | Aggressive abort loses stacks; delayed abort risks ownership leaks. |
| **Status** | **Partial.** Abort/stop on background, disable, invalidation, generation bump, and failed enable (with cleanup disable). Android finish-profiler runnable is removed on suspend/stop. iOS uses a profiler generation + max window `dispatch_after`. |
| **Residual** | **Open under concurrent host ownership** (same as 2.1). Bridgeless / new architecture paths do not enable iOS detection at all (see 3.4), so profiler lifecycle there is untested. |

### 2.7 JSC / missing Hermes / header availability

| | |
| --- | --- |
| **Risk** | Apps on JSC, or builds without Hermes headers / Java binding, crash if we call profiler APIs unconditionally. |
| **Status** | **Mitigated.** iOS compile-time `__has_include(<hermes/hermes.h>)`. Android reflection + `ClassNotFoundException` / link errors mark `unavailable` and degrade to duration-only. Capability string is attached to the report. |

### 2.8 Symbolication fidelity of sampled frames

| | |
| --- | --- |
| **Risk** | Hermes frame names are `"func(file:line:col)"` or bytecode `funcVirtAddr` shapes. Wrong mapping produces unsymbolicated or wrong frames. Release hermesc bundles need the composed source map path (`line 1`, column = virtual address). |
| **Status** | **Partial.** Parser mirrors Hermes error-stack shapes for source and bytecode frames. Bundle basename (not container UUID path) is used for backend recognition. |
| **Residual** | **Open.** Backend sourcemap keying for `appVariant` / CodePush label still incomplete (see SPI doc section 7). Untested across Hermes versions. |

### 2.9 Summary - Hermes sampling

| Risk | Default build | With exclusive-ownership opt-in |
| ---- | ------------- | -------------------------------- |
| Ownership conflict | Mitigated (fail closed) | Open (host promise only) |
| CPU while sampling | N/A (no sampling) | Partial (short window; budgets unproven) |
| Leaky disable (RN 0.75) | Mitigated | Open if leaky metadata enabled |
| Wrong culprit | N/A | Partial (window filter + modal leaf) |
| Disk / parse bounds | Mitigated if somehow invoked | Mitigated |
| Lifecycle abort | N/A | Partial |
| JSC / no Hermes | Mitigated | Mitigated |
| Symbolication | N/A | Partial / open backend keys |

**Product implication:** default opt-in hang detection is duration-only. Stack
attribution is a separate, host-guaranteed capability with known residual risk.
Do not treat exclusive-ownership as safe for arbitrary production apps.

---

## 3. Watchdog detection risks (no Hermes)

These apply even when sampling is off.

### 3.1 Idle CPU and wakeups

| | |
| --- | --- |
| **Risk** | A 500 ms timer + JS-queue probe adds wakeups and tiny JS work forever while the app is active. |
| **Status** | **Partial by design.** At most one outstanding probe; timer suspended in background (iOS) / host pause (Android); utility/background thread priority; no per-tick JSON. Budgets: < 0.25 pp idle CPU, <= 2 wakeups/s active, 0 backgrounded. |
| **Residual** | **Open until measured** on low-end Android and oldest supported iPhone (`js-hang-performance-validation.md`). |

### 3.2 False positives (debugger, Metro, lifecycle)

| | |
| --- | --- |
| **Risk** | Breakpoints, Fast Refresh, bridge reload, and background freeze look like hangs. |
| **Status** | **Mitigated.** Skip debuggable builds / debugger attached; iOS skips `RCT_DEV`. Reset generation and require a fresh pong after resume. Clear in-flight hang state on background. Stop on crash-reporting disable and native module invalidation. |
| **Residual** | **Partial.** Edge cases around activity loss without pause, or long main-thread stalls that delay lifecycle delivery, can still misclassify. |

### 3.3 False negatives / duration accuracy

| | |
| --- | --- |
| **Risk** | 500 ms ping granularity; hang start is approximated from last pong. Sub-threshold stalls are invisible. |
| **Status** | Accepted tradeoff. Threshold fixed at 3 s to match native App Hangs. Duration is approximate by construction. |

### 3.4 Bridgeless / New Architecture (iOS)

| | |
| --- | --- |
| **Risk** | `RCTBridgeProxy` has no verified public JS-queue dispatch contract. |
| **Status** | **Mitigated by capability gate.** iOS refuses to start without classic `RCTBridge` + `dispatchBlock:queue:`. No detection rather than unsafe probing. |
| **Residual** | **Open.** Bridgeless apps get no JS hang detection on iOS until a supported dispatch API exists. Android uses `runOnJSQueueThread`, which may behave differently under bridgeless - matrix still required. |

### 3.5 Probe storms / queue growth during a hang

| | |
| --- | --- |
| **Risk** | Posting a new probe every tick while JS is blocked could flood the JS queue. |
| **Status** | **Mitigated.** At most one outstanding probe; next probe only after pong or generation reset. |

---

## 4. Disk marker (unrecovered hangs)

| Risk | Status | Notes |
| ---- | ------ | ----- |
| Marker proves hang *caused* death | **Mitigated in semantics** | Marker means observation was interrupted, not causality. Attributes use `previous_process_ended_during_hang` / previous-session wording; must not be labeled fatal without native evidence. |
| Stale / corrupt marker false report | **Partial** | Schema, age (24 h), size caps, session id mismatch. Clock skew and tampering in sandbox are residual. |
| Marker I/O on hang path | **Partial** | Small JSON; refresh every 5 s while hanging. Android may embed frames JSON (larger). Not free on a dying process. |
| Duplicate consume across reloads | **Mitigated** | Consume deletes before validate/report. |

---

## 5. Reporting / product risks

| Risk | Status | Notes |
| ---- | ------ | ----- |
| Misclassified as crash / non-fatal | **Open (temporary)** | Deliberate non-fatal PoC transport until native App Hang SPI ships. Affects dashboard placement and crash-free metrics. |
| Report storms | **Partial** | Bounded pending report queue (8). No remote rate limit or kill switch in RN layer yet (called out in validation doc). |
| PII in stacks / attributes | **Partial** | Frames can include file paths and method names from app code. Attribute values length-bounded. Same class of risk as handled JS crashes. |
| Overlap with native main-thread hang | **Open (by design)** | Both can fire for the same user-visible freeze (e.g. sync TurboModule on a blocked main thread). Correlation is a native SPI concern, not implemented here. |

---

## 6. What is fixed vs not - checklist

### Addressed in code (safe default / fail-closed)

- Hang detection and Hermes sampling both **opt-in**; sampling has a **second** exclusive-ownership gate.
- No continuous Hermes sampling; only mid-hang, short window, always aborted on lifecycle edges.
- RN 0.75 Android broken `disable` binding blocked unless explicit leaky opt-in.
- JSC / missing Hermes degrade to duration-only without crashing.
- One outstanding JS probe; background/debugger/dev guards; generation reset on resume.
- Profile size, sample count, frame count, string length bounds; delete intermediates.
- Marker does not claim the hang killed the process.
- iOS classic-bridge-only capability gate (no blind bridgeless probing).

### Addressed only when host opts into exclusive ownership (still residual)

- Culprit stacks via Hermes (ownership is a promise, not a lock).
- Relative sample-window filtering and modal-leaf attribution (heuristic).
- Mid-hang frames persisted into Android marker for next-launch reports.

### Not fixed / must stay on the rollout gate

- Measured proof of idle and sampling **performance budgets** on target devices.
- Safe sampling in processes with **any other** Hermes profiler owner.
- Unknown Hermes / RN binding bugs beyond the 0.75 special case.
- **Bridgeless iOS** detection support.
- Full **runtime matrix** (Hermes versions, JSC, bridgeless Android behavior).
- Native **App Hang SPI** (reports still non-fatal).
- Remote **feature flag / kill switch / per-session rate limit**.
- Backend **sourcemap** keys for app variant and CodePush label completeness.
- Dedup / correlation with native main-thread App Hangs.

---

## 7. Recommended posture

1. Ship (or dogfood) **duration-only** hang detection behind the existing enable flag once idle budgets are measured.
2. Treat Hermes stacks as a **separate production decision**: only hosts that can guarantee exclusive profiler ownership, and only after sampling budgets pass.
3. Keep exclusive-ownership and leaky-disable metadata **off** in the published SDK example defaults for production templates; validation apps may enable them locally.
4. Do not enable sampling by default in the SDK init path even after ownership APIs improve - keep it capability-gated.
