package ai.luciq.reactlibrary;

import android.os.Handler;
import android.os.Looper;
import android.view.Choreographer;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;

public class LuciqScreenLoadingFrameTracker {
    private static final String TAG = LuciqRNDebugTags.APM_SCREEN_LOADING;
    private static LuciqScreenLoadingFrameTracker instance;

    private final Map<String, Long> spanIdToTimestamp = new HashMap<>();
    private final Set<String> activeSpanIds = new HashSet<>();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private static final int MAX_STORAGE_CAPACITY = 50;

    private LuciqScreenLoadingFrameTracker() {}

    public static synchronized LuciqScreenLoadingFrameTracker getInstance() {
        if (instance == null) {
            instance = new LuciqScreenLoadingFrameTracker();
        }
        return instance;
    }

    public void initializeFrameTracking() {
        // Choreographer is automatically available on Android
        LuciqRNLogger.d(TAG, "Frame tracking initialized");
    }

    public void startTrackingForSpanId(final String spanId) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                activeSpanIds.add(spanId);
                LuciqRNLogger.d(TAG, "Started tracking for span " + spanId);

                Choreographer.getInstance().postFrameCallback(new Choreographer.FrameCallback() {
                    @Override
                    public void doFrame(long frameTimeNanos) {
                        if (activeSpanIds.contains(spanId)) {
                            // frameTimeNanos is monotonic clock (nanoseconds since device boot)
                            // Convert to epoch-based microseconds using offset correction
                            long currentMonotonicNanos = System.nanoTime();
                            long currentEpochMillis = System.currentTimeMillis();
                            long nanosSinceFrame = currentMonotonicNanos - frameTimeNanos;
                            long frameEpochMicroseconds = (currentEpochMillis * 1000) - (nanosSinceFrame / 1000);

                            spanIdToTimestamp.put(spanId, frameEpochMicroseconds);
                            activeSpanIds.remove(spanId);
                            LuciqRNLogger.d(TAG, "Frame rendered for span " + spanId + " at " + frameEpochMicroseconds +
                                  "μs (frame offset: " + String.format("%.3f", nanosSinceFrame / 1_000_000.0) + "ms)");

                            if (spanIdToTimestamp.size() > MAX_STORAGE_CAPACITY) {
                                cleanup();
                            }
                        }
                    }
                });
            }
        });
    }

    public Long getFrameTimestampForSpanId(String spanId) {
        Long timestamp = spanIdToTimestamp.get(spanId);
        if (timestamp != null) {
            spanIdToTimestamp.remove(spanId);
            LuciqRNLogger.d(TAG, "Retrieved timestamp " + timestamp + "μs for span " + spanId);
        }
        return timestamp;
    }

    private void cleanup() {
        // Keep only the most recent 30 entries
        if (spanIdToTimestamp.size() > 30) {
            // Simple cleanup: remove oldest entries
            int toRemove = spanIdToTimestamp.size() - 30;
            int retained = spanIdToTimestamp.size() - toRemove;
            LuciqRNLogger.w(TAG, "Evicting frame timestamps (capacity reached) removed=" + toRemove + ", retained=" + retained);
            for (String key : new HashSet<>(spanIdToTimestamp.keySet())) {
                if (toRemove-- <= 0) break;
                spanIdToTimestamp.remove(key);
            }
        }
    }
}
