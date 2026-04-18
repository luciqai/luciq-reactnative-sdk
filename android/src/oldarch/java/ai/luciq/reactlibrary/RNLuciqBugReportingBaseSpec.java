package ai.luciq.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;

import ai.luciq.reactlibrary.utils.EventEmitterModule;

abstract class RNLuciqBugReportingBaseSpec extends EventEmitterModule {
    RNLuciqBugReportingBaseSpec(ReactApplicationContext context) {
        super(context);
    }

    @ReactMethod
    public void addListener(String event) {
        super.addListener(event);
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        super.removeListeners(count);
    }
}
