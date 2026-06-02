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

    /**
     * Returns {@code url} with its query string and fragment stripped for
     * safe logging. Mirrors {@code redactUrlForLog} in
     * src/utils/LuciqUtils.ts: when a query was present (i.e. a {@code ?}
     * preceded any {@code #}), the result has {@code ?<redacted>} appended;
     * otherwise the cutoff is silent. null/empty input returns {@code ""}.
     */
    public static String redactUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }
        int queryIdx = url.indexOf('?');
        int fragIdx = url.indexOf('#');
        int cutoff = -1;
        if (queryIdx != -1) {
            cutoff = queryIdx;
        }
        if (fragIdx != -1 && (cutoff == -1 || fragIdx < cutoff)) {
            cutoff = fragIdx;
        }
        if (cutoff == -1) {
            return url;
        }
        // Only mark a redacted query when the `?` preceded any `#`. A `?`
        // inside a fragment is part of the fragment, not a query.
        boolean cutAtQuery = queryIdx != -1 && (fragIdx == -1 || queryIdx < fragIdx);
        String base = url.substring(0, cutoff);
        return cutAtQuery ? base + "?<redacted>" : base;
    }
}
