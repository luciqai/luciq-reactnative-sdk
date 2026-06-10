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

    // redactUrl: mirrors test/utils/redactUrlForLog.spec.ts so the JS and Android
    // implementations stay observable through equivalent unit tests.

    @Test
    public void redactUrl_returnsEmptyForNull() {
        org.junit.Assert.assertEquals("", LuciqRNLogger.redactUrl(null));
    }

    @Test
    public void redactUrl_returnsEmptyForEmpty() {
        org.junit.Assert.assertEquals("", LuciqRNLogger.redactUrl(""));
    }

    @Test
    public void redactUrl_preservesUrlWithoutQueryOrFragment() {
        org.junit.Assert.assertEquals(
                "https://api.example.com/users/123",
                LuciqRNLogger.redactUrl("https://api.example.com/users/123"));
        org.junit.Assert.assertEquals(
                "https://api.example.com/v1/users/123/orders/456",
                LuciqRNLogger.redactUrl("https://api.example.com/v1/users/123/orders/456"));
        org.junit.Assert.assertEquals(
                "http://localhost:8081/symbolicate",
                LuciqRNLogger.redactUrl("http://localhost:8081/symbolicate"));
    }

    @Test
    public void redactUrl_stripsSimpleQueryAndAppendsMarker() {
        org.junit.Assert.assertEquals(
                "https://api.example.com/users?<redacted>",
                LuciqRNLogger.redactUrl("https://api.example.com/users?email=u@x.com"));
    }

    @Test
    public void redactUrl_stripsMultiParamQuery() {
        org.junit.Assert.assertEquals(
                "https://api.example.com/auth?<redacted>",
                LuciqRNLogger.redactUrl("https://api.example.com/auth?token=abc&user=12345&hash=xyz"));
    }

    @Test
    public void redactUrl_stripsTrailingQuestionMark() {
        org.junit.Assert.assertEquals(
                "https://api.example.com/users?<redacted>",
                LuciqRNLogger.redactUrl("https://api.example.com/users?"));
    }

    @Test
    public void redactUrl_neverLeaksSensitiveQueryValue() {
        String sensitive = "super-secret-token-value-9876";
        String result = LuciqRNLogger.redactUrl("https://api.example.com/users?token=" + sensitive);
        org.junit.Assert.assertFalse(result.contains(sensitive));
        org.junit.Assert.assertFalse(result.contains("token="));
    }

    @Test
    public void redactUrl_stripsFragmentSilently() {
        org.junit.Assert.assertEquals(
                "https://app.example.com/page",
                LuciqRNLogger.redactUrl("https://app.example.com/page#section-2"));
    }

    @Test
    public void redactUrl_stripsFragmentWithSensitiveData() {
        String result = LuciqRNLogger.redactUrl("https://app.example.com/page#access_token=abc");
        org.junit.Assert.assertEquals("https://app.example.com/page", result);
        org.junit.Assert.assertFalse(result.contains("abc"));
        org.junit.Assert.assertFalse(result.contains("access_token"));
    }

    @Test
    public void redactUrl_cutsAtQueryWhenQueryComesFirst() {
        org.junit.Assert.assertEquals(
                "https://api.example.com/users?<redacted>",
                LuciqRNLogger.redactUrl("https://api.example.com/users?email=u@x.com#anchor"));
    }

    @Test
    public void redactUrl_cutsAtFragmentWhenFragmentComesFirst() {
        // Pathological but technically possible: fragment before query
        org.junit.Assert.assertEquals(
                "https://app.example.com/page",
                LuciqRNLogger.redactUrl("https://app.example.com/page#frag?fake"));
    }

    @Test
    public void redactUrl_neverReturnsUnredactedQueryParamValue() {
        String[] inputs = {
                "https://x.com/p?a=1",
                "https://x.com/p?a=1&b=2",
                "https://x.com/p#frag",
                "https://x.com/p?a=1#frag",
                "http://localhost:1234/foo?bar=baz",
        };
        for (String url : inputs) {
            String out = LuciqRNLogger.redactUrl(url);
            org.junit.Assert.assertEquals("query '=' should not leak: " + url, -1, out.indexOf('='));
            org.junit.Assert.assertEquals("fragment '#' should not leak: " + url, -1, out.indexOf('#'));
        }
    }

    // userinfo cases - mirror the userinfo block in test/utils/redactUrlForLog.spec.ts.

    @Test
    public void redactUrl_stripsUserPasswordFromAuthority() {
        org.junit.Assert.assertEquals(
                "https://api.example.com/users/123",
                LuciqRNLogger.redactUrl("https://user:pass@api.example.com/users/123"));
    }

    @Test
    public void redactUrl_stripsUsernameOnlyUserinfo() {
        org.junit.Assert.assertEquals(
                "https://api.example.com/users",
                LuciqRNLogger.redactUrl("https://alice@api.example.com/users"));
    }

    @Test
    public void redactUrl_neverLeaksPassword() {
        String secret = "p@ssw0rd-do-not-leak";
        String result = LuciqRNLogger.redactUrl("https://user:" + secret + "@api.example.com/x");
        org.junit.Assert.assertFalse(result.contains(secret));
        org.junit.Assert.assertFalse(result.contains("user:"));
    }

    @Test
    public void redactUrl_stripsUserinfoAndQueryTogether() {
        org.junit.Assert.assertEquals(
                "https://api.example.com/users?<redacted>",
                LuciqRNLogger.redactUrl("https://u:p@api.example.com/users?token=abc"));
    }

    @Test
    public void redactUrl_doesNotStripAtInPath() {
        // No userinfo present; the `@` is part of the path segment.
        org.junit.Assert.assertEquals(
                "https://api.example.com/users/@me/profile",
                LuciqRNLogger.redactUrl("https://api.example.com/users/@me/profile"));
    }

    @Test
    public void redactUrl_noSchemeIsNoOpForUserinfo() {
        // No `://`, so authority parsing is skipped.
        org.junit.Assert.assertEquals(
                "user@host/path",
                LuciqRNLogger.redactUrl("user@host/path"));
    }
}
