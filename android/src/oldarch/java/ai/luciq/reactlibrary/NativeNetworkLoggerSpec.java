package ai.luciq.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public abstract class NativeNetworkLoggerSpec extends ReactContextBaseJavaModule {
    public static final String NAME = "LCQNetworkLogger";

    public NativeNetworkLoggerSpec(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }
}
