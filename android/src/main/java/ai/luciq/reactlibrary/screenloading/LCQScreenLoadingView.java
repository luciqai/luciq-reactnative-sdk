package ai.luciq.reactlibrary.screenloading;

import android.content.Context;
import android.graphics.Canvas;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class LCQScreenLoadingView extends FrameLayout {

    public enum DisplayType {
        INITIAL_DISPLAY(0),
        FULL_DISPLAY(1);

        private final int value;
        DisplayType(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }
    }

    private ThemedReactContext reactContext;
    private DisplayType displayType = DisplayType.INITIAL_DISPLAY;
    private boolean record = false;
    private String screenName = "";
    private boolean hasReportedDisplay = false;
    private long startTime;
    private Handler mainHandler;
    private ViewTreeObserver.OnDrawListener drawListener;

    public LCQScreenLoadingView(ThemedReactContext context) {
        super(context);
        this.reactContext = context;
        this.startTime = System.currentTimeMillis();
        this.mainHandler = new Handler(Looper.getMainLooper());
        setWillNotDraw(false); // Ensure onDraw is called
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        if (!hasReportedDisplay && record) {
            hasReportedDisplay = true;

            // Report on next frame to ensure complete render
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    reportDisplayComplete();
                }
            });
        }
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();

        // Alternative measurement using ViewTreeObserver
        if (!hasReportedDisplay && record) {
            drawListener = new ViewTreeObserver.OnDrawListener() {
                private boolean invoked = false;

                @Override
                public void onDraw() {
                    if (invoked) return;
                    invoked = true;

                    if (!hasReportedDisplay && record) {
                        hasReportedDisplay = true;
                        reportDisplayComplete();
                    }

                    // Remove listener on next frame to avoid IllegalStateException
                    mainHandler.post(new Runnable() {
                        @Override
                        public void run() {
                            ViewTreeObserver observer = getViewTreeObserver();
                            if (observer.isAlive()) {
                                observer.removeOnDrawListener(drawListener);
                            }
                        }
                    });
                }
            };

            getViewTreeObserver().addOnDrawListener(drawListener);
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();

        if (drawListener != null) {
            ViewTreeObserver observer = getViewTreeObserver();
            if (observer.isAlive()) {
                observer.removeOnDrawListener(drawListener);
            }
            drawListener = null;
        }
    }

    private void reportDisplayComplete() {
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        WritableMap event = Arguments.createMap();
        event.putInt("type", displayType.getValue());
        event.putString("screenName", screenName);
        event.putDouble("startTime", startTime);
        event.putDouble("endTime", endTime);
        event.putDouble("duration", duration);

        reactContext.getJSModule(RCTEventEmitter.class)
                .receiveEvent(getId(), "onDisplay", event);

        // Report to native SDK (will be connected in Phase 3)
        String spanName = displayType == DisplayType.INITIAL_DISPLAY
            ? "ui.load.initial_display"
            : "ui.load.full_display";

        // APM.reportScreenLoadingSpan(spanName, duration, screenName);
    }

    // Setters for props
    public void setDisplayType(String type) {
        if ("fullDisplay".equals(type)) {
            this.displayType = DisplayType.FULL_DISPLAY;
        } else {
            this.displayType = DisplayType.INITIAL_DISPLAY;
        }
    }

    public void setRecord(boolean record) {
        this.record = record;
        if (record && !hasReportedDisplay) {
            invalidate(); // Trigger onDraw if not already drawn
        }
    }

    public void setScreenName(String screenName) {
        this.screenName = screenName;
    }
}