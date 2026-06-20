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
     * Returns {@code url} with its userinfo, query string, and fragment
     * stripped for safe logging. Mirrors {@code redactUrlForLog} in
     * src/utils/LuciqUtils.ts:
     * <ul>
     *   <li>Userinfo ({@code scheme://user:pass@host/...}) is removed from the
     *       authority. Only {@code @} characters appearing inside the
     *       authority (between {@code ://} and the next {@code /}, {@code ?},
     *       or {@code #}) are treated as userinfo - {@code @} in a path is
     *       preserved.</li>
     *   <li>When a query was present (a {@code ?} preceded any {@code #}),
     *       the result has {@code ?<redacted>} appended.</li>
     *   <li>Fragment-only cutoff is silent.</li>
     *   <li>null/empty input returns {@code ""}.</li>
     * </ul>
     */
    public static String redactUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }
        // Strip userinfo from the authority, if present.
        String stripped = url;
        int schemeEnd = stripped.indexOf("://");
        if (schemeEnd != -1) {
            int authorityStart = schemeEnd + 3;
            int authorityEnd = stripped.length();
            for (int i = authorityStart; i < stripped.length(); i++) {
                char c = stripped.charAt(i);
                if (c == '/' || c == '?' || c == '#') {
                    authorityEnd = i;
                    break;
                }
            }
            int atIdx = stripped.lastIndexOf('@', authorityEnd - 1);
            if (atIdx >= authorityStart && atIdx < authorityEnd) {
                stripped = stripped.substring(0, authorityStart) + stripped.substring(atIdx + 1);
            }
        }

        int queryIdx = stripped.indexOf('?');
        int fragIdx = stripped.indexOf('#');
        int cutoff = -1;
        if (queryIdx != -1) {
            cutoff = queryIdx;
        }
        if (fragIdx != -1 && (cutoff == -1 || fragIdx < cutoff)) {
            cutoff = fragIdx;
        }
        if (cutoff == -1) {
            return stripped;
        }
        // Only mark a redacted query when the `?` preceded any `#`. A `?`
        // inside a fragment is part of the fragment, not a query.
        boolean cutAtQuery = queryIdx != -1 && (fragIdx == -1 || queryIdx < fragIdx);
        String base = stripped.substring(0, cutoff);
        return cutAtQuery ? base + "?<redacted>" : base;
    }
}
