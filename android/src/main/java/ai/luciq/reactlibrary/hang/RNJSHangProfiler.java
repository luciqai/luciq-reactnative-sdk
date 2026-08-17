package ai.luciq.reactlibrary.hang;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;

import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.lang.reflect.Method;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;

/**
 * Uses RN's Java binding (com.facebook.hermes.instrumentation.HermesSamplingProfiler)
 * via reflection for enable/dump so apps running JSC (or an RN version without
 * the binding) degrade to duration-only reports instead of crashing. Stopping
 * goes through {@link RNHermesSamplingShim} because RN's own Java disable()
 * binding is broken on 0.70.0-0.85.3 (wired to native enable()).
 */
final class RNJSHangProfiler {
    private static final String PROFILER_CLASS = "com.facebook.hermes.instrumentation.HermesSamplingProfiler";
    private static final String PROFILE_DIR = "luciq_js_hang_profiles";
    private static final String EXCLUSIVE_OWNERSHIP_METADATA =
            "ai.luciq.reactnative.JSHangHermesProfilerExclusiveOwnership";
    private static final long MAX_PROFILE_BYTES = 1024L * 1024L;
    private static final int MAX_SAMPLES = 512;
    private static final int MAX_STACK_FRAMES = 4_000;
    private static final int MAX_RESULT_FRAMES = 64;
    private static final int MAX_STRING_LENGTH = 512;
    private static final int MAX_PERSISTED_FRAMES_CHARS = 8192;
    private static final Pattern SOURCE_FRAME =
            Pattern.compile("^(.*)\\((.+):(\\d+):(\\d+)\\)$");

    private static boolean available = true;
    private static boolean sampling = false;
    private static String capabilityStatus = "not_checked";

    private RNJSHangProfiler() {
    }

    static final class Frame {
        final String methodName;
        final String file;
        final long lineNumber;
        final long column;

        Frame(String methodName, String file, long lineNumber, long column) {
            this.methodName = bounded(methodName, "anonymous");
            this.file = bounded(file, "");
            this.lineNumber = Math.max(0L, lineNumber);
            this.column = Math.max(0L, column);
        }
    }

    static final class CaptureResult {
        final List<Frame> frames;
        final String stackCaptureMode;

        CaptureResult(List<Frame> frames, String stackCaptureMode) {
            this.frames = frames;
            this.stackCaptureMode = stackCaptureMode;
        }
    }

    /** Starts sampling. Called from the watchdog thread at hang detection, mid-hang. */
    static synchronized boolean start(Context context) {
        if (sampling) {
            return true;
        }
        if (!available || !hasExclusiveOwnership(context) || !hasWorkingNativeDisable()) {
            return false;
        }
        try {
            Method enable = Class.forName(PROFILER_CLASS).getMethod("enable");
            // Mark first: if JNI throws after partially enabling, the catch path
            // still attempts cleanup.
            sampling = true;
            enable.invoke(null);
            capabilityStatus = "hermes_sampling";
            LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG, "[profiler] sampling started");
            return true;
        } catch (ClassNotFoundException | UnsatisfiedLinkError | NoClassDefFoundError e) {
            available = false;
            capabilityStatus = "unavailable";
            LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG, "[profiler] unavailable: " + e.getClass().getSimpleName());
            return false;
        } catch (Throwable e) {
            capabilityStatus = "enable_failed";
            if (sampling) {
                disableInternal();
                sampling = false;
            }
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[profiler] enable failed", e);
            return false;
        }
    }

    static synchronized CaptureResult dumpAndStop(
            Context context, long hangStartEpochMs, String bundleName, long sampleWindowMs) {
        if (!sampling) {
            return new CaptureResult(new ArrayList<Frame>(), capabilityStatus);
        }
        File trace = null;
        List<Frame> frames = new ArrayList<>();
        String mode = "hermes_sampling_empty";
        try {
            Class<?> profiler = Class.forName(PROFILER_CLASS);
            File dir = new File(context.getFilesDir(), PROFILE_DIR);
            if (!dir.exists() && !dir.mkdirs()) {
                throw new IllegalStateException("Could not create profile directory");
            }
            trace = new File(dir, "js_hang_" + hangStartEpochMs + ".cpuprofile");

            Method dump = profiler.getMethod("dumpSampledTraceToFile", String.class);
            dump.invoke(null, trace.getAbsolutePath());
            // Stop before parsing so the sampling interval remains fixed and
            // parser work cannot extend global profiler ownership.
            disableInternal();
            sampling = false;
            frames = parseCulpritFrames(trace, bundleName, sampleWindowMs);
            mode = frames.isEmpty() ? "hermes_sampling_empty" : "hermes_sampling";
        } catch (Throwable e) {
            mode = "hermes_sampling_failed";
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[profiler] dump failed", e);
        } finally {
            if (sampling) {
                disableInternal();
            }
            sampling = false;
            if (trace != null && trace.exists() && !trace.delete()) {
                LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG, "[profiler] could not delete trace");
            }
        }
        return new CaptureResult(frames, mode);
    }

    /** Idempotently stops sampling without retaining a trace. */
    static synchronized void abort() {
        if (!sampling) {
            return;
        }
        disableInternal();
        sampling = false;
    }

    static synchronized String getCapabilityStatus(@Nullable Context context) {
        if (context == null || !hasExclusiveOwnership(context)) {
            return "unavailable_process_global_ownership";
        }
        if (!hasWorkingNativeDisable()) {
            return capabilityStatus;
        }
        if ("not_checked".equals(capabilityStatus)
                || "unavailable_process_global_ownership".equals(capabilityStatus)
                || "unavailable_native_disable_shim".equals(capabilityStatus)) {
            try {
                Class.forName(PROFILER_CLASS);
                capabilityStatus = "hermes_sampling_available";
            } catch (Throwable e) {
                available = false;
                capabilityStatus = "unavailable";
            }
        }
        return capabilityStatus;
    }

    private static boolean hasExclusiveOwnership(Context context) {
        try {
            ApplicationInfo applicationInfo = context.getPackageManager().getApplicationInfo(
                    context.getPackageName(), PackageManager.GET_META_DATA);
            boolean guaranteed = applicationInfo.metaData != null
                    && applicationInfo.metaData.getBoolean(EXCLUSIVE_OWNERSHIP_METADATA, false);
            if (!guaranteed) {
                capabilityStatus = "unavailable_process_global_ownership";
            }
            return guaranteed;
        } catch (Throwable e) {
            capabilityStatus = "unavailable_process_global_ownership";
            return false;
        }
    }

    private static void disableInternal() {
        // Never RN's HermesSamplingProfiler.disable(): that Java binding is
        // wired to native enable() on 0.70.0-0.85.3, so stopping must go
        // through the SDK's own shim calling
        // HermesRuntime::disableSamplingProfiler directly.
        if (!RNHermesSamplingShim.disable()) {
            capabilityStatus = "disable_failed";
            available = false;
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[profiler] disable failed");
        }
    }

    private static boolean hasWorkingNativeDisable() {
        // RN's JNI registration maps the Java disable() binding to native
        // enable() (HermesSamplingProfiler.cpp registerNatives) - verified in
        // the shipped sources of every release tag from 0.70.0 through 0.85.3
        // (all 136 broken; fixed only in 0.86.0+, never backported). Stopping
        // therefore goes through the SDK's JNI shim, which calls
        // HermesRuntime::disableSamplingProfiler directly (the way iOS
        // already does in C++). A profiler that cannot be stopped must never
        // be started, so when the shim cannot resolve that symbol (JSC app,
        // missing library) this fails closed. Not permanent: libhermes may
        // simply not be loaded yet.
        if (RNHermesSamplingShim.isDisableAvailable()) {
            return true;
        }
        if (!"unavailable_native_disable_shim".equals(capabilityStatus)) {
            capabilityStatus = "unavailable_native_disable_shim";
            LuciqRNLogger.d(
                    LuciqRNDebugTags.JS_HANG,
                    "[profiler] disabled: native disable shim unavailable");
        }
        return false;
    }

    /**
     * Extracts the modal (most-sampled) leaf's parent chain from a Hermes
     * trace. When {@code sampleWindowMs} is positive, only samples within that
     * window from the earliest sample count: trace timestamps are microsecond
     * deltas on an engine-private clock, so relative filtering is the only
     * base-independent way to drop post-recovery samples.
     */
    static List<Frame> parseCulpritFrames(File trace, String bundleName, long sampleWindowMs) {
        List<Frame> result = new ArrayList<>();
        if (!trace.exists() || trace.length() <= 0L || trace.length() > MAX_PROFILE_BYTES) {
            return result;
        }
        try {
            byte[] bytes = readBounded(trace);
            JSONObject root = new JSONObject(new String(bytes, Charset.forName("UTF-8")));
            JSONArray samples = root.optJSONArray("samples");
            JSONObject stackFrames = root.optJSONObject("stackFrames");
            if (samples == null || stackFrames == null
                    || samples.length() == 0 || samples.length() > MAX_SAMPLES
                    || stackFrames.length() == 0 || stackFrames.length() > MAX_STACK_FRAMES) {
                return result;
            }

            double minTimestamp = Double.MAX_VALUE;
            for (int i = 0; i < samples.length(); i++) {
                JSONObject sample = samples.optJSONObject(i);
                if (sample != null && sample.has("ts")) {
                    minTimestamp = Math.min(minTimestamp, sample.optDouble("ts", Double.MAX_VALUE));
                }
            }
            double windowMicros = sampleWindowMs > 0L && minTimestamp < Double.MAX_VALUE
                    ? sampleWindowMs * 1000.0 : 0;

            Map<String, Integer> counts = new HashMap<>();
            String modalLeaf = null;
            int modalCount = 0;
            int filteredSamples = 0;
            for (int i = 0; i < samples.length(); i++) {
                JSONObject sample = samples.optJSONObject(i);
                if (sample == null || !sample.has("sf")) {
                    continue;
                }
                if (windowMicros > 0
                        && sample.optDouble("ts", minTimestamp) - minTimestamp > windowMicros) {
                    filteredSamples++;
                    continue;
                }
                String leaf = bounded(String.valueOf(sample.opt("sf")), "");
                if (leaf.length() == 0) {
                    continue;
                }
                int count = counts.containsKey(leaf) ? counts.get(leaf) + 1 : 1;
                counts.put(leaf, count);
                if (count > modalCount) {
                    modalCount = count;
                    modalLeaf = leaf;
                }
            }

            Set<String> visited = new HashSet<>();
            String frameId = modalLeaf;
            while (frameId != null && result.size() < MAX_RESULT_FRAMES && visited.add(frameId)) {
                JSONObject frame = stackFrames.optJSONObject(frameId);
                if (frame == null) {
                    break;
                }
                String name = bounded(frame.optString("name", ""), "");
                String category = bounded(frame.optString("category", ""), "");
                Matcher matcher = SOURCE_FRAME.matcher(name);
                if (matcher.matches()) {
                    result.add(new Frame(
                            matcher.group(1),
                            matcher.group(2),
                            parseLong(matcher.group(3)),
                            parseLong(matcher.group(4))));
                } else if ("JavaScript".equals(category) && frame.has("funcVirtAddr")) {
                    long address = nonNegativeAdd(
                            frame.optLong("funcVirtAddr", 0L), frame.optLong("offset", 0L));
                    result.add(new Frame(name, bounded(bundleName, "main.jsbundle"), 1L, address));
                }
                Object parent = frame.opt("parent");
                frameId = parent == null || parent == JSONObject.NULL
                        ? null : bounded(String.valueOf(parent), "");
            }
            LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG, "[profiler] parsed frames=" + result.size()
                    + " modalLeafSamples=" + modalCount
                    + " filteredPostRecoverySamples=" + filteredSamples);
        } catch (Throwable e) {
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[profiler] trace parse failed", e);
            result.clear();
        }
        return result;
    }

    /** Serializes bounded frames for the on-disk hang marker. */
    static String framesToJson(List<Frame> frames) {
        try {
            JSONArray array = new JSONArray();
            for (Frame frame : frames.subList(0, Math.min(frames.size(), MAX_RESULT_FRAMES))) {
                JSONObject json = new JSONObject();
                json.put("methodName", frame.methodName);
                json.put("file", frame.file);
                json.put("lineNumber", frame.lineNumber);
                json.put("column", frame.column);
                array.put(json);
            }
            String serialized = array.toString();
            return serialized.length() <= MAX_PERSISTED_FRAMES_CHARS ? serialized : "[]";
        } catch (Throwable e) {
            return "[]";
        }
    }

    /** Deserializes marker frames; malformed input degrades to an empty list. */
    static List<Frame> framesFromJson(@Nullable String json) {
        List<Frame> frames = new ArrayList<>();
        if (json == null || json.length() == 0 || json.length() > MAX_PERSISTED_FRAMES_CHARS) {
            return frames;
        }
        try {
            JSONArray array = new JSONArray(json);
            for (int i = 0; i < Math.min(array.length(), MAX_RESULT_FRAMES); i++) {
                JSONObject frame = array.optJSONObject(i);
                if (frame == null) {
                    continue;
                }
                frames.add(new Frame(
                        frame.optString("methodName", ""),
                        frame.optString("file", ""),
                        frame.optLong("lineNumber", 0L),
                        frame.optLong("column", 0L)));
            }
        } catch (Throwable e) {
            frames.clear();
        }
        return frames;
    }

    private static byte[] readBounded(File file) throws Exception {
        int size = (int) file.length();
        byte[] bytes = new byte[size];
        FileInputStream input = new FileInputStream(file);
        try {
            int offset = 0;
            while (offset < size) {
                int read = input.read(bytes, offset, size - offset);
                if (read < 0) {
                    break;
                }
                offset += read;
            }
            if (offset != size) {
                throw new IllegalStateException("Incomplete profile read");
            }
            return bytes;
        } finally {
            input.close();
        }
    }

    private static long parseLong(@Nullable String value) {
        try {
            return Math.max(0L, Long.parseLong(value == null ? "0" : value));
        } catch (NumberFormatException ignored) {
            return 0L;
        }
    }

    private static long nonNegativeAdd(long left, long right) {
        if (left < 0L || right < 0L || Long.MAX_VALUE - left < right) {
            return 0L;
        }
        return left + right;
    }

    private static String bounded(@Nullable String value, String fallback) {
        if (value == null || value.length() == 0) {
            return fallback;
        }
        return value.length() <= MAX_STRING_LENGTH
                ? value : value.substring(0, MAX_STRING_LENGTH);
    }
}
