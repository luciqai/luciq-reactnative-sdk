package ai.luciq.reactlibrary.util;

import static org.mockito.Mockito.mockStatic;

import android.util.Log;

import ai.luciq.crash.models.LuciqNonFatalException;
import ai.luciq.reactlibrary.utils.LuciqUtil;

import org.json.JSONObject;
import org.mockito.MockedStatic;

import java.lang.reflect.Method;

public class GlobalMocks {
    public static MockedStatic<Log> log;
    private static MockedStatic<LuciqUtil> reflection;
    public static MockedStatic<MockReflected> reflected;

    public static void setUp() throws NoSuchMethodException {
        // Log mock
        log = mockStatic(Log.class);

        // Reflection mock
        reflection = mockStatic(LuciqUtil.class);
        reflected = mockStatic(MockReflected.class);

        Method mSetCurrentPlatform = MockReflected.class.getDeclaredMethod("setCurrentPlatform", int.class);
        mSetCurrentPlatform.setAccessible(true);

        // setCurrentPlatform mock
        reflection
                .when(() -> LuciqUtil.getMethod(Class.forName("ai.luciq.library.Luciq"), "setCurrentPlatform", int.class))
                .thenReturn(mSetCurrentPlatform);

        // setBaseUrl mock
        Method mSetBaseUrl = MockReflected.class.getDeclaredMethod("setBaseUrl", String.class);
        mSetBaseUrl.setAccessible(true);
        reflection
                .when(() -> LuciqUtil.getMethod(Class.forName("ai.luciq.library.util.InstabugDeprecationLogger"), "setBaseUrl", String.class))
                .thenReturn(mSetBaseUrl);

        // reportException mock
        Method mCrashReportException = MockReflected.class.getDeclaredMethod("reportException", JSONObject.class, boolean.class, java.util.Map.class, JSONObject.class, LuciqNonFatalException.Level.class);
        mCrashReportException.setAccessible(true);
        reflection
                .when(() -> LuciqUtil.getMethod(Class.forName("ai.luciq.crash.CrashReporting"), "reportException", JSONObject.class,
                        boolean.class, java.util.Map.class, JSONObject.class, LuciqNonFatalException.Level.class))
                .thenReturn(mCrashReportException);
    }

    public static void close() {
        log.close();
        reflection.close();
        reflected.close();
    }
}
