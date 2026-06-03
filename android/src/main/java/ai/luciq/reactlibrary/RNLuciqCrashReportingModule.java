package ai.luciq.reactlibrary;

import static ai.luciq.reactlibrary.utils.LuciqUtil.getMethod;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import ai.luciq.crash.CrashReporting;
import ai.luciq.crash.models.LuciqNonFatalException;
import ai.luciq.library.Feature;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

import org.json.JSONObject;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Map;

import javax.annotation.Nullable;

public class RNLuciqCrashReportingModule extends NativeCrashReportingSpec {

    public RNLuciqCrashReportingModule(ReactApplicationContext reactApplicationContext) {
        super(reactApplicationContext);
    }

    /**
     * Sets whether crash reporting feature is Enabled or Disabled
     *
     * @param isEnabled Exception object to be sent to Luciq's servers
     */
    @ReactMethod
    public void setEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (isEnabled) {
                        CrashReporting.setState(Feature.State.ENABLED);
                    } else {
                        CrashReporting.setState(Feature.State.DISABLED);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    /**
     * Send unhandled JS error object
     *
     * @param exceptionObject Exception object to be sent to Luciq's servers
     * @param promise         This makes sure that the RN side crashes the app only after the Android SDK
     *                        finishes processing/handling the crash.
     */
    @ReactMethod
    public void sendJSCrash(final ReadableMap exceptionObject, final Promise promise) {
        try {
            JSONObject jsonObject = new JSONObject(exceptionObject.toHashMap());
            sendJSCrashByReflection(jsonObject, false, new Runnable() {
                @Override
                public void run() {
                    promise.resolve(null);
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Send handled JS error object
     *
     * @param exceptionObject Exception object to be sent to Luciq's servers
     * @param userAttributes  (Optional) extra user attributes attached to the crash
     * @param fingerprint     (Optional) key used to customize how crashes are grouped together
     * @param level       different severity levels for errors
     */
    @ReactMethod
    public void sendHandledJSCrash(final ReadableMap exceptionObject, @Nullable final ReadableMap userAttributes, @Nullable final String fingerprint, @Nullable final String level, final Promise promise) {
        try {
            final JSONObject jsonObject = new JSONObject(exceptionObject.toHashMap());
            MainThreadHandler.runOnMainThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Method method = getMethod(Class.forName("ai.luciq.crash.CrashReporting"), "reportException", JSONObject.class, boolean.class,
                                Map.class, JSONObject.class, LuciqNonFatalException.Level.class);
                        if (method != null) {
                            LuciqNonFatalException.Level nonFatalExceptionLevel = ArgsRegistry.nonFatalExceptionLevel.getOrDefault(level, LuciqNonFatalException.Level.ERROR);
                            Map<String, Object> userAttributesMap = userAttributes == null ? null : userAttributes.toHashMap();
                            JSONObject fingerprintObj = fingerprint == null ? null : CrashReporting.getFingerprintObject(fingerprint);

                            method.invoke(null, jsonObject, true, userAttributesMap, fingerprintObj, nonFatalExceptionLevel);

                            RNLuciqReactnativeModule.clearCurrentReport();
                        }
                    } catch (ClassNotFoundException | IllegalAccessException |
                             InvocationTargetException e) {
                        e.printStackTrace();
                    } finally {
                        promise.resolve(null);
                    }
                }
            });
        } catch (Throwable e) {
            e.printStackTrace();
            promise.resolve(null);
        }
    }

    private void sendJSCrashByReflection(final JSONObject exceptionObject, final boolean isHandled, @Nullable final Runnable onComplete) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Method method = getMethod(Class.forName("ai.luciq.crash.CrashReporting"), "reportException", JSONObject.class, boolean.class);
                    if (method != null) {
                        method.invoke(null, exceptionObject, isHandled);
                        RNLuciqReactnativeModule.clearCurrentReport();
                    }
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                } catch (IllegalAccessException e) {
                    e.printStackTrace();
                } catch (InvocationTargetException e) {
                    e.printStackTrace();
                } finally {
                    if (onComplete != null) {
                        onComplete.run();
                    }
                }
            }
        });
    }

    /**
     * Enables and disables capturing native C++ NDK crash reporting.
     *
     * @param isEnabled boolean indicating enabled or disabled.
     */
    @ReactMethod
    public void setNDKCrashesEnabled(final boolean isEnabled, final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (isEnabled) {
                        CrashReporting.setNDKCrashesState(Feature.State.ENABLED);
                    } else {
                        CrashReporting.setNDKCrashesState(Feature.State.DISABLED);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    promise.resolve(null);
                }
            }
        });
    }

    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(double count) {}
}
