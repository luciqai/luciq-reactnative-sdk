package ai.luciq.reactlibrary;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import ai.luciq.library.Luciq;

import java.util.HashMap;
import java.util.Map;

public class RNLuciqReactnativePackage extends TurboReactPackage {

    public RNLuciqReactnativePackage() {}

    @Nullable
    @Override
    public NativeModule getModule(@NonNull String name, @NonNull ReactApplicationContext reactContext) {
        // Set the React Native platform only when React Native will start the SDK. If Luciq is already
        // running when the module loads, the native app started it: either a hybrid app, whose native
        // screens must not be labelled React Native for the whole process, or RNLuciq.init, which set
        // the platform itself. Luciq.init sets it again on its own path in every case.
        if (!Luciq.isBuilt()) {
            RNLuciq.getInstance().setCurrentPlatform();
        }

        switch (name) {
            case "Luciq":
                return new RNLuciqReactnativeModule(reactContext);
            case "LCQBugReporting":
                return new RNLuciqBugReportingModule(reactContext);
            case "LCQCrashReporting":
                return new RNLuciqCrashReportingModule(reactContext);
            case "LCQSurveys":
                return new RNLuciqSurveysModule(reactContext);
            case "LCQFeatureRequests":
                return new RNLuciqFeatureRequestsModule(reactContext);
            case "LCQReplies":
                return new RNLuciqRepliesModule(reactContext);
            case "LCQAPM":
                return new RNLuciqAPMModule(reactContext);
            case "LCQSessionReplay":
                return new RNLuciqSessionReplayModule(reactContext);
            case "LCQNetworkLogger":
                return new RNLuciqNetworkLoggerModule(reactContext);
            default:
                return null;
        }
    }

    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
        return () -> {
            boolean isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
            Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();

            String[][] modules = {
                {"Luciq", RNLuciqReactnativeModule.class.getName()},
                {"LCQBugReporting", RNLuciqBugReportingModule.class.getName()},
                {"LCQCrashReporting", RNLuciqCrashReportingModule.class.getName()},
                {"LCQSurveys", RNLuciqSurveysModule.class.getName()},
                {"LCQFeatureRequests", RNLuciqFeatureRequestsModule.class.getName()},
                {"LCQReplies", RNLuciqRepliesModule.class.getName()},
                {"LCQAPM", RNLuciqAPMModule.class.getName()},
                {"LCQSessionReplay", RNLuciqSessionReplayModule.class.getName()},
                {"LCQNetworkLogger", RNLuciqNetworkLoggerModule.class.getName()},
            };

            for (String[] module : modules) {
                String moduleName = module[0];
                String className = module[1];
                moduleInfos.put(
                    moduleName,
                    new ReactModuleInfo(
                        moduleName,
                        className,
                        false, // canOverrideExistingModule
                        false, // needsEagerInit
                        false, // isCxxModule
                        isTurboModule
                    )
                );
            }

            return moduleInfos;
        };
    }
}
