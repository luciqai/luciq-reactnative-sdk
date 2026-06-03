package ai.luciq.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public abstract class NativeFeatureRequestsSpec extends ReactContextBaseJavaModule {
    public static final String NAME = "LCQFeatureRequests";

    public NativeFeatureRequestsSpec(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }
}
