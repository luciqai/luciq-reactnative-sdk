package ai.luciq.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;

abstract class RNLuciqCrashReportingBaseSpec extends NativeCrashReportingSpec {
    RNLuciqCrashReportingBaseSpec(ReactApplicationContext context) {
        super(context);
    }
}
