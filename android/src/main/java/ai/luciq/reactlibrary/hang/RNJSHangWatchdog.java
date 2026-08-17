package ai.luciq.reactlibrary.hang;

import android.content.pm.ApplicationInfo;
import android.os.Debug;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Process;
import android.os.SystemClock;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicLong;

import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;

/**
 * Detects JS thread hangs from a native background thread.
 *
 * A watchdog thread posts a lightweight pong marker onto the JS message queue
 * every {@link #PING_INTERVAL_MS} and tracks when it last executed. While the
 * JS thread is blocked the pong cannot run, so the observed gap grows; once it
 * crosses the configured threshold the hang is recorded (and a marker is persisted
 * so hangs the app dies in are reported on the next launch). The hang is
 * reported with its duration when the JS thread recovers.
 *
 * The detector never runs in debuggable builds: Metro reloads, breakpoints and
 * attached debuggers block the JS thread legitimately.
 */
public final class RNJSHangWatchdog implements LifecycleEventListener {
    private static final long PING_INTERVAL_MS = 500L;
    private static final long THRESHOLD_MS = 3000L;
    private static final long MARKER_REFRESH_MS = 5000L;
    private static final long PROFILE_SAMPLE_WINDOW_MS = 750L;

    @Nullable
    private static RNJSHangWatchdog instance;

    @Nullable
    private volatile ReactApplicationContext reactContext;
    private final RNJSHangMarkerStore markerStore;
    private final AtomicLong generation = new AtomicLong(0L);

    @Nullable
    private HandlerThread watchdogThread;
    @Nullable
    private Handler watchdogHandler;

    private volatile boolean running = false;
    private volatile boolean paused = true;

    // Watchdog-thread-only state.
    private boolean probePending = false;
    private long pendingProbeSentElapsed = 0L;
    private boolean freshPongRequired = true;
    private long hangStartElapsed = -1L;
    private long hangStartEpochMs = -1L;
    private long lastMarkerRefreshElapsed = 0L;
    private boolean profilerStarted = false;
    private long profilerStartElapsed = 0L;
    private long lastRecoveryPongElapsed = 0L;
    @Nullable
    private RecoveredHang pendingRecoveredHang;
    @Nullable
    private RNJSHangProfiler.CaptureResult completedCapture;
    // Frames captured mid-hang, persisted into the marker so a hang the process
    // dies in still reports the culprit stack on the next launch.
    @Nullable
    private String capturedFramesJson;
    @Nullable
    private String capturedStackCaptureMode;

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (!running || paused) {
                return;
            }
            try {
                if (!isAppRuntimeActive()) {
                    suspendInternal();
                    return;
                }
                checkForHang();
                postProbeIfNeeded();
            } catch (Throwable e) {
                LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[tick] failed", e);
            }
            Handler handler = watchdogHandler;
            if (running && !paused && handler != null) {
                handler.postDelayed(this, PING_INTERVAL_MS);
            }
        }
    };

    private final Runnable finishProfiler = new Runnable() {
        @Override
        public void run() {
            finishProfilerCapture();
        }
    };

    private RNJSHangWatchdog(ReactApplicationContext reactContext) {
        this.reactContext = reactContext;
        this.markerStore = new RNJSHangMarkerStore(reactContext);
    }

    public static synchronized void start(ReactApplicationContext reactContext) {
        try {
            if (instance != null && instance.reactContext != reactContext) {
                instance.stopInternal();
                instance = null;
            }
            if (instance == null) {
                instance = new RNJSHangWatchdog(reactContext);
            }
            instance.startInternal();
        } catch (Throwable e) {
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[start] failed", e);
        }
    }

    public static synchronized void stop() {
        try {
            if (instance != null) {
                instance.stopInternal();
                instance = null;
            }
        } catch (Throwable e) {
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[stop] failed", e);
        }
    }

    public static synchronized void stop(ReactApplicationContext reactContext) {
        if (instance != null && instance.reactContext == reactContext) {
            instance.stopInternal();
            instance = null;
        }
    }

    private synchronized void startInternal() {
        if (running) {
            return;
        }
        ReactApplicationContext context = reactContext;
        if (context == null) {
            return;
        }
        if (isDebuggable()) {
            LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG, "[start] skipped: debuggable build or debugger attached");
            return;
        }

        reportPreviousSessionHangIfFound();

        running = true;
        paused = !isAppRuntimeActive();
        generation.incrementAndGet();

        context.addLifecycleEventListener(this);

        watchdogThread = new HandlerThread("lcq-js-hang-watchdog", Process.THREAD_PRIORITY_BACKGROUND);
        watchdogThread.start();
        watchdogHandler = new Handler(watchdogThread.getLooper());
        watchdogHandler.post(new Runnable() {
            @Override
            public void run() {
                resetBaseline();
                if (!paused) {
                    Handler handler = watchdogHandler;
                    if (handler != null) {
                        handler.postDelayed(tick, PING_INTERVAL_MS);
                    }
                }
            }
        });

        LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG, "[start] watchdog started thresholdMs=" + THRESHOLD_MS + ", pingIntervalMs=" + PING_INTERVAL_MS);
    }

    private synchronized void stopInternal() {
        running = false;
        paused = true;
        generation.incrementAndGet();
        ReactApplicationContext context = reactContext;
        if (context != null) {
            context.removeLifecycleEventListener(this);
        }
        // Hang state is watchdog-thread-only: marshal the final cleanup onto the
        // watchdog thread (before quitSafely drains it) instead of mutating that
        // state concurrently with an in-flight tick.
        Handler handler = watchdogHandler;
        boolean cleanupPosted = false;
        if (handler != null) {
            handler.removeCallbacksAndMessages(null);
            cleanupPosted = handler.post(new Runnable() {
                @Override
                public void run() {
                    abortProfilerAndReset();
                }
            });
        }
        if (!cleanupPosted) {
            abortProfilerAndReset();
        }
        HandlerThread thread = watchdogThread;
        if (thread != null) {
            thread.quitSafely();
        }
        watchdogThread = null;
        watchdogHandler = null;
        reactContext = null;
        LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG, "[stop] watchdog stopped");
    }

    private void checkForHang() {
        if (freshPongRequired || !probePending) {
            return;
        }
        long now = SystemClock.elapsedRealtime();
        long gap = Math.max(0L, now - pendingProbeSentElapsed);

        if (hangStartElapsed < 0L && gap >= THRESHOLD_MS) {
            hangStartElapsed = pendingProbeSentElapsed;
            hangStartEpochMs = System.currentTimeMillis() - gap;
            lastMarkerRefreshElapsed = now;
            markerStore.persist(hangStartEpochMs, gap, null, null);
            ReactApplicationContext context = reactContext;
            profilerStarted = context != null && RNJSHangProfiler.start(context);
            if (profilerStarted) {
                profilerStartElapsed = now;
                Handler handler = watchdogHandler;
                if (handler != null) {
                    handler.removeCallbacks(finishProfiler);
                    handler.postDelayed(finishProfiler, PROFILE_SAMPLE_WINDOW_MS);
                }
            }
            LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG, "[checkForHang] hang detected gapMs=" + gap);
        } else if (hangStartElapsed >= 0L
                && now - lastMarkerRefreshElapsed >= MARKER_REFRESH_MS) {
            lastMarkerRefreshElapsed = now;
            markerStore.persist(hangStartEpochMs, gap, capturedFramesJson, capturedStackCaptureMode);
        }
    }

    private void postProbeIfNeeded() {
        if (probePending || !running || paused) {
            return;
        }
        final ReactApplicationContext context = reactContext;
        if (context == null) {
            return;
        }
        // One probe outstanding at a time; the generation token rejects pongs
        // from a previous lifecycle epoch, so no per-probe sequence is needed.
        final long probeGeneration = generation.get();
        probePending = true;
        pendingProbeSentElapsed = SystemClock.elapsedRealtime();
        final WeakReference<RNJSHangWatchdog> weakWatchdog = new WeakReference<>(this);
        try {
            context.runOnJSQueueThread(new Runnable() {
                @Override
                public void run() {
                    final long pongElapsed = SystemClock.elapsedRealtime();
                    RNJSHangWatchdog watchdog = weakWatchdog.get();
                    if (watchdog != null) {
                        watchdog.dispatchPong(probeGeneration, pongElapsed);
                    }
                }
            });
        } catch (Throwable e) {
            probePending = false;
            LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG, "[postPong] skipped: " + e.getMessage());
        }
    }

    private void dispatchPong(final long probeGeneration, final long pongElapsed) {
        Handler handler = watchdogHandler;
        if (handler == null) {
            return;
        }
        handler.post(new Runnable() {
            @Override
            public void run() {
                if (!running || paused || generation.get() != probeGeneration
                        || !probePending) {
                    return;
                }
                probePending = false;
                freshPongRequired = false;
                // The next probe is posted by the 500 ms tick, never from here:
                // reposting on pong receipt would ping-pong at JS round-trip
                // rate and burn CPU on both threads.
                if (hangStartElapsed >= 0L) {
                    long durationMs = Math.max(0L, pongElapsed - hangStartElapsed);
                    markerStore.clear();
                    pendingRecoveredHang =
                            new RecoveredHang(hangStartEpochMs, durationMs);
                    lastRecoveryPongElapsed = pongElapsed;
                    hangStartElapsed = -1L;
                    if (completedCapture != null) {
                        RNJSHangProfiler.CaptureResult capture = completedCapture;
                        completedCapture = null;
                        reportPendingRecovered(capture);
                    } else if (profilerStarted) {
                        // Stop sampling now: samples taken after recovery must
                        // not be attributed as the hang's culprit stack.
                        Handler activeHandler = watchdogHandler;
                        if (activeHandler != null) {
                            activeHandler.removeCallbacks(finishProfiler);
                        }
                        finishProfilerCapture();
                    } else {
                        reportPendingRecovered(
                                new RNJSHangProfiler.CaptureResult(
                                        new ArrayList<RNJSHangProfiler.Frame>(),
                                        RNJSHangProfiler.getCapabilityStatus(reactContext)));
                    }
                }
            }
        });
    }

    private void finishProfilerCapture() {
        if (!profilerStarted) {
            return;
        }
        // When recovery already happened, restrict parsing to the samples taken
        // while the thread was still blocked; 0 keeps every sample (the whole
        // window was mid-hang).
        long sampleWindowMs = pendingRecoveredHang != null
                ? Math.max(0L, lastRecoveryPongElapsed - profilerStartElapsed) : 0L;
        ReactApplicationContext context = reactContext;
        RNJSHangProfiler.CaptureResult capture = context == null
                ? new RNJSHangProfiler.CaptureResult(
                        new ArrayList<RNJSHangProfiler.Frame>(), "aborted_context_destroyed")
                : RNJSHangProfiler.dumpAndStop(
                        context,
                        hangStartEpochMs,
                        context.getSourceURL() == null
                                ? "index.android.bundle" : context.getSourceURL(),
                        sampleWindowMs);
        profilerStarted = false;
        if (pendingRecoveredHang == null) {
            completedCapture = capture;
            // Refresh the marker with the captured stack so a hang the process
            // dies in still reports its culprit frames on the next launch.
            capturedFramesJson = capture.frames.isEmpty()
                    ? null : RNJSHangProfiler.framesToJson(capture.frames);
            capturedStackCaptureMode = capture.frames.isEmpty()
                    ? null : capture.stackCaptureMode;
            if (capturedFramesJson != null && hangStartElapsed >= 0L) {
                long gap = Math.max(0L, SystemClock.elapsedRealtime() - pendingProbeSentElapsed);
                markerStore.persist(
                        hangStartEpochMs, gap, capturedFramesJson, capturedStackCaptureMode);
            }
        } else {
            reportPendingRecovered(capture);
        }
    }

    private void reportPendingRecovered(RNJSHangProfiler.CaptureResult capture) {
        RecoveredHang recovered = pendingRecoveredHang;
        if (recovered == null) {
            return;
        }
        pendingRecoveredHang = null;
        RNJSHangReporter.reportRecoveredHang(
                recovered.hangStartEpochMs,
                recovered.durationMs,
                THRESHOLD_MS,
                capture.frames,
                capture.stackCaptureMode);
    }

    private void reportPreviousSessionHangIfFound() {
        RNJSHangMarkerStore.Marker marker = markerStore.consume();
        if (marker != null && !markerStore.isCurrentSession(marker)) {
            RNJSHangReporter.reportPreviousSessionInterruptedHang(
                    marker.hangStartEpochMs, marker.lastObservedGapMs, THRESHOLD_MS,
                    marker.framesJson, marker.stackCaptureMode);
        }
    }

    private boolean isDebuggable() {
        boolean debuggableBuild =
                (reactContext != null
                        && (reactContext.getApplicationInfo().flags
                        & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        return debuggableBuild || Debug.isDebuggerConnected();
    }

    private boolean isAppRuntimeActive() {
        ReactApplicationContext context = reactContext;
        return context != null
                && context.hasActiveReactInstance()
                && context.getCurrentActivity() != null;
    }

    private void resetBaseline() {
        probePending = false;
        freshPongRequired = true;
        hangStartElapsed = -1L;
        hangStartEpochMs = -1L;
        lastMarkerRefreshElapsed = 0L;
        completedCapture = null;
        capturedFramesJson = null;
        capturedStackCaptureMode = null;
        markerStore.clear();
    }

    private void suspendInternal() {
        paused = true;
        generation.incrementAndGet();
        Handler handler = watchdogHandler;
        if (handler != null) {
            handler.removeCallbacks(tick);
            handler.removeCallbacks(finishProfiler);
        }
        abortProfilerAndReset();
    }

    private void abortProfilerAndReset() {
        RNJSHangProfiler.abort();
        profilerStarted = false;
        if (pendingRecoveredHang != null) {
            reportPendingRecovered(new RNJSHangProfiler.CaptureResult(
                    new ArrayList<RNJSHangProfiler.Frame>(), "aborted_lifecycle"));
        }
        resetBaseline();
    }

    @Override
    public void onHostPause() {
        Handler handler = watchdogHandler;
        if (handler != null) {
            handler.post(new Runnable() {
                @Override
                public void run() {
                    suspendInternal();
                }
            });
        }
    }

    @Override
    public void onHostResume() {
        Handler handler = watchdogHandler;
        if (handler != null) {
            handler.post(new Runnable() {
                @Override
                public void run() {
                    if (!running || !isAppRuntimeActive()) {
                        return;
                    }
                    generation.incrementAndGet();
                    resetBaseline();
                    paused = false;
                    Handler activeHandler = watchdogHandler;
                    if (activeHandler != null) {
                        activeHandler.removeCallbacks(tick);
                        postProbeIfNeeded();
                        activeHandler.postDelayed(tick, PING_INTERVAL_MS);
                    }
                }
            });
        }
    }

    @Override
    public void onHostDestroy() {
        synchronized (RNJSHangWatchdog.class) {
            if (instance == this) {
                stopInternal();
                instance = null;
            } else {
                stopInternal();
            }
        }
    }

    private static final class RecoveredHang {
        final long hangStartEpochMs;
        final long durationMs;

        RecoveredHang(long hangStartEpochMs, long durationMs) {
            this.hangStartEpochMs = hangStartEpochMs;
            this.durationMs = durationMs;
        }
    }
}
