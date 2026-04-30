package ai.luciq.reactlibrary;

import static ai.luciq.crash.CrashReporting.getFingerprintObject;
import static ai.luciq.reactlibrary.util.GlobalMocks.reflected;
import static org.mockito.AdditionalMatchers.cmpEq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;

import android.os.Looper;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;

import ai.luciq.crash.CrashReporting;
import ai.luciq.crash.models.LuciqNonFatalException;
import ai.luciq.library.Feature;
import ai.luciq.reactlibrary.util.GlobalMocks;
import ai.luciq.reactlibrary.util.MockReflected;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;

import java.util.HashMap;
import java.util.Map;


public class RNLuciqCrashReportingModuleTest {
    private final RNLuciqCrashReportingModule rnModule = new RNLuciqCrashReportingModule(null);

    // Mock Objects
    private MockedStatic<Looper> mockLooper;
    private MockedStatic<MainThreadHandler> mockMainThreadHandler;
    private MockedStatic<CrashReporting> mockCrashReporting;


    @Before
    public void mockMainThreadHandler() throws Exception {
        // Mock static functions
        mockLooper = mockStatic(Looper.class);
        mockMainThreadHandler = mockStatic(MainThreadHandler.class);
        mockCrashReporting = mockStatic(CrashReporting.class);
        // Mock Looper class
        Looper mockMainThreadLooper = mock(Looper.class);
        Mockito.when(Looper.getMainLooper()).thenReturn(mockMainThreadLooper);
        GlobalMocks.setUp();


        // Override runOnMainThread
        Answer<Boolean> handlerPostAnswer = new Answer<Boolean>() {
            @Override
            public Boolean answer(InvocationOnMock invocation) throws Throwable {
                invocation.getArgument(0, Runnable.class).run();
                return true;
            }
        };
        Mockito.doAnswer(handlerPostAnswer).when(MainThreadHandler.class);
        MainThreadHandler.runOnMainThread(any(Runnable.class));
    }

    @After
    public void tearDown() {
        // Remove static mocks
        mockLooper.close();
        mockMainThreadHandler.close();
        mockCrashReporting.close();
        GlobalMocks.close();

    }

    /********Crashes*********/

    @Test
    public void testSetNDKCrashesEnabledGivenTrue() {
        // when
        rnModule.setNDKCrashesEnabled(true, mock(Promise.class));

//then
        mockCrashReporting.verify(() -> CrashReporting.setNDKCrashesState(Feature.State.ENABLED));
    }

    @Test
    public void testSetNDKCrashesEnabledGivenFalse() {
        // when
        rnModule.setNDKCrashesEnabled(false, mock(Promise.class));

        //then
        mockCrashReporting.verify(() -> CrashReporting.setNDKCrashesState(Feature.State.DISABLED));
    }

    @Test
    public void testSendNonFatalError() {
        ReadableMap jsonCrash = mock(ReadableMap.class);
        Mockito.when(jsonCrash.toHashMap()).thenReturn(new HashMap<>());
        boolean isHandled = true;
        String fingerPrint = "test";
        String level = ArgsRegistry.nonFatalExceptionLevel.keySet().iterator().next();
        JSONObject expectedFingerprint = getFingerprintObject(fingerPrint);
        LuciqNonFatalException.Level expectedLevel = ArgsRegistry.nonFatalExceptionLevel.get(level);
        rnModule.sendHandledJSCrash(jsonCrash, null, fingerPrint, level, mock(Promise.class));
        reflected.verify(() -> MockReflected.reportException(any(JSONObject.class), eq(isHandled), eq(null), eq(expectedFingerprint), eq(expectedLevel)));
    }

}
