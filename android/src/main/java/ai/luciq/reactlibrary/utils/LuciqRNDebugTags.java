package ai.luciq.reactlibrary.utils;

/**
 * Native Android debug-log tag inventory mirroring src/constants/DebugTags.ts.
 *
 * Each tag uses the same suffix as the JS-side tag with an `Android-` segment
 * injected after the `LCQ-RN-` prefix, so a mixed JS+native log stream can be
 * filtered per platform while remaining grep-compatible across both.
 *
 *   JS:       LCQ-RN-APM-FLOW:
 *   iOS:      LCQ-RN-iOS-APM-FLOW:
 *   Android:  LCQ-RN-Android-APM-FLOW:
 */
public final class LuciqRNDebugTags {

    public static final String CORE = "LCQ-RN-Android-CORE:";
    public static final String SCREEN_TRACKING = "LCQ-RN-Android-SCREEN:";
    public static final String APM_SCREEN_LOADING = "LCQ-RN-Android-APM-SL:";
    public static final String APM_SCREEN_RENDERING = "LCQ-RN-Android-APM-SR:";
    public static final String APM_UI_TRACE = "LCQ-RN-Android-APM-UI:";
    public static final String APM_APP_LAUNCH = "LCQ-RN-Android-APM-LAUNCH:";
    public static final String APM_CUSTOM_SPAN = "LCQ-RN-Android-APM-SPAN:";
    public static final String APM_FLOW = "LCQ-RN-Android-APM-FLOW:";
    public static final String APM_NETWORK = "LCQ-RN-Android-APM-NET:";
    public static final String BUG_REPORTING = "LCQ-RN-Android-BR:";
    public static final String CRASH_REPORTING = "LCQ-RN-Android-CRASH:";
    public static final String SESSION_REPLAY = "LCQ-RN-Android-SR:";
    public static final String PRIVATE_VIEW = "LCQ-RN-Android-PRIV:";
    public static final String FEATURE_FLAGS = "LCQ-RN-Android-FF:";
    public static final String NETWORK = "LCQ-RN-Android-NET:";
    public static final String XHR = "LCQ-RN-Android-XHR:";
    public static final String SURVEYS = "LCQ-RN-Android-SUR:";
    public static final String REPLIES = "LCQ-RN-Android-REP:";
    public static final String FEATURE_REQUESTS = "LCQ-RN-Android-FR:";
    public static final String APP_STATE = "LCQ-RN-Android-STATE:";

    private LuciqRNDebugTags() {}
}
