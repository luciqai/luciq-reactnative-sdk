package ai.luciq.reactlibrary;

import android.annotation.SuppressLint;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import ai.luciq.featuresrequest.FeatureRequests;
import ai.luciq.library.Feature;
import ai.luciq.reactlibrary.utils.ArrayUtil;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

import java.util.ArrayList;

import javax.annotation.Nonnull;

public class RNLuciqFeatureRequestsModule extends ReactContextBaseJavaModule {

    private static final String TAG = LuciqRNDebugTags.FEATURE_REQUESTS;

    public RNLuciqFeatureRequestsModule(ReactApplicationContext reactApplicationContext) {
        super(reactApplicationContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return "LCQFeatureRequests";
    }

    /**
     * Sets whether email field is required or not when submitting
     * new-feature-request/new-comment-on-feature
     *
     * @param isEmailRequired set true to make email field required
     * @param actionTypes Bitwise-or of actions
     */
    @ReactMethod
    public void setEmailFieldRequiredForFeatureRequests(final boolean isEmailRequired, final ReadableArray actionTypes) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @SuppressLint("WrongConstant")
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setEmailFieldRequiredForFeatureRequests] called isEmailRequired=" + isEmailRequired + " actionTypesCount=" + (actionTypes == null ? 0 : actionTypes.size()));
                try {
                    final ArrayList<String> keys = ArrayUtil.parseReadableArrayOfStrings(actionTypes);
                    final ArrayList<Integer> types = ArgsRegistry.actionTypes.getAll(keys);

                    final int[] typesInts = new int[types.size()];
                    for (int i = 0; i < types.size(); i++) {
                        typesInts[i] = types.get(i);
                    }

                    FeatureRequests.setEmailFieldRequired(isEmailRequired, typesInts);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setEmailFieldRequiredForFeatureRequests] failed", e);
                }
            }
        });
    }

    /**
     * Shows the UI for feature requests list
     */
    @ReactMethod
    public void show() {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[show] called");
                try {
                    FeatureRequests.show();
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[show] failed", e);
                }
            }
        });
    }

    /**
     * Enables or disables feature requests.
     * @param isEnabled boolean indicating enabled or disabled.
     */
    @ReactMethod
    public void setEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setEnabled] called isEnabled=" + isEnabled);
                try {
                    if (isEnabled) {
                        FeatureRequests.setState(Feature.State.ENABLED);
                    } else {
                        FeatureRequests.setState(Feature.State.DISABLED);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setEnabled] failed", e);
                }
            }
        });
    }
}
