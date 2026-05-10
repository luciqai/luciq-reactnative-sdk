package ai.luciq.reactlibrary;
import android.os.Looper;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import ai.luciq.apm.APM;
import ai.luciq.apm.InternalAPM;
import ai.luciq.apm.configuration.cp.APMFeature;
import ai.luciq.apm.configuration.cp.FeatureAvailabilityCallback;

import ai.luciq.reactlibrary.util.GlobalMocks;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class RNLuciqAPMModuleTest {

    private RNLuciqAPMModule apmModule = new RNLuciqAPMModule(null);
    private final static ScheduledExecutorService mainThread = Executors.newSingleThreadScheduledExecutor();

    // Mock Objects
    private MockedStatic<Looper> mockLooper;
    private MockedStatic<MainThreadHandler> mockMainThreadHandler;
    private MockedStatic<APM> mockAPM;
    private MockedStatic<InternalAPM> mockInternalAPM;

    @Before
    public void mockMainThreadHandler() throws Exception {
        // Mock static functions
        mockAPM = mockStatic(APM.class);
        mockInternalAPM = mockStatic(InternalAPM.class);
        mockLooper = mockStatic(Looper.class);
        mockMainThreadHandler = mockStatic(MainThreadHandler.class);
        GlobalMocks.setUp();

        // Mock Looper class
        Looper mockMainThreadLooper = mock(Looper.class);
        when(Looper.getMainLooper()).thenReturn(mockMainThreadLooper);

        // Override runOnMainThread
        Answer<Boolean> handlerPostAnswer = new Answer<Boolean>() {
            @Override
            public Boolean answer(InvocationOnMock invocation) throws Throwable {
                invocation.getArgument(0, Runnable.class).run();
                return true;
            }
        };
        doAnswer(handlerPostAnswer).when(MainThreadHandler.class);
        MainThreadHandler.runOnMainThread(any(Runnable.class));
    }

    @After
    public void tearDown() {
        // Remove static mocks
        mockLooper.close();
        mockMainThreadHandler.close();
        mockAPM.close();
        mockInternalAPM.close();
        GlobalMocks.close();
    }

    /********APM*********/

    @Test
    public void givenFalsesetEnabled_whenQuery_thenShouldCallNativeApiWithDisabled() {
        // when
        apmModule.setEnabled(false);
        // then
        verify(APM.class, times(1));
        APM.setEnabled(false);
    }

    @Test
    public void givenTruesetEnabled_whenQuery_thenShouldCallNativeApiWithEnabled() {
        // when
        apmModule.setEnabled(true);
        // then
        verify(APM.class, times(1));
        APM.setEnabled(true);
    }

    @Test
    public void givenFalse$setAppLaunchEnabled_whenQuery_thenShouldCallNativeApiWithDisabled() {

        // when
        apmModule.setAppLaunchEnabled(false);
        // then
        verify(APM.class, times(1));
        APM.setColdAppLaunchEnabled(false);
    }

    @Test
    public void givenTrue$setAppLaunchEnabled_whenQuery_thenShouldCallNativeApiWithEnabled() {

        // when
        apmModule.setAppLaunchEnabled(true);
        // then
        verify(APM.class, times(1));
        APM.setColdAppLaunchEnabled(true);
    }

    @Test
    public void given$endAppLaunch_whenQuery_thenShouldCallNativeApiWithEnabled() {

        // when
        apmModule.endAppLaunch();
        // then
        verify(APM.class, times(1));
        APM.endAppLaunch();
    }

    @Test
    public void testStartFlow() {
        String appFlowName = "appFlowName";

        apmModule.startFlow(appFlowName);

        mockAPM.verify(() -> APM.startFlow(appFlowName));
        mockAPM.verifyNoMoreInteractions();
    }

    @Test
    public void testEndFlow() {
        String appFlowName = "appFlowName";

        apmModule.endFlow(appFlowName);

        mockAPM.verify(() -> APM.endFlow(appFlowName));
        mockAPM.verifyNoMoreInteractions();
    }

    @Test
    public void testSetFlowAttribute() {
        String appFlowName = "appFlowName";
        String flowAttributeKey = "attributeKey";
        String flowAttributeValue = "attributeValue";
        apmModule.setFlowAttribute(appFlowName, flowAttributeKey, flowAttributeValue);

        mockAPM.verify(() -> APM.setFlowAttribute(appFlowName, flowAttributeKey, flowAttributeValue));
        mockAPM.verifyNoMoreInteractions();
    }

    @Test
    public void givenString$startUITrace_whenQuery_thenShouldCallNativeApiWithEnabled() {

        // when
        apmModule.startUITrace("uiTrace");
        // then
        verify(APM.class, times(1));
        APM.startUITrace("uiTrace");
    }

    @Test
    public void given$endUITrace_whenQuery_thenShouldCallNativeApiWithEnabled() {

        // when
        apmModule.startUITrace("uiTrace");
        apmModule.endUITrace();
        // then
        verify(APM.class, times(1));
        APM.endUITrace();
    }

    @Test
    public void given$setScreenRenderEnabled_whenQuery_thenShouldCallNativeApiWithEnabled() {
        apmModule.setScreenRenderingEnabled(true);
        // then
        verify(APM.class, times(1));
        APM.setScreenRenderingEnabled(true);
    }

    /********Custom Spans*********/

    @Test
    public void testSyncCustomSpan_shouldCallAPMWithCorrectDates() {
        // given
        String spanName = "testSpan";
        double startTimestamp = 1000000.0; // 1000000 microseconds = 1000 milliseconds
        double endTimestamp = 2000000.0;   // 2000000 microseconds = 2000 milliseconds
        Promise mockPromise = mock(Promise.class);

        // when
        apmModule.syncCustomSpan(spanName, startTimestamp, endTimestamp, mockPromise);

        // then
        ArgumentCaptor<Date> startDateCaptor = ArgumentCaptor.forClass(Date.class);
        ArgumentCaptor<Date> endDateCaptor = ArgumentCaptor.forClass(Date.class);

        mockAPM.verify(() -> APM.addCompletedCustomSpan(
                eq(spanName),
                startDateCaptor.capture(),
                endDateCaptor.capture()
        ));

        // Verify timestamp conversion (microseconds / 1000 = milliseconds)
        assert startDateCaptor.getValue().getTime() == 1000L;
        assert endDateCaptor.getValue().getTime() == 2000L;

        // Verify promise resolves with true
        verify(mockPromise).resolve(true);
    }

    @Test
    public void testSyncCustomSpan_withDifferentTimestamps() {
        // given
        String spanName = "anotherSpan";
        double startTimestamp = 5000000.0; // 5000 milliseconds
        double endTimestamp = 8000000.0;   // 8000 milliseconds
        Promise mockPromise = mock(Promise.class);

        // when
        apmModule.syncCustomSpan(spanName, startTimestamp, endTimestamp, mockPromise);

        // then
        ArgumentCaptor<Date> startDateCaptor = ArgumentCaptor.forClass(Date.class);
        ArgumentCaptor<Date> endDateCaptor = ArgumentCaptor.forClass(Date.class);

        mockAPM.verify(() -> APM.addCompletedCustomSpan(
                eq(spanName),
                startDateCaptor.capture(),
                endDateCaptor.capture()
        ));

        assert startDateCaptor.getValue().getTime() == 5000L;
        assert endDateCaptor.getValue().getTime() == 8000L;
        verify(mockPromise).resolve(true);
    }

    @Test
    public void testSyncCustomSpan_whenExceptionThrown_shouldResolveFalse() {
        // given
        String spanName = "errorSpan";
        double startTimestamp = 1000000.0;
        double endTimestamp = 2000000.0;
        Promise mockPromise = mock(Promise.class);

        // Mock APM to throw exception
        mockAPM.when(() -> APM.addCompletedCustomSpan(anyString(), any(Date.class), any(Date.class)))
                .thenThrow(new RuntimeException("Test exception"));

        // when
        apmModule.syncCustomSpan(spanName, startTimestamp, endTimestamp, mockPromise);

        // then
        verify(mockPromise).resolve(false);
    }

    @Test
    public void testSyncCustomSpan_withZeroTimestamps() {
        // given
        String spanName = "zeroSpan";
        double startTimestamp = 0.0;
        double endTimestamp = 0.0;
        Promise mockPromise = mock(Promise.class);

        // when
        apmModule.syncCustomSpan(spanName, startTimestamp, endTimestamp, mockPromise);

        // then
        ArgumentCaptor<Date> startDateCaptor = ArgumentCaptor.forClass(Date.class);
        ArgumentCaptor<Date> endDateCaptor = ArgumentCaptor.forClass(Date.class);

        mockAPM.verify(() -> APM.addCompletedCustomSpan(
                eq(spanName),
                startDateCaptor.capture(),
                endDateCaptor.capture()
        ));

        assert startDateCaptor.getValue().getTime() == 0L;
        assert endDateCaptor.getValue().getTime() == 0L;
        verify(mockPromise).resolve(true);
    }

    /********isCustomSpanEnabled*********/

    @Test
    public void testIsCustomSpanEnabled_whenFeatureEnabled_shouldResolveTrue() {
        // given
        Promise mockPromise = mock(Promise.class);

        // Mock InternalAPM to invoke callback with true
        mockInternalAPM.when(() -> InternalAPM._isFeatureEnabledCP(
                eq(APMFeature.CUSTOM_SPANS),
                eq("LuciqCustomSpan"),
                any(FeatureAvailabilityCallback.class)
        )).thenAnswer(invocation -> {
            FeatureAvailabilityCallback callback = invocation.getArgument(2);
            callback.invoke(true);
            return null;
        });

        // when
        apmModule.isCustomSpanEnabled(mockPromise);

        // then
        verify(mockPromise).resolve(true);
    }

    @Test
    public void testIsCustomSpanEnabled_whenFeatureDisabled_shouldResolveFalse() {
        // given
        Promise mockPromise = mock(Promise.class);

        // Mock InternalAPM to invoke callback with false
        mockInternalAPM.when(() -> InternalAPM._isFeatureEnabledCP(
                eq(APMFeature.CUSTOM_SPANS),
                eq("LuciqCustomSpan"),
                any(FeatureAvailabilityCallback.class)
        )).thenAnswer(invocation -> {
            FeatureAvailabilityCallback callback = invocation.getArgument(2);
            callback.invoke(false);
            return null;
        });

        // when
        apmModule.isCustomSpanEnabled(mockPromise);

        // then
        verify(mockPromise).resolve(false);
    }

    @Test
    public void testIsCustomSpanEnabled_whenExceptionThrown_shouldResolveFalse() {
        // given
        Promise mockPromise = mock(Promise.class);

        // Mock InternalAPM to throw exception
        mockInternalAPM.when(() -> InternalAPM._isFeatureEnabledCP(
                eq(APMFeature.CUSTOM_SPANS),
                eq("LuciqCustomSpan"),
                any(FeatureAvailabilityCallback.class)
        )).thenThrow(new RuntimeException("Test exception"));

        // when
        apmModule.isCustomSpanEnabled(mockPromise);

        // then
        verify(mockPromise).resolve(false);
    }

    @Test
    public void testIsCustomSpanEnabled_shouldCallWithCorrectParameters() {
        // given
        Promise mockPromise = mock(Promise.class);

        // Mock InternalAPM to invoke callback
        mockInternalAPM.when(() -> InternalAPM._isFeatureEnabledCP(
                any(),
                anyString(),
                any(FeatureAvailabilityCallback.class)
        )).thenAnswer(invocation -> {
            FeatureAvailabilityCallback callback = invocation.getArgument(2);
            callback.invoke(true);
            return null;
        });

        // when
        apmModule.isCustomSpanEnabled(mockPromise);

        // then - verify correct parameters were passed
        mockInternalAPM.verify(() -> InternalAPM._isFeatureEnabledCP(
                eq(APMFeature.CUSTOM_SPANS),
                eq("LuciqCustomSpan"),
                any(FeatureAvailabilityCallback.class)
        ));
    }

}
