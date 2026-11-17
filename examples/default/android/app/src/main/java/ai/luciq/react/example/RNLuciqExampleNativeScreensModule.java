package ai.luciq.react.example;

import android.app.Activity;
import android.content.Intent;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/** Opens the example's native screen from JS. */
public class RNLuciqExampleNativeScreensModule extends ReactContextBaseJavaModule {

    public RNLuciqExampleNativeScreensModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "NativeScreensExampleModule";
    }

    @ReactMethod
    public void openNativeScreen() {
        Activity activity = getCurrentActivity();
        if (activity == null) return;
        activity.startActivity(new Intent(activity, NativeScreenActivity.class));
    }
}
