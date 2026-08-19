package ai.luciq.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public abstract class NativeCrashReportingSpec extends ReactContextBaseJavaModule {
    public static final String NAME = "LCQCrashReporting";

    public NativeCrashReportingSpec(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }
}
