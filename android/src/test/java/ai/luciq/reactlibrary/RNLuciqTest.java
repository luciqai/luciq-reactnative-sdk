package ai.luciq.reactlibrary;


import static ai.luciq.reactlibrary.util.GlobalMocks.reflected;
import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockConstruction;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import android.app.Application;

import com.instabug.library.Instabug;
import com.instabug.library.LogLevel;
import com.instabug.library.Platform;
import com.instabug.library.invocation.InstabugInvocationEvent;
import ai.luciq.reactlibrary.util.GlobalMocks;
import ai.luciq.reactlibrary.util.MockReflected;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;


public class RNLuciqTest {
    private final Application mContext = mock(Application.class);

    private MockedStatic<Instabug> mLuciq;

    private RNLuciq sut;


    @Before
    public void setUp() throws Exception {
        sut = spy(RNLuciq.getInstance());
        mLuciq = mockStatic(Instabug.class);

        GlobalMocks.setUp();
    }

    @After
    public void tearDown() throws Exception {
        mLuciq.close();
        GlobalMocks.close();
    }

    @Test
    public void testInitWithLogLevel() {
        final InstabugInvocationEvent[] invocationEvents = new InstabugInvocationEvent[]{InstabugInvocationEvent.FLOATING_BUTTON};
        final String token = "fde....";
        final int logLevel = LogLevel.VERBOSE;

        MockedConstruction<Instabug.Builder> mInstabugBuilder = mockConstruction(
                Instabug.Builder.class, (mock, context) -> {
                    String actualToken = (String) context.arguments().get(1);
                    // Initializes Luciq with the correct token
                    assertEquals(token, actualToken);
                    when(mock.setSdkDebugLogsLevel(anyInt())).thenReturn(mock);
                    when(mock.ignoreFlagSecure(anyBoolean())).thenReturn(mock);
                    when(mock.setInvocationEvents(any())).thenReturn(mock);
                });

        sut.init(mContext, token, logLevel, null, null,true, invocationEvents);

        Instabug.Builder builder = mInstabugBuilder.constructed().get(0);

        // Here we check that it has changed to verbose value of the `logLevel` property
        verify(builder).setSdkDebugLogsLevel(LogLevel.VERBOSE);
        verify(builder).setInvocationEvents(invocationEvents);
        verify(builder).ignoreFlagSecure(true);

        verify(builder).build();


        verify(sut).setBaseUrlForDeprecationLogs();
        verify(sut).setCurrentPlatform();
        mInstabugBuilder.close();
    }

    @Test
    public void testInitWithoutLogLevel() {
        final InstabugInvocationEvent[] invocationEvents = new InstabugInvocationEvent[]{InstabugInvocationEvent.FLOATING_BUTTON};
        final String token = "fde....";
        final int defaultLogLevel = LogLevel.ERROR;
        final String appVariant = "app-variant";

        MockedConstruction<Instabug.Builder> mInstabugBuilder = mockConstruction(
                Instabug.Builder.class, (mock, context) -> {
                    when(mock.setSdkDebugLogsLevel(anyInt())).thenReturn(mock);
                    when(mock.setInvocationEvents(any())).thenReturn(mock);
                    when(mock.setAppVariant(any())).thenReturn(mock);

                });

        sut.init(mContext, token, null, appVariant, invocationEvents);

        verify(sut).init(mContext, token, defaultLogLevel, null, appVariant, null,invocationEvents);
        mInstabugBuilder.close();
    }

    @Test
    public void testSetCurrentPlatform() {
        sut.setCurrentPlatform();

        reflected.verify(() -> MockReflected.setCurrentPlatform(Platform.RN));
    }

    @Test
    public void testSetDeprecationBaseUrl() {
        sut.setBaseUrlForDeprecationLogs();

        reflected.verify(() -> MockReflected.setBaseUrl(any()));
    }
}












































