package ai.luciq.reactlibrary;


import static ai.luciq.apm.configuration.cp.APMFeature.APM_NETWORK_PLUGIN_INSTALLED;
import static ai.luciq.apm.configuration.cp.APMFeature.CP_NATIVE_INTERCEPTION_ENABLED;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import ai.luciq.apm.InternalAPM;
import ai.luciq.apm.sanitization.OnCompleteCallback;
import ai.luciq.library.logging.listeners.networklogs.NetworkLogSnapshot;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


public class RNLuciqNetworkLoggerModule extends NativeNetworkLoggerSpec {

    public final ConcurrentHashMap<String, OnCompleteCallback<NetworkLogSnapshot>> callbackMap = new ConcurrentHashMap<String, OnCompleteCallback<NetworkLogSnapshot>>();

    private int listenerCount = 0;

    public RNLuciqNetworkLoggerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    protected void sendEvent(String event, @Nullable ReadableMap params) {
        if (listenerCount > 0) {
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(event, params);
        }
    }

    @ReactMethod
    public void addListener(String event) {
        listenerCount++;
    }

    @ReactMethod
    public void removeListeners(double count) {
        listenerCount -= (int) count;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean isNativeInterceptionEnabled() {
        return getFlagValue(CP_NATIVE_INTERCEPTION_ENABLED);
    }

    // iOS-only stubs; present to satisfy TurboModule spec contract.
    @ReactMethod
    public void setNetworkLoggingRequestFilterPredicateIOS(String id, boolean value) {}

    @ReactMethod
    public void forceStartNetworkLoggingIOS() {}

    @ReactMethod
    public void forceStopNetworkLoggingIOS() {}

    private boolean getFlagValue(String key) {
        return InternalAPM._isFeatureEnabledCP(key, "");
    }

    private WritableMap convertFromMapToWritableMap(Map<String, Object> map) {
        WritableMap writableMap = new WritableNativeMap();
        for (String key : map.keySet()) {
            Object value = map.get(key);
            writableMap.putString(key, (String) value);
        }
        return writableMap;
    }

    private Map<String, Object> convertReadableMapToMap(ReadableMap readableMap) {
        Map<String, Object> map = new HashMap<>();
        if (readableMap != null) {
            ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
            while (iterator.hasNextKey()) {
                String key = iterator.nextKey();
                map.put(key, readableMap.getString(key));
            }
        }
        return map;
    }

    /**
     * Get first time Value of [cp_native_interception_enabled] flag
     */
    @ReactMethod
    public void isNativeInterceptionEnabled(Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    promise.resolve(getFlagValue(CP_NATIVE_INTERCEPTION_ENABLED));
                } catch (Exception e) {
                    e.printStackTrace();
                    promise.resolve(false); // Will rollback to JS interceptor
                }

            }
        });
    }

    /**
     * Indicate if user added APM Network plugin or not
     * [true] means user added the APM plugin
     * [false] means not
     */
    @ReactMethod
    public void hasAPMNetworkPlugin(Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    promise.resolve(getFlagValue(APM_NETWORK_PLUGIN_INSTALLED));
                } catch (Exception e) {
                    e.printStackTrace();
                    promise.resolve(false);  // Will rollback to JS interceptor
                }

            }
        });
    }


    @ReactMethod
    public void registerNetworkLogsListener(@Nullable final String type) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                InternalAPM._registerNetworkLogSanitizer((networkLogSnapshot, onCompleteCallback) -> {
                    final String id = String.valueOf(onCompleteCallback.hashCode());
                    callbackMap.put(id, onCompleteCallback);

                    WritableMap networkSnapshotParams = Arguments.createMap();
                    networkSnapshotParams.putString("id", id);
                    networkSnapshotParams.putString("url", networkLogSnapshot.getUrl());
                    networkSnapshotParams.putInt("responseCode", networkLogSnapshot.getResponseCode());
                    networkSnapshotParams.putString("requestBody", networkLogSnapshot.getRequestBody());
                    networkSnapshotParams.putString("response", networkLogSnapshot.getResponse());
                    final Map<String, Object> requestHeaders = networkLogSnapshot.getRequestHeaders();
                    if (requestHeaders != null) {
                        networkSnapshotParams.putMap("requestHeader", convertFromMapToWritableMap(requestHeaders));
                    }
                    final Map<String, Object> responseHeaders = networkLogSnapshot.getResponseHeaders();
                    if (responseHeaders != null) {
                        networkSnapshotParams.putMap("responseHeader", convertFromMapToWritableMap(responseHeaders));
                    }

                    sendEvent(Constants.LCQ_NETWORK_LOGGER_HANDLER, networkSnapshotParams);
                });
            }
        });
    }

    @ReactMethod
    public void resetNetworkLogsListener() {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                InternalAPM._registerNetworkLogSanitizer(null);
            }
        });
    }

    @ReactMethod
    public void updateNetworkLogSnapshot(
            String url,
            String callbackID,
            @Nullable String requestBody,
            @Nullable String responseBody,
            double responseCode,
            ReadableMap requestHeaders,
            ReadableMap responseHeaders
    ) {
        try {
            // Convert ReadableMap to a Java Map for easier handling
            Map<String, Object> requestHeadersMap = convertReadableMapToMap(requestHeaders);
            Map<String, Object> responseHeadersMap = convertReadableMapToMap(responseHeaders);

            NetworkLogSnapshot modifiedSnapshot = null;
            if (!url.isEmpty()) {
                modifiedSnapshot = new NetworkLogSnapshot(url, requestHeadersMap, requestBody, responseHeadersMap, responseBody, (int) responseCode);
            }

            final OnCompleteCallback<NetworkLogSnapshot> callback = callbackMap.get(callbackID);
            if (callback != null) {
                callback.onComplete(modifiedSnapshot);
                callbackMap.remove(callbackID);
            }
        } catch (Exception e) {
            // Reject the promise to indicate an error occurred
            Log.e("IB-CP-Bridge", "LuciqNetworkLogger.updateNetworkLogSnapshot failed to parse the network snapshot object.");
        }
    }
}
