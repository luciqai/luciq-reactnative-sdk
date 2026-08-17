# Reporting React Native JS Thread Hangs as App Hangs - Native SDK Spec

Audience: Luciq native iOS / Android SDK teams.
Status: proof of concept. Detection and Hermes attribution are being hardened and
must remain opt-in until profiler ownership, cleanup, payload bounds, and runtime
compatibility are validated. Reports currently flow through the **non-fatal**
pipeline as a stopgap; this document specifies the SPI required for an **App Hang**.

---

## 1. The model: what a JS hang is, from a JS perspective

A native App Hang report (e.g. Crash #890) says:

```
# Cause: The app's main thread was unresponsive for more than 3000 milliseconds
Thread 0 Queue 1: com.apple.main-thread (serial) [Crashed]:
0  libsystem_kernel.dylib  _kevent_id
...
```

The JS-thread equivalent the RN SDK detects is the same event one level up the stack:
the **JS event loop** (thread `com.facebook.react.runtime.JavaScript` on iOS, the
ReactQueue/JS message queue thread on Android) stops servicing work for more than
3000 ms. The UI may keep scrolling, but every touch handler, timer, state update,
and network callback is frozen - to the user the app is hung.

The report should therefore read the same way, with JS frames instead of native ones:

```
# Cause: The app's JS thread was unresponsive for more than 3000 milliseconds
JS Thread (com.facebook.react.runtime.JavaScript) [Hanged]:
0  luciqFinalHangCheck             App.tsx:143            <- after sourcemap symbolication
1  anonymous                       JSTimers.js:213
2  _callTimer                      JSTimers.js:111
3  callTimers                      JSTimers.js:359
4  __callFunction                  MessageQueue.js:...
...
```

## 2. RN SDK implementation contract

| Stage             | iOS                                                                                                                                 | Android                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Detection         | `LuciqJSHangWatchdog`: utility-queue watchdog with at most one outstanding classic-bridge JS probe                                  | `RNJSHangWatchdog`: HandlerThread with at most one outstanding React JS queue probe                                |
| Threshold         | 3000 ms (matches native App Hangs)                                                                                                  | 3000 ms                                                                                                            |
| Culprit stack     | Hermes sampling profiler enabled mid-hang, trace dumped on recovery, modal (most-sampled) stack extracted                           | Same, via `com.facebook.hermes.instrumentation.HermesSamplingProfiler` (reflection; JSC degrades to duration-only) |
| Unrecovered hangs | Versioned marker records that the previous process ended while a hang was observed; this does not prove the hang caused termination | Same (`RNJSHangMarkerStore`)                                                                                       |
| Guards            | Never in dev builds, never with a debugger attached, timer fully suspended in background                                            | Never in debuggable builds, paused on host pause                                                                   |
| Current sink      | `LCQCrashReporting cp_reportNonFatalCrashWithStackTrace:level:groupingString:userAttributes:`                                       | `ai.luciq.crash.CrashReporting.reportException(JSONObject, boolean, Map, JSONObject fingerprint, Level)`           |

## 3. The data the RN SDK hands to native (exact shapes)

### 3.1 Stack trace object

Identical to the `CrashData` JSON the JS layer sends for handled crashes
(`sendHandledJSCrash`), so it is already familiar to both native ingestion paths:

```json
{
  "message":   "JSThreadHang - JS thread hang: event loop blocked for ~6324 ms",
  "e_name":    "JSThreadHang",
  "e_message": "JS thread hang: event loop blocked for ~6324 ms",
  "os":        "ios",                      // or "android"
  "platform":  "react_native",
  "exception": [ <frame>, <frame>, ... ]   // leaf-first: culprit at index 0
}
```

### 3.2 Frame shape

Each frame is exactly what `stacktrace-parser` produces for a Hermes bytecode error
stack (`at foo (address at <bundle>:1:<virtualAddress>)`), which is what handled JS
crashes already carry - validated by byte-identical addresses between a hang report
and a handled-error report from the same build:

```json
{
  "methodName": "luciqFinalHangCheck", // "anonymous" when unnamed
  "file": "/.../LuciqExample.app/main.jsbundle", // full bundle sourceURL path
  "lineNumber": 1, // always 1 for hermesc bytecode bundles
  "column": 1033380 // bytecode virtual address (funcVirtAddr + offset)
}
```

- Only JS frames are included. Native builtins (`dateNow`, `functionPrototypeApply`)
  and `[root]` are filtered out on the RN side.
- Source-mode bundles (non-hermesc) produce real `file:line:column` frames instead;
  the shape is the same.
- When no sampled stack exists (JSC, unsupported Hermes, empty trace), `exception`
  is empty and `stackCaptureMode` explains why. No synthetic source location is
  emitted.
- Next-launch (`previousProcessEndedDuringHang`) reports carry the culprit stack
  when the previous process captured one before dying: the frames are persisted
  crash-safely mid-hang (Android: inside the marker file; iOS: as the leftover
  profiler trace, reparsed on launch). Otherwise they are duration-only.

### 3.3 Grouping string

```
js_hang/<bundle basename>:<top method>:<line>:<column>
e.g.  js_hang/main.jsbundle:luciqFinalHangCheck:1:1033380
```

Derived from the top JS frame. Duration-only reports use the plain `js_hang`
fingerprint. The basename (not the full path) keeps grouping stable across installs;
the method name keeps distinct culprits in distinct groups even when bytecode
addresses collide across builds.

### 3.4 Scalar fields / attributes

| Field                  | Meaning                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `durationMs`           | Measured hang duration (recovered hangs) or last observed gap lower bound (fatal hangs) |
| `thresholdMs`          | Detection threshold (3000)                                                              |
| `state`                | `ongoing`, `recovered`, or `previousProcessEndedDuringHang`                             |
| `durationIsLowerBound` | `true` when recovery was not observed                                                   |
| `detection`            | `"native_watchdog"`                                                                     |
| `stackCaptureMode`     | `hermes`, `unsupported`, `failed`, or `notSampled`                                      |

The Hermes `.cpuprofile` dump is an intermediate only: the RN SDK extracts the
culprit frames from it and deletes it. It is never referenced in the report,
persisted, or uploaded.

Today `durationMs`/`isFatal` travel as string user-attributes because the non-fatal
SPI has no first-class fields for them; with the hang SPI they should become real fields.

## 4. The SPI to ship

### 4.1 iOS - `LCQCrashReporting` CP category

```objc
+ (void)cp_reportJSHang:(NSDictionary *)hangData
         groupingString:(NSString *)groupingString;
```

### 4.2 Android - `ai.luciq.crash.CrashReporting` (hidden, like `reportException`)

```java
public static void reportJSHang(@NonNull JSONObject hangData,
                                @NonNull JSONObject fingerprint);
```

### 4.3 The machinery already exists natively (binary evidence, 19.8.x)

This is a smaller ask than it looks. Binary analysis of the shipped SDKs shows both
platforms already run the exact incident model this SPI needs - for their own
native main-thread hangs:

- **iOS** (`LuciqSDK.xcframework` 19.8.1): the internal App Hang feature persists a
  pending hang report to disk **at detection time**
  (`IBGCrashManager.reportHangException(_:onThread:)` →
  `-[IBGPLCrashReporter generateHangLiveReportWithFileName:...]`, keyed by launch
  UUID), finalizes and uploads on recovery
  (`sendCurrentSessionFatalHangReport`, endpoint `/crashes/fatal_ui_hang`), and
  picks up hangs the process died in on the next launch
  (`sendPendingHangReportIfExists`). None of this is reachable from the bridge, and
  the capture path is hardwired to mach-thread (native) stacks. The iOS ask is
  therefore: **expose an entry point into the existing pending-hang-report store
  that accepts externally supplied frames and thread identity**, rather than
  building a new lifecycle.
- **Android** (`luciq-crash` 19.8.0): the Fatal Hang detector persists to
  `fatal_hangs_table` immediately at detection (message frozen as "unresponsive for
  more than <sensitivity> ms", never updated with the real duration), and
  `reportException` already persists synchronously to `crashes_table` before any
  network sync. The Android ask is a `reportJSHang` sibling of these existing
  one-shot persist-then-sync entry points, classified as an App Hang.

Neither SDK has any post-hoc incident-update API (only sync-state bookkeeping), so
the SPI stays **one-shot**: the RN layer calls it once per hang, when the outcome
(recovered duration, or next-launch lower bound) is known. If the iOS pending-hang
store is ever exposed with its full ongoing → finalize lifecycle, the RN layer can
drop its own marker persistence (section 2, "Unrecovered hangs") entirely.

### 4.4 Reference implementation sketches (v1, one-shot)

Names of internal/obfuscated pieces are descriptive; map them to the real
symbols. The invariants that must hold: durable persist before any network work,
classification as an App Hang incident, and `platform: react_native` preserved
end to end.

**Android - `ai.luciq.crash.CrashReporting` (mirrors `saveAndReportException`):**

```java
public static void reportJSHang(@NonNull final JSONObject hangData,
                                @NonNull final JSONObject fingerprint) {
    if (!isCrashReportingEnabled() || !isAppHangFeatureEnabled()) {
        return;
    }
    // Same executor saveAndReportException() uses: durable write happens off
    // the caller thread within milliseconds, ordered with non-fatal reports.
    PoolProvider.getSingleThreadExecutor("CRASHES").execute(new Runnable() {
        @Override
        public void run() {
            try {
                Context context = getApplicationContext();
                if (context == null) return;
                // New model with IssueType.AppHang (32) - NOT a non-fatal.
                JSHang hang = JSHang.factory().create(hangData, fingerprint);
                // 1. State file, like non-fatals (WriteStateToFileDiskOperation).
                hang.setStateUri(writeIncidentStateFile(context, "js_hang_state"));
                // 2. Durable insert BEFORE any network activity (mirror of
                //    fatal_hangs_table; unsent rows re-sync on next launch).
                JSHangCache.insert(hang);
                // 3. Session linkage - identical call non-fatals make.
                CommonsLocator.getSessionLinker().link(hang, 1);
                // 4. Sync job start; uploader targets App Hang ingestion and
                //    preserves platform=react_native (JS sourcemap routing).
                JSHangSyncJob.get().start();
            } catch (Throwable t) {
                reportDiagnosticNonFatal(t, "reportJSHang failed");
            }
        }
    });
}
```

**iOS - `LCQCrashReporting+CP` shim plus Swift manager (mirrors
`reportCPNonFatalCrash`, produces an `IBGFatalHang`-style incident):**

```objc
// LCQCrashReporting+CP.h
+ (void)cp_reportJSHang:(NSDictionary *)hangData
         groupingString:(NSString *)groupingString;
```

```swift
// IBGCrashManager.swift
@objc static func reportJSHang(_ hangData: [String: Any], groupingString: String) {
    guard IBGFeatures.fatalHang.isEnabled, LCQCrashReporting.appHangEnabled else { return }
    crashProcessingQueue.async {
        // Incident built from the EXTERNAL payload - no PLCrash mach-thread
        // capture; frames remain RN bundle coordinates untouched.
        let hang = IBGJSHang(payload: hangData)     // IBGCrash subclass, like IBGFatalHang
        hang.groupingString = groupingString
        hang.platform = "react_native"              // routes backend symbolication to
                                                    // JS sourcemaps, never dSYMs
        hang.durationMs = hangData["durationMs"] as? Int64 ?? 0
        hang.durationIsLowerBound = hangData["durationIsLowerBound"] as? Bool ?? false
        hang.threadName = "com.facebook.react.runtime.JavaScript"
        // Durable save BEFORE enqueue/upload - same saveAndEnqueueForSending
        // path non-fatals use (Core Data row + payload file).
        IBGCrashManager.saveAndEnqueueForSending(hang)  // App Hang ingestion,
                                                        // sibling of /crashes/fatal_ui_hang
        IBGSessionManager.addAppHangToCurrentSession(uuid: hang.uuid)
    }
}
```

### 4.5 Optional v2: lifecycle SPI that removes RN-side marker persistence

If the native SDKs expose the pending-incident lifecycle they already run
internally, the RN layer deletes its marker store, leftover-trace reparse, and
previous-session reporting paths, keeping only detection + capture. The contract:

1. `beginJSHang(hangData, fingerprint)` - at detection. Durably persist a pending
   incident (`state: ongoing`, start timestamp, threshold, no frames), keyed to
   the current launch/session, before returning.
2. `updateJSHang(frames, stackCaptureMode)` - once, when the mid-hang profiler
   capture completes (~750 ms after detection). Attach the culprit stack to the
   pending record.
3. `finalizeJSHang(durationMs)` - on recovery. Stamp the measured duration, flip
   to `recovered`, enqueue as an App Hang for sync.
4. `cancelJSHang()` - on lifecycle aborts (backgrounding, teardown, false
   positive). Delete the pending record silently.
5. Next-launch sweep (native-internal): pending records from a previous
   launch/session become `previousProcessEndedDuringHang` with
   `durationMs = lastUpdate - start` as a lower bound, linked to the previous
   session.

Mapping to existing internals:

- **iOS:** generalize the pending-hang-report store (`hangReportsDirectory`,
  keyed by `currentLaunchUUID`) to accept an external payload instead of a
  PLCrash mach-thread capture; add a finalize path that records measured duration
  (native fatal hangs never measure one); extend `sendPendingHangReportIfExists`
  to emit pending JS-hang files with lower-bound semantics; expose all of it as
  bridge-reachable `cp_` category methods.
- **Android:** a pending row with `state=ongoing` (new table or a state on the
  fatal-hangs pattern), linked via the existing `SessionLinker`; reuse the
  existing table-update machinery for frames; a startup sweep alongside the
  terminations migrator. Adding an `IS_IN_JS_HANG` flag to the existing ~5 s
  termination snapshot yields the death-time lower bound with zero additional
  I/O and lets termination incidents be annotated "died during a JS hang".

**Reference sketches (v2).** Android - four entry points on the "CRASHES"
executor plus a startup sweep:

```java
public static void beginJSHang(@NonNull JSONObject hangData,
                               @NonNull JSONObject fingerprint) {
    if (!isCrashReportingEnabled() || !isAppHangFeatureEnabled()) return;
    PoolProvider.getSingleThreadExecutor("CRASHES").execute(() -> {
        JSHang hang = JSHang.factory().createPending(hangData, fingerprint);
        hang.setStateUri(writeIncidentStateFile(getApplicationContext(), "js_hang_state"));
        hang.setIncidentState(JSHang.State.ONGOING);
        hang.setLaunchId(currentLaunchId());
        JSHangCache.insert(hang);                       // durable BEFORE anything else
        CommonsLocator.getSessionLinker().link(hang, 1);
    });
}

public static void updateJSHangFrames(@NonNull JSONArray frames,
                                      @NonNull String stackCaptureMode) {
    PoolProvider.getSingleThreadExecutor("CRASHES").execute(() ->
        JSHangCache.updateOngoingForLaunch(currentLaunchId(), frames, stackCaptureMode));
}

public static void finalizeJSHang(long durationMs) {
    PoolProvider.getSingleThreadExecutor("CRASHES").execute(() -> {
        JSHang hang = JSHangCache.getOngoingForLaunch(currentLaunchId());
        if (hang == null) return;
        hang.setDurationMs(durationMs);                 // measured, not lower bound
        hang.setIncidentState(JSHang.State.RECOVERED);
        JSHangCache.update(hang);
        JSHangSyncJob.get().start();                    // App Hang ingestion,
                                                        // platform=react_native preserved
    });
}

public static void cancelJSHang() {
    PoolProvider.getSingleThreadExecutor("CRASHES").execute(() ->
        JSHangCache.deleteOngoingForLaunch(currentLaunchId()));
}

// Startup sweep, beside the terminations migrator / cache replay:
for (JSHang hang : JSHangCache.getOngoingNotForLaunch(currentLaunchId())) {
    hang.setIncidentState(JSHang.State.PREVIOUS_PROCESS_ENDED_DURING_HANG);
    hang.setDurationMs(hang.getLastSeenTs() - hang.getStartTs());
    hang.setDurationIsLowerBound(true);
    JSHangCache.update(hang);
}
JSHangSyncJob.get().start();
```

iOS - pending `.jshang` JSON file in the existing `hangReportsDirectory`, keyed
by launch UUID like the native pending hang report:

```objc
// LCQCrashReporting+CP.h
+ (void)cp_beginJSHang:(NSDictionary *)hangData groupingString:(NSString *)groupingString;
+ (void)cp_updateJSHangFrames:(NSArray<NSDictionary *> *)frames
             stackCaptureMode:(NSString *)stackCaptureMode;
+ (void)cp_finalizeJSHangWithDurationMs:(int64_t)durationMs;
+ (void)cp_cancelJSHang;
```

```swift
static func beginJSHang(_ hangData: [String: Any], groupingString: String) {
    guard IBGFeatures.fatalHang.isEnabled, LCQCrashReporting.appHangEnabled else { return }
    crashProcessingQueue.async {
        var pending = hangData
        pending["groupingString"] = groupingString
        pending["state"] = "ongoing"
        pending["launchUUID"] = currentLaunchUUID
        pending["lastSeenEpochMs"] = nowEpochMs()
        writePendingJSHangFile(pending, atomically: true)
    }
}

static func updateJSHangFrames(_ frames: [[String: Any]], stackCaptureMode: String) {
    crashProcessingQueue.async {
        mutatePendingJSHangFile { pending in
            pending["frames"] = frames
            pending["stackCaptureMode"] = stackCaptureMode
            pending["lastSeenEpochMs"] = nowEpochMs()
        }
    }
}

static func finalizeJSHang(durationMs: Int64) {
    crashProcessingQueue.async {
        guard var pending = loadPendingJSHangFile() else { return }
        pending["durationMs"] = durationMs
        pending["state"] = "recovered"
        let hang = IBGJSHang(payload: pending)
        IBGCrashManager.saveAndEnqueueForSending(hang)
        IBGSessionManager.addAppHangToCurrentSession(uuid: hang.uuid)
        deletePendingJSHangFile()
    }
}

static func cancelJSHang() {
    crashProcessingQueue.async { deletePendingJSHangFile() }
}

// Extend the existing sendPendingHangReportIfExists startup path:
static func sendPendingJSHangReportIfExists() {
    guard var pending = loadPendingJSHangFile(),
          pending["launchUUID"] as? String != currentLaunchUUID else { return }
    pending["state"] = "previousProcessEndedDuringHang"
    pending["durationMs"] = (pending["lastSeenEpochMs"] as! Int64)
                          - (pending["startTimestampMs"] as! Int64)
    pending["durationIsLowerBound"] = true
    IBGCrashManager.saveAndEnqueueForSending(IBGJSHang(payload: pending))
    deletePendingJSHangFile()
}
```

Once v2 ships, the RN layer deletes: `RNJSHangMarkerStore`, the iOS marker
methods and leftover-trace reparse, the previous-session reporting paths, and
the frames-JSON marker serialization - keeping only detection, capture, and the
four SPI calls.

## 5. What native must do with it

1. **Classify as an App Hang incident, not a non-fatal.** Same incident type,
   dashboard placement, and metrics treatment as main-thread App Hangs (duration
   shown, hang rate, not crash-free-rate). `durationMs` is the incident's duration
   field. The cause line becomes:
   `The app's JS thread was unresponsive for more than <thresholdMs> milliseconds`.

2. **Pass the stack through untouched, tagged for RN symbolication.** The
   `exception` frames are RN bundle coordinates. `platform: react_native` must be
   preserved end-to-end so the backend symbolicates with the **JS sourcemap
   pipeline** keyed by `{version name, version code, codepush label (+ variant)}` -
   exactly like handled JS crashes - and never routes these frames through
   dSYM/ProGuard symbolication. This is the single most important requirement:
   native hang stacks are native frames symbolicated by dSYM/mapping files; RN hang
   stacks are bundle offsets symbolicated by sourcemaps. Mixing the two produces
   garbage.

3. **Render as a single-thread report.** Unlike the native hang's multi-thread dump,
   the JS hang has one meaningful thread: the JS thread, marked as the hanged one.
   Optionally, native MAY attach its own thread dump captured at detection time as
   secondary threads (useful when the JS thread is blocked inside a synchronous
   TurboModule call - the native frames show what it is waiting on) - but the JS
   stack must remain the primary, symbolicated stack.

4. **Honor `groupingString`.** Group by the provided fingerprint verbatim (same
   contract as the non-fatal SPI). Do not hash the frames natively; grouping
   semantics stay under RN SDK control.

5. **Previous-process variant.** `previousProcessEndedDuringHang` arrives on the
   next launch with a duration lower bound. Attach it to the previous session, but
   do not label it fatal unless native termination evidence confirms causality.

6. **Feature gating.** Respect the existing hang controls: iOS
   `LCQCrashReporting.appHangEnabled` (and its forced-disable when Crash Reporting
   is off), remote feature flags, and any hang sampling. If hangs are disabled,
   drop the report silently. Consent flow: per the current contract,
   `onWillSendCrashReportHandler` excludes app hangs - keep JS hangs excluded too.

7. **Persistence and sync.** Reuse the existing hang incident pipeline: persist on
   report, sync with the session (next-session semantics identical to today's
   non-fatals/hangs). No new endpoint or storage.

8. **Dedup policy with the native detector.** The native App Hang detector watches
   the main thread; this SPI reports the JS thread - distinct events, both valid.
   They CAN legitimately fire together: e.g. a synchronous TurboModule call from JS
   blocks on the main thread while the main thread is itself blocked (see Crash
   #890: main thread stuck in `performBlockAndWait` invoked from
   `LuciqReactBridge getUserAttribute`, JS thread idle-waiting). Recommended: no
   suppression, but correlate - if a native main-thread hang overlaps a JS hang
   time window, link the two incidents (shared attribute or incident reference)
   instead of dropping either.

## 6. What the RN SDK changes once the SPI ships

One substitution per platform in the existing reporter, nothing else:

- iOS `LuciqJSHangWatchdog reportHangWithMessage:durationMs:isFatal:profilePath:`
  calls `cp_reportAppHangWithStackTrace:durationMs:isFatal:groupingString:userAttributes:`
  instead of `cp_reportNonFatalCrashWithStackTrace:...`, and drops
  `hang_duration_ms` / `hang_fatal` from the attributes (now first-class).
- Android `RNJSHangReporter.report(...)` calls `CrashReporting.reportAppHang(...)`
  instead of the reflective `reportException(...)`.

Watchdog, profiler, parsing, marker persistence, and lifecycle behavior remain
subject to the bounds and compatibility gates described below.

## 7. Known open items (outside the native SDKs)

Full risk / tradeoff inventory (mitigated vs open, including Hermes sampling):
[`js-hang-risks.md`](./js-hang-risks.md).

- **Sourcemap upload vs app variant**: the symbols upload API
  (`/api/sdk/v3/symbols_files`) accepts `{name, code, codepush}` but has no variant
  field, while sessions can be tagged with an `appVariant`. If the backend keys
  sourcemaps per variant, variant-tagged reports (hangs AND handled crashes) never
  symbolicate. Needs a backend/API answer; the RN CLI would then grow a
  `--variant` option.
- **CodePush label in the Xcode build phase**: the RN upload build phase does not
  pass `--label`; apps that set `overAirVersion` at runtime must provide
  `LUCIQ_APP_VERSION_LABEL` (read by the CLI from the environment) or upload
  per-OTA-release maps via the CLI, or their reports carry a codepush-suffixed
  version key that no uploaded map matches.
- **Hermes profiler ownership**: the profiler is process-global. Production
  sampling must not disable profiling owned by React Native or another SDK.
- **Runtime matrix**: classic bridge, bridgeless, Hermes versions, and JSC need
  explicit capability results. Unsupported combinations still report duration
  metadata, without a fabricated stack.

## 8. Required bounds

- Profile file: at most 1 MiB; oversized files are deleted without parsing.
- Samples processed: at most 512 from the confirmed blocked interval.
- Emitted JS frames: at most 64, with a parent-walk cap of 128.
- Method and file strings: at most 512 UTF-8 bytes each.
- Serialized hang payload: at most 64 KiB.
- Sampling window: fixed and short; sampling is stopped on timeout, recovery,
  backgrounding, disable, invalidation, and every failure path.

## 9. Explicit Hermes profiler ownership

Hermes sampling is process-global. Stack capture therefore fails closed unless the
host guarantees no other profiler owner:

- Android: add boolean application metadata
  `ai.luciq.reactnative.JSHangHermesProfilerExclusiveOwnership=true`.
- iOS: define `LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP=1` for the RNLuciq pod target.

Do not enable either switch when React Native diagnostics or another SDK can start
Hermes profiling. The watchdog still reports duration-only hangs when ownership is
not guaranteed.
