package ai.luciq.reactlibrary;

import android.os.Handler;
import android.os.Looper;
import android.view.Choreographer;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import android.util.Log;

public class LuciqScreenLoadingFrameTracker {
    private static final String TAG = "ScreenLoading";
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
        Log.d(TAG, "Frame tracking initialized");
    }

    public void startTrackingForSpanId(final String spanId) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                activeSpanIds.add(spanId);
                Log.d(TAG, "Started tracking for span " + spanId);

                Choreographer.getInstance().postFrameCallback(new Choreographer.FrameCallback() {
                    @Override
                    public void doFrame(long frameTimeNanos) {
                        if (activeSpanIds.contains(spanId)) {
                            long timestampMicroseconds = System.currentTimeMillis() * 1000;
                            spanIdToTimestamp.put(spanId, timestampMicroseconds);
                            activeSpanIds.remove(spanId);
                            Log.d(TAG, "Frame rendered for span " + spanId + " at " + timestampMicroseconds + "μs");

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
            Log.d(TAG, "Retrieved timestamp " + timestamp + "μs for span " + spanId);
        }
        return timestamp;
    }

    private void cleanup() {
        // Keep only the most recent 30 entries
        if (spanIdToTimestamp.size() > 30) {
            // Simple cleanup: remove oldest entries
            int toRemove = spanIdToTimestamp.size() - 30;
            for (String key : new HashSet<>(spanIdToTimestamp.keySet())) {
                if (toRemove-- <= 0) break;
                spanIdToTimestamp.remove(key);
            }
        }
    }
}
