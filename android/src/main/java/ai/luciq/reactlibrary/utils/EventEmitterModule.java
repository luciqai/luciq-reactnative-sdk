package ai.luciq.reactlibrary.utils;

import android.util.Log;

import androidx.annotation.Nullable;
import androidx.annotation.VisibleForTesting;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public abstract class EventEmitterModule extends ReactContextBaseJavaModule {
    private static final String NET_TAG = "LCQ-RN-NET";
    private int listenerCount = 0;

    public EventEmitterModule(ReactApplicationContext context) {
        super(context);
    }

    @VisibleForTesting
    public void sendEvent(String event, @Nullable ReadableMap params) {
        if (listenerCount > 0) {
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(event, params);
        } else {
            Log.w(NET_TAG, "[EventEmitter] Event DROPPED (no JS listeners): event=" + event + ", module=" + getName() + ", listenerCount=0");
        }
    }

    protected void addListener(String ignoredEvent) {
        listenerCount++;
        Log.d(NET_TAG, "[EventEmitter] addListener — module=" + getName() + ", event=" + ignoredEvent + ", listenerCount=" + listenerCount);
    }

    protected void removeListeners(Integer count) {
        listenerCount -= count;
        Log.d(NET_TAG, "[EventEmitter] removeListeners — module=" + getName() + ", removed=" + count + ", listenerCount=" + listenerCount);
    }
}
