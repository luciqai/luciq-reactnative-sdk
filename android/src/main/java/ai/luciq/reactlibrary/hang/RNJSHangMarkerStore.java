package ai.luciq.reactlibrary.hang;

import android.content.Context;

import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileInputStream;
import java.nio.charset.Charset;
import java.util.UUID;

import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;

/**
 * Persists a small on-disk marker while a JS thread hang is in progress.
 *
 * The marker is written when a hang crosses the threshold and deleted when the
 * JS thread recovers. A fresh marker found on launch only proves that observation
 * was interrupted; it does not prove why the previous process ended.
 */
final class RNJSHangMarkerStore {
    private static final String FILE_NAME = "luciq_js_hang_marker.json";
    private static final String KEY_SCHEMA_VERSION = "schema_version";
    private static final String KEY_HANG_START = "hang_start_epoch_ms";
    private static final String KEY_LAST_GAP = "last_observed_gap_ms";
    private static final String KEY_UPDATED_AT = "updated_at_epoch_ms";
    private static final String KEY_SESSION_ID = "session_id";
    private static final String KEY_FRAMES = "frames";
    private static final String KEY_STACK_CAPTURE_MODE = "stack_capture_mode";
    private static final int SCHEMA_VERSION = 1;
    private static final long MAX_MARKER_AGE_MS = 24L * 60L * 60L * 1000L;
    private static final long MAX_FUTURE_SKEW_MS = 5L * 60L * 1000L;
    private static final long MAX_OBSERVED_GAP_MS = 24L * 60L * 60L * 1000L;

    static final class Marker {
        final long hangStartEpochMs;
        final long lastObservedGapMs;
        final String sessionId;
        @Nullable
        final String framesJson;
        @Nullable
        final String stackCaptureMode;

        Marker(long hangStartEpochMs, long lastObservedGapMs, String sessionId,
               @Nullable String framesJson, @Nullable String stackCaptureMode) {
            this.hangStartEpochMs = hangStartEpochMs;
            this.lastObservedGapMs = lastObservedGapMs;
            this.sessionId = sessionId;
            this.framesJson = framesJson;
            this.stackCaptureMode = stackCaptureMode;
        }
    }

    private final File file;
    private final String sessionId = UUID.randomUUID().toString();

    RNJSHangMarkerStore(Context context) {
        this.file = new File(context.getFilesDir(), FILE_NAME);
    }

    void persist(long hangStartEpochMs, long lastObservedGapMs,
                 @Nullable String framesJson, @Nullable String stackCaptureMode) {
        try {
            long nowEpochMs = System.currentTimeMillis();
            if (hangStartEpochMs <= 0L || hangStartEpochMs > nowEpochMs + MAX_FUTURE_SKEW_MS
                    || lastObservedGapMs <= 0L || lastObservedGapMs > MAX_OBSERVED_GAP_MS) {
                return;
            }
            JSONObject json = new JSONObject();
            json.put(KEY_SCHEMA_VERSION, SCHEMA_VERSION);
            json.put(KEY_HANG_START, hangStartEpochMs);
            json.put(KEY_LAST_GAP, lastObservedGapMs);
            json.put(KEY_UPDATED_AT, nowEpochMs);
            json.put(KEY_SESSION_ID, sessionId);
            if (framesJson != null && framesJson.length() > 2
                    && stackCaptureMode != null && stackCaptureMode.length() > 0) {
                json.put(KEY_FRAMES, new JSONArray(framesJson));
                json.put(KEY_STACK_CAPTURE_MODE, stackCaptureMode);
            }
            byte[] bytes = json.toString().getBytes(Charset.forName("UTF-8"));
            FileOutputStream out = new FileOutputStream(file);
            try {
                out.write(bytes);
            } finally {
                out.close();
            }
        } catch (Throwable e) {
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[persist] failed to write hang marker", e);
        }
    }

    @Nullable
    Marker load() {
        try {
            if (!file.exists()) {
                return null;
            }
            if (file.length() <= 0L) {
                clear();
                return null;
            }
            byte[] buffer = new byte[(int) file.length()];
            FileInputStream in = new FileInputStream(file);
            try {
                int read = in.read(buffer);
                if (read <= 0) {
                    return null;
                }
            } finally {
                in.close();
            }
            JSONObject json = new JSONObject(new String(buffer, Charset.forName("UTF-8")));
            long nowEpochMs = System.currentTimeMillis();
            long updatedAtEpochMs = json.optLong(KEY_UPDATED_AT, -1L);
            long hangStartEpochMs = json.optLong(KEY_HANG_START, -1L);
            long lastObservedGapMs = json.optLong(KEY_LAST_GAP, -1L);
            String storedSessionId = json.optString(KEY_SESSION_ID, "");
            // Torn writes (the marker exists to survive unclean process death)
            // and cross-reboot clock skew are the realistic corruption cases.
            if (json.optInt(KEY_SCHEMA_VERSION, -1) != SCHEMA_VERSION
                    || updatedAtEpochMs <= 0L
                    || updatedAtEpochMs > nowEpochMs + MAX_FUTURE_SKEW_MS
                    || nowEpochMs - updatedAtEpochMs > MAX_MARKER_AGE_MS
                    || hangStartEpochMs <= 0L
                    || lastObservedGapMs <= 0L
                    || lastObservedGapMs > MAX_OBSERVED_GAP_MS
                    || storedSessionId.length() == 0) {
                clear();
                return null;
            }
            JSONArray frames = json.optJSONArray(KEY_FRAMES);
            String framesJson = frames == null ? null : frames.toString();
            String stackCaptureMode = json.optString(KEY_STACK_CAPTURE_MODE, "");
            return new Marker(hangStartEpochMs, lastObservedGapMs, storedSessionId,
                    framesJson,
                    framesJson == null || stackCaptureMode.length() == 0 ? null : stackCaptureMode);
        } catch (Throwable e) {
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[load] failed to read hang marker", e);
            clear();
            return null;
        }
    }

    @Nullable
    Marker consume() {
        try {
            return load();
        } finally {
            clear();
        }
    }

    boolean isCurrentSession(Marker marker) {
        return marker != null && sessionId.equals(marker.sessionId);
    }

    void clear() {
        try {
            if (file.exists()) {
                //noinspection ResultOfMethodCallIgnored
                file.delete();
            }
        } catch (Throwable e) {
            LuciqRNLogger.e(LuciqRNDebugTags.JS_HANG, "[clear] failed to delete hang marker", e);
        }
    }
}
