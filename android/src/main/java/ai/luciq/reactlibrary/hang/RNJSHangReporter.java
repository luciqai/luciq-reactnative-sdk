package ai.luciq.reactlibrary.hang;

import static ai.luciq.reactlibrary.utils.LuciqUtil.getMethod;

import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONObject;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;

import ai.luciq.crash.CrashReporting;
import ai.luciq.crash.models.LuciqNonFatalException;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;

/**
 * Reports detected JS thread hangs through the non-fatal pipeline, using the
 * same hidden {@code CrashReporting.reportException} entry point the module's
 * {@code sendHandledJSCrash} uses. Replaced by the native SDK hang SPI once it
 * ships (see docs/js-hang-app-hang-spi.md; the reports then classify as App
 * Hangs instead of non-fatals).
 */
final class RNJSHangReporter {
    private static final String ERROR_NAME = "JSThreadHang";
    private static final String FINGERPRINT = "js_hang";
    private static final int MAX_FRAMES = 64;
    private static final int MAX_STRING_LENGTH = 512;
    // Hangs arrive at most once per threshold interval; a plain serial
    // executor is enough.
    private static final ExecutorService REPORT_EXECUTOR =
            Executors.newSingleThreadExecutor(new ThreadFactory() {
                @Override
                public Thread newThread(Runnable runnable) {
                    Thread thread = new Thread(runnable, "lcq-js-hang-reporter");
                    thread.setDaemon(true);
                    return thread;
                }
            });

    private RNJSHangReporter() {
    }

    static void reportRecoveredHang(
            long hangStartEpochMs,
            long durationMs,
            long thresholdMs,
            List<RNJSHangProfiler.Frame> frames,
            String stackCaptureMode) {
        report(new JSHangData(
                hangStartEpochMs,
                durationMs,
                thresholdMs,
                false,
                frames,
                stackCaptureMode));
    }

    static void reportPreviousSessionInterruptedHang(
            long hangStartEpochMs, long lastObservedGapMs, long thresholdMs,
            @Nullable String framesJson, @Nullable String stackCaptureMode) {
        // The marker may carry the culprit stack dumped mid-hang before the
        // previous process ended; malformed frames degrade to duration-only.
        List<RNJSHangProfiler.Frame> frames = RNJSHangProfiler.framesFromJson(framesJson);
        String mode = frames.isEmpty()
                ? "unavailable_previous_session"
                : (stackCaptureMode == null || stackCaptureMode.length() == 0
                        ? "hermes_sampling" : stackCaptureMode);
        report(new JSHangData(
                hangStartEpochMs,
                lastObservedGapMs,
                thresholdMs,
                true,
                frames,
                mode));
    }

    private static Map<String, Object> baseAttributes(JSHangData data) {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("hang_duration_ms", String.valueOf(data.durationMs));
        attributes.put("hang_threshold_ms", String.valueOf(data.thresholdMs));
        attributes.put("hang_start_epoch_ms", String.valueOf(data.hangStartEpochMs));
        attributes.put("detection", "native_watchdog");
        attributes.put("stack_capture_mode", data.stackCaptureMode);
        attributes.put(
                "stack_capture_fidelity",
                data.frames.isEmpty() ? "duration_only" : "modal_leaf_parent_chain");
        if (data.previousSessionInterrupted) {
            attributes.put("hang_outcome", "previous_session_interrupted");
        }
        return attributes;
    }

    private static void report(final JSHangData data) {
        REPORT_EXECUTOR.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    reportJSHang(data);
                } catch (Throwable e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[report] failed", e);
                }
            }
        });
    }

    /**
     * Isolates the temporary non-fatal transport. Once native ships the hang
     * SPI specified in docs/js-hang-app-hang-spi.md, only this method changes.
     */
    private static void reportJSHang(JSHangData data) throws Exception {
        JSONObject stackTrace = buildExceptionObject(data);
        JSONObject fingerprint = CrashReporting.getFingerprintObject(groupingFor(data.frames));
        Map<String, Object> attributes = baseAttributes(data);

        attributes.put("js_hang_transport", "non_fatal_poc");
        Method fallback = getMethod(
                Class.forName("ai.luciq.crash.CrashReporting"),
                "reportException",
                JSONObject.class,
                boolean.class,
                Map.class,
                JSONObject.class,
                LuciqNonFatalException.Level.class);
        if (fallback == null) {
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[report] no compatible reporting SPI");
            return;
        }
        fallback.invoke(
                null,
                stackTrace,
                true,
                attributes,
                fingerprint,
                LuciqNonFatalException.Level.ERROR);
    }

    private static JSONObject buildExceptionObject(JSHangData data) throws Exception {
        String message = data.previousSessionInterrupted
                ? "JS thread hang observation was interrupted after at least "
                    + data.durationMs + " ms in the previous session"
                : "JS thread hang: event loop blocked for ~" + data.durationMs + " ms";
        JSONArray frameArray = new JSONArray();
        for (RNJSHangProfiler.Frame frame : data.frames) {
            JSONObject jsonFrame = new JSONObject();
            jsonFrame.put("methodName", frame.methodName);
            jsonFrame.put("file", frame.file);
            jsonFrame.put("lineNumber", frame.lineNumber);
            jsonFrame.put("column", frame.column);
            frameArray.put(jsonFrame);
        }

        JSONObject exception = new JSONObject();
        exception.put("message", ERROR_NAME + " - " + message);
        exception.put("e_message", message);
        exception.put("e_name", ERROR_NAME);
        exception.put("os", "android");
        exception.put("platform", "react_native");
        exception.put("exception", frameArray);
        return exception;
    }

    private static String groupingFor(List<RNJSHangProfiler.Frame> frames) {
        if (frames.isEmpty()) {
            return FINGERPRINT;
        }
        RNJSHangProfiler.Frame frame = frames.get(0);
        String file = frame.file;
        int slash = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'));
        if (slash >= 0 && slash + 1 < file.length()) {
            file = file.substring(slash + 1);
        }
        return bounded(FINGERPRINT + "/" + file + ":" + frame.methodName + ":"
                + frame.lineNumber + ":" + frame.column);
    }

    private static String bounded(@Nullable String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= MAX_STRING_LENGTH
                ? value : value.substring(0, MAX_STRING_LENGTH);
    }

    private static final class JSHangData {
        final long hangStartEpochMs;
        final long durationMs;
        final long thresholdMs;
        final boolean previousSessionInterrupted;
        final List<RNJSHangProfiler.Frame> frames;
        final String stackCaptureMode;

        JSHangData(
                long hangStartEpochMs,
                long durationMs,
                long thresholdMs,
                boolean previousSessionInterrupted,
                List<RNJSHangProfiler.Frame> frames,
                String stackCaptureMode) {
            this.hangStartEpochMs = Math.max(0L, hangStartEpochMs);
            this.durationMs = Math.max(0L, durationMs);
            this.thresholdMs = Math.max(0L, thresholdMs);
            this.previousSessionInterrupted = previousSessionInterrupted;
            this.frames = new ArrayList<>(
                    frames.subList(0, Math.min(frames.size(), MAX_FRAMES)));
            this.stackCaptureMode = bounded(stackCaptureMode);
        }
    }
}
