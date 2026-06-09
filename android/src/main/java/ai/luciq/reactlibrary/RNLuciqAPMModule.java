package ai.luciq.reactlibrary;

import static ai.luciq.reactlibrary.utils.LuciqUtil.getMethod;

import android.os.SystemClock;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.Date;

import javax.annotation.Nonnull;

import ai.luciq.apm.APM;
import ai.luciq.apm.InternalAPM;
import ai.luciq.apm.configuration.cp.APMFeature;
import ai.luciq.apm.configuration.cp.FeatureAvailabilityCallback;
import ai.luciq.apm.networking.APMNetworkLogger;
import ai.luciq.apm.networkinterception.cp.APMCPNetworkLog;
import ai.luciq.reactlibrary.utils.EventEmitterModule;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

public class RNLuciqAPMModule extends EventEmitterModule {

    public RNLuciqAPMModule(ReactApplicationContext reactApplicationContext) {
        super(reactApplicationContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return "LCQAPM";
    }

    /**
     * Pauses the current thread for 3 seconds.
     */
    @ReactMethod
    public void LCQSleep() {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[LCQSleep] called");
                SystemClock.sleep(3000);
            }
        });
    }

    /**
     * Enables or disables APM.
     *
     * @param isEnabled boolean indicating enabled or disabled.
     */
    @ReactMethod
    public void setEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[setEnabled] called isEnabled=" + isEnabled);
                try {
                    APM.setEnabled(isEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[setEnabled] failed", e);
                }
            }
        });
    }

    /**
     * Enables or disables app launch tracking.
     *
     * @param isEnabled boolean indicating enabled or disabled.
     */
    @ReactMethod
    public void setAppLaunchEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_APP_LAUNCH, "[setAppLaunchEnabled] called isEnabled=" + isEnabled);
                try {
                    APM.setColdAppLaunchEnabled(isEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_APP_LAUNCH, "[setAppLaunchEnabled] failed", e);
                }
            }
        });
    }

    /**
     * This method is used to signal the end of the app launch process.
     */
    @ReactMethod
    public void endAppLaunch() {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_APP_LAUNCH, "[endAppLaunch] called");
                try {
                    APM.endAppLaunch();
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_APP_LAUNCH, "[endAppLaunch] failed", e);
                }
            }
        });
    }

    /**
     * Enables or disables auto UI tracing
     *
     * @param isEnabled boolean indicating enabled or disabled.
     */
    @ReactMethod
    public void setAutoUITraceEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_UI_TRACE, "[setAutoUITraceEnabled] called isEnabled=" + isEnabled);
                try {
                    APM.setAutoUITraceEnabled(isEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_UI_TRACE, "[setAutoUITraceEnabled] failed", e);
                }
            }
        });
    }

    /**
     * Starts an AppFlow with the specified name.
     */
    @ReactMethod
    public void startFlow(@NonNull final String name) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_FLOW, "[startFlow] called name=" + name);
                try {
                    APM.startFlow(name);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_FLOW, "[startFlow] failed", e);
                }
            }
        });
    }

    /**
     * Sets custom attributes for AppFlow with a given name.
     */
    @ReactMethod
    public void setFlowAttribute(@NonNull final String name, @NonNull final String key, final String value) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_FLOW, "[setFlowAttribute] called name=" + name + " key=" + key + " valuePresent=" + (value != null) + " valueLen=" + (value == null ? 0 : value.length()));
                try {
                    APM.setFlowAttribute(name, key, value);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_FLOW, "[setFlowAttribute] failed", e);
                }
            }
        });
    }

    /**
     * Ends AppFlow with a given name.
     */
    @ReactMethod
    public void endFlow(@NonNull final String name) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_FLOW, "[endFlow] called name=" + name);
                try {
                    APM.endFlow(name);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_FLOW, "[endFlow] failed", e);
                }
            }
        });
    }

    /**
     * Starts a UI trace
     */
    @ReactMethod
    public void startUITrace(final String name) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_UI_TRACE, "[startUITrace] called name=" + name);
                try {
                    APM.startUITrace(name);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_UI_TRACE, "[startUITrace] failed", e);
                }
            }
        });
    }

    /**
     * This method is used to terminate the currently active UI trace.
     */
    @ReactMethod
    public void endUITrace() {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_UI_TRACE, "[endUITrace] called");
                try {
                    APM.endUITrace();
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_UI_TRACE, "[endUITrace] failed", e);
                }
            }
        });
    }

    @ReactMethod
    public void networkLogAndroid(final double requestStartTime,
                                   final double requestDuration,
                                   final String requestHeaders,
                                   final String requestBody,
                                   final double requestBodySize,
                                   final String requestMethod,
                                   final String requestUrl,
                                   final String requestContentType,
                                   final String responseHeaders,
                                   final String responseBody,
                                   final double responseBodySize,
                                   final double statusCode,
                                   final String responseContentType,
                                   @Nullable final String errorDomain,
                                   @Nullable final ReadableMap w3cAttributes,
                                   @Nullable final String gqLCQueryName,
                                   @Nullable final String serverErrorMessage
    ) {
        final String redactedUrl = LuciqRNLogger.redactUrl(requestUrl);
        LuciqRNLogger.d(LuciqRNDebugTags.APM_NETWORK, "[networkLogAndroid-APM] Received from JS: " + requestMethod + " " + redactedUrl + ", status=" + (int) statusCode + ", duration=" + (long) requestDuration + "ms, startTime=" + (long) requestStartTime + ", error=" + errorDomain + ", gqlQuery=" + gqLCQueryName);
        try {
            APMNetworkLogger networkLogger = new APMNetworkLogger();

            final boolean hasError = errorDomain != null && !errorDomain.isEmpty();
            final String errorMessage = hasError ? errorDomain : null;
            Boolean isW3cHeaderFound = false;
            Long partialId = null;
            Long networkStartTimeInSeconds = null;


            try {
                if (!w3cAttributes.isNull("isW3cHeaderFound")) {
                    isW3cHeaderFound = w3cAttributes.getBoolean("isW3cHeaderFound");
                }

                if (!w3cAttributes.isNull("partialId")) {
                    partialId = (long) w3cAttributes.getDouble("partialId");
                    networkStartTimeInSeconds = (long) w3cAttributes.getDouble("networkStartTimeInSeconds");
                }

            } catch (Exception e) {
                LuciqRNLogger.e(LuciqRNDebugTags.APM_NETWORK, "[networkLogAndroid-APM] Error parsing W3C attributes for " + requestMethod + " " + redactedUrl, e);
            }
            LuciqRNLogger.d(LuciqRNDebugTags.APM_NETWORK, "[networkLogAndroid-APM] W3C attrs - isW3cHeaderFound=" + isW3cHeaderFound + ", partialId=" + partialId + ", networkStartTimeInSeconds=" + networkStartTimeInSeconds + ", generatedHeader=" + (w3cAttributes != null && !w3cAttributes.isNull("w3cGeneratedHeader") ? w3cAttributes.getString("w3cGeneratedHeader") : "null") + ", caughtHeader=" + (w3cAttributes != null && !w3cAttributes.isNull("w3cCaughtHeader") ? w3cAttributes.getString("w3cCaughtHeader") : "null"));
            APMCPNetworkLog.W3CExternalTraceAttributes w3cExternalTraceAttributes = new APMCPNetworkLog.W3CExternalTraceAttributes(isW3cHeaderFound, partialId, networkStartTimeInSeconds, w3cAttributes.getString("w3cGeneratedHeader"), w3cAttributes.getString("w3cCaughtHeader"));
            try {
                Method method = getMethod(Class.forName("ai.luciq.apm.networking.APMNetworkLogger"), "log", long.class, long.class, String.class, String.class, long.class, String.class, String.class, String.class, String.class, String.class, long.class, int.class, String.class, String.class, String.class, String.class, APMCPNetworkLog.W3CExternalTraceAttributes.class);
                if (method != null) {
                    method.invoke(
                            networkLogger,
                            (long) requestStartTime * 1000,
                            (long) requestDuration,
                            requestHeaders,
                            requestBody,
                            (long) requestBodySize,
                            requestMethod,
                            requestUrl,
                            requestContentType,
                            responseHeaders,
                            responseBody,
                            (long) responseBodySize,
                            (int) statusCode,
                            responseContentType,
                            errorMessage,
                            gqLCQueryName,
                            serverErrorMessage,
                            w3cExternalTraceAttributes
                    );
                    LuciqRNLogger.d(LuciqRNDebugTags.APM_NETWORK, "[networkLogAndroid-APM] Successfully invoked APMNetworkLogger.log via reflection: " + requestMethod + " " + redactedUrl);
                } else {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_NETWORK, "[networkLogAndroid-APM] APMNetworkLogger.log method NOT found by reflection - network log will be lost: " + requestMethod + " " + redactedUrl);
                }
            } catch (Throwable e) {
                LuciqRNLogger.e(LuciqRNDebugTags.APM_NETWORK, "[networkLogAndroid-APM] Exception invoking APMNetworkLogger.log: " + e.getMessage() + " for " + requestMethod + " " + redactedUrl, e);
            }
        } catch (Throwable e) {
            LuciqRNLogger.e(LuciqRNDebugTags.APM_NETWORK, "[networkLogAndroid-APM] Top-level exception: " + e.getMessage() + " for " + requestMethod + " " + redactedUrl, e);
        }
    }

    /**
     * Enables or disables screen rendering
     */
    @ReactMethod
    public void setScreenRenderingEnabled(boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_RENDERING, "[setScreenRenderingEnabled] called isEnabled=" + isEnabled);
                try {
                    APM.setScreenRenderingEnabled(isEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_SCREEN_RENDERING, "[setScreenRenderingEnabled] failed", e);
                }
            }
        });
    }

    /**
     * Syncs a custom span to the native SDK (currently logs only).
     */
    @ReactMethod
    public void syncCustomSpan(final String name,
                               final double startTimestamp,
                               final double endTimestamp,
                               final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[syncCustomSpan] called name=" + name + " startTimestamp=" + startTimestamp + " endTimestamp=" + endTimestamp);
                try {
                    Date startDate = new Date((long) (startTimestamp / 1000));
                    Date endDate = new Date((long) (endTimestamp / 1000));

                    APM.addCompletedCustomSpan(name, startDate, endDate);

                    LuciqRNLogger.d(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[syncCustomSpan] success");
                    promise.resolve(true);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[syncCustomSpan] failed", e);
                    promise.resolve(false);
                }
            }
        });
    }

    /**
     * Checks if custom spans feature is enabled.
     */
    @ReactMethod
    public void isCustomSpanEnabled(final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[isCustomSpanEnabled] called");
                try {
                    InternalAPM._isFeatureEnabledCP(APMFeature.CUSTOM_SPANS, "LuciqCustomSpan", new FeatureAvailabilityCallback() {
                        @Override
                        public void invoke(boolean isEnabled) {
                            LuciqRNLogger.d(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[isCustomSpanEnabled] success result=" + isEnabled);
                            promise.resolve(isEnabled);
                        }
                    });
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[isCustomSpanEnabled] failed", e);
                    promise.resolve(false);
                }
            }
        });
    }

    /**
     * Checks if APM is enabled.
     */
    @ReactMethod
    public void isAPMEnabled(final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[isAPMEnabled] called");
                try {
                    InternalAPM._isFeatureEnabledCP(APMFeature.APM, "APM", new FeatureAvailabilityCallback() {
                        @Override
                        public void invoke(boolean isEnabled) {
                            LuciqRNLogger.d(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[isAPMEnabled] success result=" + isEnabled);
                            promise.resolve(isEnabled);
                        }
                    });
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_CUSTOM_SPAN, "[isAPMEnabled] failed", e);
                    promise.resolve(false);
                }
            }
        });
    }

    /**
     * Initialize screen frame tracking for Screen Loading feature
     */
    @ReactMethod
    public void initScreenFrameTracking(Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[initScreenFrameTracking] called");
                LuciqScreenLoadingFrameTracker.getInstance().initializeFrameTracking();
                promise.resolve(null);
            }
        });
    }

    /**
     * Set the active screen span ID for frame tracking
     */
    @ReactMethod
    public void setActiveScreenSpanId(String spanId) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[setActiveScreenSpanId] called spanId=" + spanId);
                LuciqScreenLoadingFrameTracker.getInstance().startTrackingForSpanId(spanId);
            }
        });
    }

    /**
     * Get the frame timestamp for a given span ID
     */
    @ReactMethod
    public void getScreenTimeToDisplay(String spanId, Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[getScreenTimeToDisplay] called spanId=" + spanId);
                Long timestamp = LuciqScreenLoadingFrameTracker.getInstance().getFrameTimestampForSpanId(spanId);
                LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[getScreenTimeToDisplay] success timestampPresent=" + (timestamp != null));
                promise.resolve(timestamp != null ? timestamp.doubleValue() : null);
            }
        });
    }

    /**
     * Check if Screen Loading feature is enabled
     */
    @ReactMethod
    public void isScreenLoadingEnabled(Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[isScreenLoadingEnabled] called");
                try {
                    InternalAPM._isFeatureEnabledCP(APMFeature.SCREEN_LOADING, "LuciqCaptureScreenLoading", new FeatureAvailabilityCallback() {
                        @Override
                        public void invoke(boolean isFeatureAvailable) {
                            LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[isScreenLoadingEnabled] success result=" + isFeatureAvailable);
                            promise.resolve(isFeatureAvailable);
                        }
                    });
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_SCREEN_LOADING, "[isScreenLoadingEnabled] failed", e);
                    promise.resolve(false);
                }
            }
        });
    }

    /**
     * Enables or disables screen loading
     */
    @ReactMethod
    public void setScreenLoadingEnabled(boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[setScreenLoadingEnabled] called isEnabled=" + isEnabled);
                try {
                    APM.setScreenLoadingEnabled(isEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_SCREEN_LOADING, "[setScreenLoadingEnabled] failed", e);
                }
            }
        });
    }

    private static final String[] STAGE_KEYS = {"cnst_mus_st", "cnst_mus", "rnd_mus_st", "rnd_mus", "mnt_mus_st", "mnt_mus", "lyt_mus_st", "lyt_mus"};

    private Map<String, Long> buildStagesMap(ReadableMap stages) {
        final Map<String, Long> stagesMap = new HashMap<>();
        for (String key : STAGE_KEYS) {
            if (stages.hasKey(key)) stagesMap.put(key, (long) stages.getDouble(key));
        }
        return stagesMap;
    }

    @ReactMethod
    public void syncScreenLoading(double spanId, String screenName, double startTimestamp, double duration_us, ReadableMap stages) {
        LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[syncScreenLoading] called spanId=" + spanId + " screenName=" + screenName + " startTimestamp=" + startTimestamp + " duration_us=" + duration_us);
        try {
            final Map<String, Long> stagesMap = buildStagesMap(stages);
            InternalAPM._reportScreenLoadingCP((long) startTimestamp, (long) duration_us, (long) spanId, stagesMap);
        } catch (Exception e) {
            LuciqRNLogger.e(LuciqRNDebugTags.APM_SCREEN_LOADING, "[syncScreenLoading] failed", e);
        }
    }

    /**
     * Syncs manual screen loading measurements to native layer for reporting.
     */
    @ReactMethod
    public void syncManualScreenLoading(String screenName, double startTimestamp, double duration_us, ReadableMap stages) {
        LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[syncManualScreenLoading] called screenName=" + screenName + " startTimestamp=" + startTimestamp + " duration_us=" + duration_us);
        try {
            final Map<String, Long> stagesMap = buildStagesMap(stages);
            InternalAPM._reportManualScreenLoadingCP(screenName, (long) startTimestamp, (long) duration_us, stagesMap);
        } catch (Exception e) {
            LuciqRNLogger.e(LuciqRNDebugTags.APM_SCREEN_LOADING, "[syncManualScreenLoading] failed", e);
        }
    }

    /**
     * Check if Screen Loading feature is enabled
     */
    @ReactMethod
    public void isEndScreenLoadingEnabled(Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[isEndScreenLoadingEnabled] called");
                try {
                    InternalAPM._isFeatureEnabledCP(APMFeature.END_SCREEN_LOADING, "LuciqCaptureScreenLoading", new FeatureAvailabilityCallback() {
                        @Override
                        public void invoke(boolean isFeatureAvailable) {
                            LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[isEndScreenLoadingEnabled] success result=" + isFeatureAvailable);
                            promise.resolve(isFeatureAvailable);
                        }
                    });
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.APM_SCREEN_LOADING, "[isEndScreenLoadingEnabled] failed", e);
                    promise.resolve(false);
                }
            }
        });
    }

    /**
     * Extend the end time of the screen loading custom trace.
     */
    @ReactMethod
    public void endScreenLoading(double timeStampMicro, double uiTraceId) {
        LuciqRNLogger.d(LuciqRNDebugTags.APM_SCREEN_LOADING, "[endScreenLoading] called timeStampMicro=" + timeStampMicro + " uiTraceId=" + uiTraceId);
        try {
            InternalAPM._endScreenLoadingCP((long) timeStampMicro, (long) uiTraceId);
        } catch (Exception e) {
            LuciqRNLogger.e(LuciqRNDebugTags.APM_SCREEN_LOADING, "[endScreenLoading] failed", e);
        }
    }
}
