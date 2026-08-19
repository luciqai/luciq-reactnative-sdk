package ai.luciq.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public abstract class NativeSurveysSpec extends ReactContextBaseJavaModule {
    public static final String NAME = "LCQSurveys";

    public NativeSurveysSpec(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }
}
