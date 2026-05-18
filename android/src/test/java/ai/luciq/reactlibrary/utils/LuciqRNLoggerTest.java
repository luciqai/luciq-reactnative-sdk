package ai.luciq.reactlibrary.utils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

import android.util.Log;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import ai.luciq.library.LogLevel;

public class LuciqRNLoggerTest {

    private static final String TAG = "LCQ-RN-NET";
    private MockedStatic<Log> mockLog;

    @Before
    public void setUp() {
        mockLog = mockStatic(Log.class);
        // Reset to default between tests since the level is a static field
        LuciqRNLogger.setLevel(LogLevel.ERROR);
    }

    @After
    public void tearDown() {
        // Restore default so other tests in the suite aren't affected
        LuciqRNLogger.setLevel(LogLevel.ERROR);
        mockLog.close();
    }

    @Test
    public void defaultLevel_isError_suppressesDebugAndWarn_allowsError() {
        LuciqRNLogger.d(TAG, "debug-msg");
        LuciqRNLogger.w(TAG, "warn-msg");
        LuciqRNLogger.e(TAG, "error-msg");

        mockLog.verify(() -> Log.d(TAG, "debug-msg"), never());
        mockLog.verify(() -> Log.w(TAG, "warn-msg"), never());
        mockLog.verify(() -> Log.e(TAG, "error-msg"), times(1));
    }

    @Test
    public void debugLevel_allowsDebugAndWarnAndError() {
        LuciqRNLogger.setLevel(LogLevel.DEBUG);

        LuciqRNLogger.d(TAG, "debug-msg");
        LuciqRNLogger.w(TAG, "warn-msg");
        LuciqRNLogger.e(TAG, "error-msg");

        mockLog.verify(() -> Log.d(TAG, "debug-msg"), times(1));
        mockLog.verify(() -> Log.w(TAG, "warn-msg"), times(1));
        mockLog.verify(() -> Log.e(TAG, "error-msg"), times(1));
    }

    @Test
    public void verboseLevel_allowsEverything() {
        LuciqRNLogger.setLevel(LogLevel.VERBOSE);

        LuciqRNLogger.d(TAG, "debug-msg");
        LuciqRNLogger.w(TAG, "warn-msg");
        LuciqRNLogger.e(TAG, "error-msg");

        mockLog.verify(() -> Log.d(TAG, "debug-msg"), times(1));
        mockLog.verify(() -> Log.w(TAG, "warn-msg"), times(1));
        mockLog.verify(() -> Log.e(TAG, "error-msg"), times(1));
    }

    @Test
    public void noneLevel_suppressesEverything() {
        LuciqRNLogger.setLevel(LogLevel.NONE);

        LuciqRNLogger.d(TAG, "debug-msg");
        LuciqRNLogger.w(TAG, "warn-msg");
        LuciqRNLogger.e(TAG, "error-msg");
        LuciqRNLogger.e(TAG, "error-throwable", new RuntimeException("boom"));

        mockLog.verify(() -> Log.d(TAG, "debug-msg"), never());
        mockLog.verify(() -> Log.w(TAG, "warn-msg"), never());
        mockLog.verify(() -> Log.e(TAG, "error-msg"), never());
        mockLog.verify(() -> Log.e(eq(TAG), eq("error-throwable"), any(Throwable.class)), never());
    }

    @Test
    public void errorWithThrowable_respectsLevel() {
        RuntimeException ex = new RuntimeException("boom");

        // ERROR level: emits
        LuciqRNLogger.setLevel(LogLevel.ERROR);
        LuciqRNLogger.e(TAG, "with-throwable", ex);
        mockLog.verify(() -> Log.e(TAG, "with-throwable", ex), times(1));

        // NONE level: suppressed
        LuciqRNLogger.setLevel(LogLevel.NONE);
        LuciqRNLogger.e(TAG, "with-throwable-2", ex);
        mockLog.verify(() -> Log.e(TAG, "with-throwable-2", ex), never());
    }

    @Test
    public void getLevel_returnsCurrentLevel() {
        LuciqRNLogger.setLevel(LogLevel.VERBOSE);
        org.junit.Assert.assertEquals(LogLevel.VERBOSE, LuciqRNLogger.getLevel());

        LuciqRNLogger.setLevel(LogLevel.NONE);
        org.junit.Assert.assertEquals(LogLevel.NONE, LuciqRNLogger.getLevel());
    }
}
