package ai.luciq.reactlibrary;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

abstract class RNLuciqSurveysBaseSpec extends NativeSurveysSpec {
    private int listenerCount = 0;

    RNLuciqSurveysBaseSpec(ReactApplicationContext context) {
        super(context);
    }

    public void sendEvent(String event, @Nullable ReadableMap params) {
        if (listenerCount > 0) {
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(event, params);
        }
    }

    @Override
    public void addListener(String eventName) {
        listenerCount++;
    }

    @Override
    public void removeListeners(double count) {
        listenerCount = Math.max(0, listenerCount - (int) count);
    }
}
