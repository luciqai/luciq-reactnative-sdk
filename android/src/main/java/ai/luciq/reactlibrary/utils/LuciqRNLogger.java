package ai.luciq.reactlibrary.utils;

import android.util.Log;

import ai.luciq.library.LogLevel;

/**
 * Bridge-side logger that gates android.util.Log calls on the same
 * debugLogsLevel the host app passes to Luciq.init(), so the native
 * RN bridge diagnostic logs do not leak in production builds when the
 * JS-side Logger is silent.
 *
 * Mirrors the level hierarchy in src/utils/logger.ts:
 *   VERBOSE > DEBUG > ERROR > NONE
 */
public final class LuciqRNLogger {

    private static volatile int currentLevel = LogLevel.ERROR;

    private LuciqRNLogger() {}

    public static void setLevel(int level) {
        currentLevel = level;
    }

    public static int getLevel() {
        return currentLevel;
    }

    public static void d(String tag, String message) {
        if (currentLevel >= LogLevel.DEBUG) {
            Log.d(tag, message);
        }
    }

    public static void w(String tag, String message) {
        if (currentLevel >= LogLevel.DEBUG) {
            Log.w(tag, message);
        }
    }

    public static void e(String tag, String message) {
        if (currentLevel >= LogLevel.ERROR) {
            Log.e(tag, message);
        }
    }

    public static void e(String tag, String message, Throwable throwable) {
        if (currentLevel >= LogLevel.ERROR) {
            Log.e(tag, message, throwable);
        }
    }
}
