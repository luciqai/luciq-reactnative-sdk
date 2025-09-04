package ai.luciq.reactlibrary.util;

import com.instabug.crash.models.IBGNonFatalException;

import org.json.JSONObject;

import java.util.Map;

/**
 * Includes fake implementations of methods called by reflection.
 * Used to verify whether or not a private methods was called.
 */
@SuppressWarnings("unused")
public class MockReflected {

    /**
     * Luciq.setCurrentPlatform
     */
    public static void setCurrentPlatform(int platform) {}

    /**
     * Luciq.util.LuciqDeprecationLogger.setBaseUrl
     */
    public static void setBaseUrl(String baseUrl) {}
    /**
     * CrashReporting.reportException
     */
    public static void reportException(JSONObject exception, boolean isHandled, Map userAttributes, JSONObject fingerPrint, IBGNonFatalException.Level level) {}

}
