package ai.luciq.reactlibrary.hang;

import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;

/**
 * SDK-owned JNI shim for stopping the Hermes sampling profiler.
 *
 * RN's Java binding (HermesSamplingProfiler.disable) is wired to native
 * enable() on every release from 0.70.0 through 0.85.3 (fixed only in
 * 0.86.0, never backported), so a profiler stopped through it silently keeps
 * sampling. The shim resolves
 * {@code facebook::hermes::HermesRuntime::disableSamplingProfiler()} from the
 * already-loaded libhermes.so (dlopen RTLD_NOLOAD + dlsym) and calls it
 * directly, which works on all RN versions and degrades to "unavailable" on
 * JSC apps where libhermes is never loaded.
 */
final class RNHermesSamplingShim {
    private static boolean loadAttempted = false;
    private static boolean loaded = false;

    private RNHermesSamplingShim() {
    }

    /** True when the shim library is loaded and Hermes' disable symbol resolves. */
    static boolean isDisableAvailable() {
        if (!ensureLoaded()) {
            return false;
        }
        try {
            return nativeIsDisableAvailable();
        } catch (Throwable e) {
            return false;
        }
    }

    /** Stops sampling via Hermes' C++ API. Returns false when it could not. */
    static boolean disable() {
        if (!ensureLoaded()) {
            return false;
        }
        try {
            return nativeDisable();
        } catch (Throwable e) {
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[profiler] shim disable failed", e);
            return false;
        }
    }

    private static synchronized boolean ensureLoaded() {
        if (loadAttempted) {
            return loaded;
        }
        loadAttempted = true;
        try {
            System.loadLibrary("luciq-rn-jshang");
            loaded = true;
        } catch (Throwable e) {
            LuciqRNLogger.d(LuciqRNDebugTags.JS_HANG,
                    "[profiler] shim library unavailable: " + e.getClass().getSimpleName());
        }
        return loaded;
    }

    private static native boolean nativeIsDisableAvailable();

    private static native boolean nativeDisable();
}
