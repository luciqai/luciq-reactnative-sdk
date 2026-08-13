package ai.luciq.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public abstract class NativeLuciqBugReportingSpec extends ReactContextBaseJavaModule {
    public static final String NAME = "LCQBugReporting";

    public NativeLuciqBugReportingSpec(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }
}
