package ai.luciq.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public abstract class NativeAPMSpec extends ReactContextBaseJavaModule {
    public static final String NAME = "LCQAPM";

    public NativeAPMSpec(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }
}
