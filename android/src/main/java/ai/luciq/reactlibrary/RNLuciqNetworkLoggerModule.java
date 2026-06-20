package ai.luciq.reactlibrary;


import static ai.luciq.apm.configuration.cp.APMFeature.APM_NETWORK_PLUGIN_INSTALLED;
import static ai.luciq.apm.configuration.cp.APMFeature.CP_NATIVE_INTERCEPTION_ENABLED;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import ai.luciq.apm.InternalAPM;
import ai.luciq.apm.sanitization.OnCompleteCallback;
import ai.luciq.library.logging.listeners.networklogs.NetworkLogSnapshot;
import ai.luciq.reactlibrary.utils.EventEmitterModule;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


public class RNLuciqNetworkLoggerModule extends EventEmitterModule {

    public final ConcurrentHashMap<String, OnCompleteCallback<NetworkLogSnapshot>> callbackMap = new ConcurrentHashMap<String, OnCompleteCallback<NetworkLogSnapshot>>();

    public RNLuciqNetworkLoggerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }


    @NonNull
    @Override
    public String getName() {
        return "LCQNetworkLogger";
    }


    @ReactMethod
    public void addListener(String event) {
        LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[addListener] called event=" + event);
        super.addListener(event);
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[removeListeners] called count=" + count);
        super.removeListeners(count);
    }

    private boolean getFlagValue(String key) {
        boolean value = InternalAPM._isFeatureEnabledCP(key, "");
        LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[getFlagValue] key=" + key + ", value=" + value);
        return value;
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
        LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[isNativeInterceptionEnabled] Querying CP_NATIVE_INTERCEPTION_ENABLED flag");
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    boolean enabled = getFlagValue(CP_NATIVE_INTERCEPTION_ENABLED);
                    LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[isNativeInterceptionEnabled] Result=" + enabled);
                    promise.resolve(enabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.NETWORK, "[isNativeInterceptionEnabled] Error - falling back to false (JS interceptor)", e);
                    promise.resolve(false);
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
        LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[hasAPMNetworkPlugin] Querying APM_NETWORK_PLUGIN_INSTALLED flag");
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    boolean hasPlugin = getFlagValue(APM_NETWORK_PLUGIN_INSTALLED);
                    LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[hasAPMNetworkPlugin] Result=" + hasPlugin);
                    promise.resolve(hasPlugin);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.NETWORK, "[hasAPMNetworkPlugin] Error - falling back to false", e);
                    promise.resolve(false);
                }

            }
        });
    }


    @ReactMethod
    public void registerNetworkLogsListener() {
        LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[registerNetworkLogsListener] Registering network log sanitizer");
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                InternalAPM._registerNetworkLogSanitizer((networkLogSnapshot, onCompleteCallback) -> {
                    final String id = String.valueOf(onCompleteCallback.hashCode());
                    callbackMap.put(id, onCompleteCallback);
                    LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[NetworkLogSanitizer] Received snapshot — id=" + id + ", url=" + LuciqRNLogger.redactUrl(networkLogSnapshot.getUrl()) + ", responseCode=" + networkLogSnapshot.getResponseCode() + ", callbackMapSize=" + callbackMap.size());

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
                    LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[NetworkLogSanitizer] Sent event to JS: " + Constants.LCQ_NETWORK_LOGGER_HANDLER + " for " + LuciqRNLogger.redactUrl(networkLogSnapshot.getUrl()));
                });
            }
        });
    }

    @ReactMethod
    public void resetNetworkLogsListener() {
        LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[resetNetworkLogsListener] Clearing network log sanitizer, callbackMapSize=" + callbackMap.size());
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                InternalAPM._registerNetworkLogSanitizer(null);
                LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[resetNetworkLogsListener] Sanitizer cleared");
            }
        });
    }

    @ReactMethod
    public void updateNetworkLogSnapshot(
            String url,
            String callbackID,
            String requestBody,
            String responseBody,
            int responseCode,
            ReadableMap requestHeaders,
            ReadableMap responseHeaders
    ) {
        LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[updateNetworkLogSnapshot] callbackID=" + callbackID + ", url=" + LuciqRNLogger.redactUrl(url) + ", responseCode=" + responseCode + ", callbackMapSize=" + callbackMap.size());
        try {
            Map<String, Object> requestHeadersMap = convertReadableMapToMap(requestHeaders);
            Map<String, Object> responseHeadersMap = convertReadableMapToMap(responseHeaders);

            NetworkLogSnapshot modifiedSnapshot = null;
            if (!url.isEmpty()) {
                modifiedSnapshot = new NetworkLogSnapshot(url, requestHeadersMap, requestBody, responseHeadersMap, responseBody, responseCode);
            } else {
                LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[updateNetworkLogSnapshot] Empty URL — snapshot will be null (request filtered/removed)");
            }

            final OnCompleteCallback<NetworkLogSnapshot> callback = callbackMap.get(callbackID);
            if (callback != null) {
                callback.onComplete(modifiedSnapshot);
                callbackMap.remove(callbackID);
                LuciqRNLogger.d(LuciqRNDebugTags.NETWORK, "[updateNetworkLogSnapshot] Callback invoked and removed for " + callbackID + ", remaining=" + callbackMap.size());
            } else {
                LuciqRNLogger.e(LuciqRNDebugTags.NETWORK, "[updateNetworkLogSnapshot] No callback found for callbackID=" + callbackID + " — possible leak or duplicate call, mapKeys=" + callbackMap.keySet());
            }
        } catch (Exception e) {
            LuciqRNLogger.e(LuciqRNDebugTags.NETWORK, "[updateNetworkLogSnapshot] Exception processing snapshot: " + e.getMessage() + " for callbackID=" + callbackID, e);
        }
    }
}
