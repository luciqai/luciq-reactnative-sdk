package ai.luciq.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;

import ai.luciq.reactlibrary.utils.EventEmitterModule;

abstract class RNLuciqAPMBaseSpec extends EventEmitterModule {
    RNLuciqAPMBaseSpec(ReactApplicationContext context) {
        super(context);
    }
}
