package ai.luciq.reactlibrary;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import ai.luciq.reactlibrary.screenloading.LCQScreenLoadingViewManager;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class RNLuciqReactnativePackage implements ReactPackage {

    private static final String TAG = RNLuciqReactnativePackage.class.getSimpleName();

    public RNLuciqReactnativePackage() {}

    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new RNLuciqReactnativeModule(reactContext));
        modules.add(new RNLuciqBugReportingModule(reactContext));
        modules.add(new RNLuciqCrashReportingModule(reactContext));
        modules.add(new RNLuciqSurveysModule(reactContext));
        modules.add(new RNLuciqFeatureRequestsModule(reactContext));
        modules.add(new RNLuciqRepliesModule(reactContext));
        modules.add(new RNLuciqAPMModule(reactContext));
        modules.add(new RNLuciqSessionReplayModule(reactContext));
        modules.add(new RNLuciqNetworkLoggerModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
            new LCQScreenLoadingViewManager()
        );
    }
}
