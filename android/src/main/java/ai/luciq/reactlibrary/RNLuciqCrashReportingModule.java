package ai.luciq.reactlibrary;

import static ai.luciq.reactlibrary.utils.LuciqUtil.getMethod;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import ai.luciq.crash.CrashReporting;
import ai.luciq.crash.models.LuciqNonFatalException;
import ai.luciq.library.Feature;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

import org.json.JSONObject;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class RNLuciqCrashReportingModule extends ReactContextBaseJavaModule {

    public RNLuciqCrashReportingModule(ReactApplicationContext reactApplicationContext) {
        super(reactApplicationContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return "LCQCrashReporting";
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
                LuciqRNLogger.d(LuciqRNDebugTags.CRASH_REPORTING, "[setEnabled] called isEnabled=" + isEnabled);
                try {
                    if (isEnabled) {
                        CrashReporting.setState(Feature.State.ENABLED);
                    } else {
                        CrashReporting.setState(Feature.State.DISABLED);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.CRASH_REPORTING, "[setEnabled] failed", e);
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
    public void sendJSCrash(final String exceptionObject, final Promise promise) {
        LuciqRNLogger.d(LuciqRNDebugTags.CRASH_REPORTING, "[sendJSCrash] called exceptionObject length=" + (exceptionObject == null ? 0 : exceptionObject.length()) + ", present=" + (exceptionObject != null));
        try {
            JSONObject jsonObject = new JSONObject(exceptionObject);
            sendJSCrashByReflection(jsonObject, false, new Runnable() {
                @Override
                public void run() {
                    promise.resolve(null);
                }
            });
        } catch (Exception e) {
            LuciqRNLogger.e(LuciqRNDebugTags.CRASH_REPORTING, "[sendJSCrash] failed", e);
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
    public void sendHandledJSCrash(final String exceptionObject, @Nullable final ReadableMap userAttributes, @Nullable final String fingerprint, @Nullable final String level) {
        LuciqRNLogger.d(LuciqRNDebugTags.CRASH_REPORTING, "[sendHandledJSCrash] called exceptionObject length=" + (exceptionObject == null ? 0 : exceptionObject.length()) + ", present=" + (exceptionObject != null) + ", userAttributes present=" + (userAttributes != null) + ", fingerprint length=" + (fingerprint == null ? 0 : fingerprint.length()) + ", present=" + (fingerprint != null) + ", level=" + level);
        try {
            final JSONObject jsonObject = new JSONObject(exceptionObject);
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
                        LuciqRNLogger.e(LuciqRNDebugTags.CRASH_REPORTING, "[sendHandledJSCrash] failed", e);
                    }
                }
            });
        } catch (Throwable e) {
            LuciqRNLogger.e(LuciqRNDebugTags.CRASH_REPORTING, "[sendHandledJSCrash] failed", e);
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
                } catch (ClassNotFoundException | IllegalAccessException | InvocationTargetException e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.CRASH_REPORTING, "[sendJSCrashByReflection] failed", e);
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
    public void setNDKCrashesEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.CRASH_REPORTING, "[setNDKCrashesEnabled] called isEnabled=" + isEnabled);
                try {
                    if (isEnabled) {
                        CrashReporting.setNDKCrashesState(Feature.State.ENABLED);
                    } else {
                        CrashReporting.setNDKCrashesState(Feature.State.DISABLED);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.CRASH_REPORTING, "[setNDKCrashesEnabled] failed", e);
                }
            }
        });
    }
}
