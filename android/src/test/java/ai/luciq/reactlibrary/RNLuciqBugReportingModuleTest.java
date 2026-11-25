package ai.luciq.reactlibrary;

import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import ai.luciq.bug.BugReporting;
import ai.luciq.bug.customreport.CustomReportResult;
import ai.luciq.bug.customreport.EmailRequirement;
import ai.luciq.bug.customreport.NotSentReason;
import ai.luciq.bug.customreport.OnCustomReportResultCallback;
import ai.luciq.bug.customreport.OnReportConfigurationReadyCallback;
import ai.luciq.bug.customreport.ReportConfiguration;
import ai.luciq.bug.customreport.ReportRequirements;
import ai.luciq.library.Feature;
import ai.luciq.library.OnSdkDismissCallback;
import ai.luciq.library.extendedbugreport.ExtendedBugReport;
import ai.luciq.library.invocation.LuciqInvocationEvent;
import ai.luciq.library.invocation.OnInvokeCallback;
import ai.luciq.library.invocation.util.LuciqVideoRecordingButtonPosition;
import ai.luciq.reactlibrary.utils.LuciqUtil;
import ai.luciq.reactlibrary.utils.MainThreadHandler;


import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;
import org.mockito.internal.verification.VerificationModeFactory;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.argThat;

public class RNLuciqBugReportingModuleTest {

    private RNLuciqBugReportingModule bugReportingModule = spy(new RNLuciqBugReportingModule(mock(ReactApplicationContext.class)));
    private final static ScheduledExecutorService mainThread = Executors.newSingleThreadScheduledExecutor();

    // Mock Objects
    private MockedStatic<Looper> mockLooper;
    private MockedStatic<Log> mockLog;
    private MockedStatic <MainThreadHandler> mockMainThreadHandler;
    private MockedStatic <BugReporting> mockBugReporting;
    private MockedStatic <LuciqUtil> mockLuciqUtil;

    @Before
    public void mockMainThreadHandler() throws Exception {
        // Mock static functions
        mockLog = mockStatic(Log.class);
        mockBugReporting = mockStatic(BugReporting.class);
        mockLooper = mockStatic(Looper.class);
        mockMainThreadHandler = mockStatic(MainThreadHandler.class);
        mockLuciqUtil = mockStatic(LuciqUtil.class);

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
        mockLog.close();
        mockLooper.close();
        mockMainThreadHandler.close();
        mockBugReporting.close();
        mockLuciqUtil.close();
    }

    /********BugReporting*********/


    @Test
    public void givenShakingThreshold$setShakingThresholdForAndroid_whenQuery_thenShouldCallNativeApiWithShakingThreshold() {
        // given
        int shakingThreshold = 30;
        // when
        bugReportingModule.setShakingThresholdForAndroid(shakingThreshold);
        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));
        BugReporting.setShakingThreshold(shakingThreshold);
    }

    @Test
    public void givenFalse$setBugReportingEnabled_whenQuery_thenShouldCallNativeApiWithDisabled() {
        // given

        // when
        bugReportingModule.setEnabled(false);
        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));

        BugReporting.setState(Feature.State.DISABLED);
    }

    @Test
    public void givenTrue$setBugReportingEnabled_whenQuery_thenShouldCallNativeApiWithEnabled() {
        // given

        // when
        bugReportingModule.setEnabled(true);
        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));

        BugReporting.setState(Feature.State.ENABLED);
    }

    @Test
    public void givenIsEnabled$setAutoScreenRecordingEnabled_whenQuery_thenShouldCallNativeApiWithIsEnabled() {
        // given

        // when
        bugReportingModule.setAutoScreenRecordingEnabled(true);
        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));

        BugReporting.setAutoScreenRecordingEnabled(true);
    }

    @Test
    public void givenTrue$setViewHierarchyEnabled_whenQuery_shouldCallNativeApiWithEnabled() {
        // given

        // when
        bugReportingModule.setViewHierarchyEnabled(true);
        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));

        BugReporting.setViewHierarchyState(Feature.State.ENABLED);
    }

    @Test
    public void givenFalse$setViewHierarchyEnabled_whenQuery_shouldCallNativeApiWithDisabled() {
        // given

        // when
        bugReportingModule.setViewHierarchyEnabled(false);
        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));

        BugReporting.setViewHierarchyState(Feature.State.DISABLED);
    }

    @Test
    public void givenBooleanArgs$setEnabledAttachmentTypes_whenQuery_shouldCallNativeApiWithBooleanArgs() {
        // given

        // when
        bugReportingModule.setEnabledAttachmentTypes(true, true, false, true);
        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));

        BugReporting.setAttachmentTypesEnabled(true, true, false, true);
    }

    @Test
    public void givenExtendedBugReportMode$setExtendedBugReportMode_whenQuery_thenShouldCallNativeApiWithArgs() {
        // given
        Map<String, ExtendedBugReport.State> args = ArgsRegistry.extendedBugReportStates;

        // when
        for (String strExtendedBugReportMode : args.keySet()) {
            bugReportingModule.setExtendedBugReportMode(strExtendedBugReportMode);
        }

        // then
        for (ExtendedBugReport.State extendedBugReportMode : args.values()) {
            verify(BugReporting.class,VerificationModeFactory.times(1));
            BugReporting.setExtendedBugReportState(extendedBugReportMode);
        }
    }

    @Test
    public void givenInvocationEvent$setInvocationEvents_whenQuery_thenShouldCallNativeApiWithArgs() {
        // given
        final Map<String,LuciqInvocationEvent> args = ArgsRegistry.invocationEvents;
        final String[] keysArray = args.keySet().toArray(new String[0]);
        JavaOnlyArray actualArray = new JavaOnlyArray();
        for (String key : keysArray) {
            actualArray.pushString(key);
        }

        // when
        bugReportingModule.setInvocationEvents(actualArray);

        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));
        BugReporting.setInvocationEvents(args.values().toArray(new LuciqInvocationEvent[0]));
    }

    @Test
    public void givenOptions$setOptions_whenQuery_thenShouldCallNativeApiWithArgs() {
        // given
        final Map<String, Integer> args = ArgsRegistry.invocationOptions;
        final String[] keysArray = args.keySet().toArray(new String[0]);
        JavaOnlyArray actualArray = new JavaOnlyArray();
        actualArray.pushString(keysArray[0]);
        actualArray.pushString(keysArray[1]);

        // when
        bugReportingModule.setOptions(actualArray);

        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));
        int option1 = args.get(keysArray[0]);
        int option2 = args.get(keysArray[1]);
        BugReporting.setOptions(option1);
        verify(BugReporting.class,VerificationModeFactory.times(1));
        BugReporting.setOptions(option2);
    }

    @Test
    public void given$setOnInvokeHandler_whenQuery_thenShouldSetNativeCallback() {
        // when
        mockBugReporting.when(() -> BugReporting.setOnInvokeCallback(any(OnInvokeCallback.class)))
                .thenAnswer(new Answer<Object>() {
                    @Override
                    public Object answer(InvocationOnMock invocation) {
                        ((OnInvokeCallback) invocation.getArguments()[0]).onInvoke();
                        return null;
                    }
                });

        bugReportingModule.setOnInvokeHandler();

        // then
        verify(bugReportingModule).sendEvent(Constants.LCQ_PRE_INVOCATION_HANDLER, null);
    }


    @Test
    public void given$setOnSDKDismissedHandler_whenQuery_thenShouldSetNativeCallback() {
        // given
        MockedStatic mockArgument = mockStatic(Arguments.class);
        MockedStatic mockReactApplicationContext = mockStatic(ReactApplicationContext.class);

        // when
        when(Arguments.createMap()).thenReturn(new JavaOnlyMap());
        mockBugReporting.when(() -> BugReporting.setOnDismissCallback(any(OnSdkDismissCallback.class))).thenAnswer(new Answer() {
            public Object answer(InvocationOnMock invocation) {
                ((OnSdkDismissCallback) invocation.getArguments()[0])
                        .call(OnSdkDismissCallback.DismissType.CANCEL, OnSdkDismissCallback.ReportType.BUG);
                return null;
            }});
        bugReportingModule.setOnSDKDismissedHandler();

        // then
        WritableMap params = new JavaOnlyMap();
        params.putString("dismissType", OnSdkDismissCallback.DismissType.CANCEL.toString());
        params.putString("reportType", OnSdkDismissCallback.ReportType.BUG.toString());
        verify(bugReportingModule).sendEvent(Constants.LCQ_POST_INVOCATION_HANDLER, params);
        mockArgument.close();
        mockReactApplicationContext.close();
    }

    @Test
    public void givenArray$setReportTypes_whenQuery_thenShouldCallNativeApiWithEnumArgs() {
        // given
        final Map<String, Integer> args = ArgsRegistry.reportTypes;
        final String[] keysArray = args.keySet().toArray(new String[0]);
        JavaOnlyArray actualArray = new JavaOnlyArray();
        actualArray.pushString(keysArray[0]);
        actualArray.pushString(keysArray[1]);

        // when
        bugReportingModule.setReportTypes(actualArray);

        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));

        int type1 = args.get(keysArray[0]);
        int type2 = args.get(keysArray[1]);
        BugReporting.setReportTypes(type1, type2);
    }

    @Test
    public void givenString$setVideoRecordingFloatingButtonPosition_whenQuery_thenShouldCallNativeApi() {
        // given
        final Map<String,LuciqVideoRecordingButtonPosition> args = ArgsRegistry.recordButtonPositions;
        final String[] keysArray = args.keySet().toArray(new String[0]);

        // when
        bugReportingModule.setVideoRecordingFloatingButtonPosition(keysArray[0]);

        // then
        verify(BugReporting.class,VerificationModeFactory.times(1));
       LuciqVideoRecordingButtonPosition position = (LuciqVideoRecordingButtonPosition) args.get(keysArray[0]);
        BugReporting.setVideoRecordingFloatingButtonPosition(position);
    }

    @Test
    public void givenArgs$showBugReportingWithReportTypeAndOptions_whenQuery_thenShouldCallNativeApiWithEnums() {
        // given
        final Map<String, Integer> optionsArgs = ArgsRegistry.invocationOptions;
        final Map<String, Integer> reportTypeArgs = ArgsRegistry.reportTypes;
        final String[] keysArray = optionsArgs.keySet().toArray(new String[0]);
        final String[] reportTypeKeys = reportTypeArgs.keySet().toArray(new String[0]);
        JavaOnlyArray actualArray = new JavaOnlyArray();
        actualArray.pushString(keysArray[0]);
        actualArray.pushString(keysArray[1]);

        // when
        bugReportingModule.show(reportTypeKeys[0], actualArray);

        // then
        int option1 = optionsArgs.get(keysArray[0]);
        int option2 = optionsArgs.get(keysArray[1]);
        verify(BugReporting.class,VerificationModeFactory.times(1));

        BugReporting.setOptions(option1);
        verify(BugReporting.class,VerificationModeFactory.times(1));

        BugReporting.setOptions(option2);
        verify(BugReporting.class,VerificationModeFactory.times(1));

        BugReporting.show(reportTypeArgs.get(reportTypeKeys[0]));
    }

    @Test
    public void givenArgs$setDisclaimerText_whenQuery_shouldCallNativeApiWithArgs() {
        // given
        String text = "This is a disclaimer text!";

        // when
        bugReportingModule.setDisclaimerText(text);

        // then
        verify(BugReporting.class, VerificationModeFactory.times(1));

        BugReporting.setDisclaimerText(text);
    }

    @Test
    public void givenArgs$setCommentMinimumCharacterCount_whenQuery_thenShouldCallNativeApiWithArgs() {
        // given
        final int count = 20;
        final Map<String, Integer> args = ArgsRegistry.reportTypes;
        final String[] keysArray = args.keySet().toArray(new String[0]);
        JavaOnlyArray actualArray = new JavaOnlyArray();
        actualArray.pushString(keysArray[0]);

        // when
        bugReportingModule.setCommentMinimumCharacterCount(count, actualArray);

        // then
        verify(BugReporting.class, VerificationModeFactory.times(1));
        int type1 = args.get(keysArray[0]);

        BugReporting.setCommentMinimumCharacterCountForBugReportType(count, type1);
    }
    @Test
    public void TestAddUserConsent() {
               final Map<String, String> args = ArgsRegistry.userConsentActionType;
               final String[] keysArray = args.keySet().toArray(new String[0]);

               final String key = "testKey";
               final String description = "Consent description";
               final boolean mandatory = true;
               final boolean checked = true;
               final String inputAction = keysArray[0];

               final String expectedMappedAction = args.get(inputAction);

               bugReportingModule.addUserConsent(key, description, mandatory, checked, inputAction);

               verify(BugReporting.class, VerificationModeFactory.times(1));
               BugReporting.addUserConsent(key, description, mandatory, checked, expectedMappedAction);
    }

      @Test
        public void testSetProactiveReportingConfigurations() {
            // given
            boolean enabled = true;
            int gapBetweekDialogs = 20;
            int modeDelay = 30;

            // when
            bugReportingModule.setProactiveReportingConfigurations(enabled, gapBetweekDialogs, modeDelay);

            // then
            mockBugReporting.verify(() -> BugReporting.setProactiveReportingConfigurations(argThat(config ->
                    config.getModalsGap() == gapBetweekDialogs &&
                            config.getDetectionGap() == modeDelay &&
                            config.isEnabled() == enabled
            )));


        }

    /******** Custom reports *********/

    private static final String BUG_KEY = "bugReportingReportTypeBug";

    @Test
    public void givenArray$setReportCategoriesScope_whenQuery_thenShouldCallNativeApiWithIdentifiers() {
        // given
        JavaOnlyArray identifiers = JavaOnlyArray.of("checkout", "refund");

        // when
        bugReportingModule.setReportCategoriesScope(identifiers);

        // then
        mockBugReporting.verify(() -> BugReporting.setReportCategoriesScope("checkout", "refund"));
    }

    @Test
    public void givenEmptyArray$setReportCategoriesScope_whenQuery_thenShouldCallNativeApiWithNoIdentifiers() {
        // when
        bugReportingModule.setReportCategoriesScope(new JavaOnlyArray());

        // then
        mockBugReporting.verify(() -> BugReporting.setReportCategoriesScope(new String[0]));
    }

    @Test
    public void givenNull$setReportCategoriesScope_whenQuery_thenShouldClearTheScope() {
        // when
        bugReportingModule.setReportCategoriesScope(null);

        // then
        mockBugReporting.verify(() -> BugReporting.setReportCategoriesScope((String[]) null));
    }

    @Test
    public void givenConfiguration$getReportConfiguration_whenReady_thenShouldResolveMappedMap() {
        // given
        MockedStatic<Arguments> mockArguments = mockStatic(Arguments.class);
        mockArguments.when(Arguments::createMap).thenAnswer(invocation -> new JavaOnlyMap());
        mockArguments.when(Arguments::createArray).thenAnswer(invocation -> new JavaOnlyArray());
        Promise promise = mock(Promise.class);
        // A mock, not the constructor: it is internal to the SDK and its parameters change between versions.
        ReportRequirements requirements = mock(ReportRequirements.class);
        when(requirements.getEmail()).thenReturn(EmailRequirement.OPTIONAL);
        ReportConfiguration configuration = new ReportConfiguration(
                BugReporting.ReportType.BUG, Collections.emptyList(), null, requirements);
        mockBugReporting.when(() -> BugReporting.getReportConfiguration(eq(BugReporting.ReportType.BUG), any()))
                .thenAnswer(invocation -> {
                    invocation.getArgument(1, OnReportConfigurationReadyCallback.class).onReady(configuration);
                    return null;
                });

        // when
        bugReportingModule.getReportConfiguration(BUG_KEY, promise);

        // then
        verify(promise).resolve(argThat(value -> {
            ReadableMap map = (ReadableMap) value;
            return map.getArray("categories").size() == 0
                    && map.isNull("preselectedCategory")
                    && "optional".equals(map.getMap("requirements").getString("email"));
        }));
        mockArguments.close();
    }

    @Test
    public void givenNullConfiguration$getReportConfiguration_whenReady_thenShouldResolveNull() {
        // given
        Promise promise = mock(Promise.class);
        mockBugReporting.when(() -> BugReporting.getReportConfiguration(eq(BugReporting.ReportType.BUG), any()))
                .thenAnswer(invocation -> {
                    invocation.getArgument(1, OnReportConfigurationReadyCallback.class).onReady(null);
                    return null;
                });

        // when
        bugReportingModule.getReportConfiguration(BUG_KEY, promise);

        // then
        verify(promise).resolve(isNull());
    }

    @Test
    public void givenUnknownType$getReportConfiguration_whenQuery_thenShouldResolveNull() {
        // given
        Promise promise = mock(Promise.class);

        // when
        bugReportingModule.getReportConfiguration("notAReportType", promise);

        // then
        verify(promise).resolve(isNull());
        mockBugReporting.verify(() -> BugReporting.getReportConfiguration(any(Integer.class), any()), never());
    }

    @Test
    public void givenQueued$submitReport_whenResult_thenShouldResolveQueued() {
        // given
        MockedStatic<Arguments> mockArguments = mockStatic(Arguments.class);
        mockArguments.when(Arguments::createMap).thenAnswer(invocation -> new JavaOnlyMap());
        mockArguments.when(Arguments::createArray).thenAnswer(invocation -> new JavaOnlyArray());
        Promise promise = mock(Promise.class);
        mockBugReporting.when(() -> BugReporting.submitReport(any(), any())).thenAnswer(invocation -> {
            invocation.getArgument(1, OnCustomReportResultCallback.class).onResult(CustomReportResult.Queued.INSTANCE);
            return null;
        });
        JavaOnlyMap report = JavaOnlyMap.of("comment", "Refund was wrong", "categoryIdentifier", "checkout-refund",
                "screenshot", "currentScreen");

        // when
        bugReportingModule.submitReport(BUG_KEY, report, promise);

        // then
        verify(promise).resolve(argThat(value -> {
            ReadableMap map = (ReadableMap) value;
            return "queued".equals(map.getString("status")) && map.getArray("errors").size() == 0;
        }));
        mockArguments.close();
    }

    @Test
    public void givenNotSent$submitReport_whenResult_thenShouldResolveReason() {
        // given
        MockedStatic<Arguments> mockArguments = mockStatic(Arguments.class);
        mockArguments.when(Arguments::createMap).thenAnswer(invocation -> new JavaOnlyMap());
        mockArguments.when(Arguments::createArray).thenAnswer(invocation -> new JavaOnlyArray());
        Promise promise = mock(Promise.class);
        mockBugReporting.when(() -> BugReporting.submitReport(any(), any())).thenAnswer(invocation -> {
            invocation.getArgument(1, OnCustomReportResultCallback.class)
                    .onResult(new CustomReportResult.NotSent(NotSentReason.DUPLICATE));
            return null;
        });

        // when
        bugReportingModule.submitReport(BUG_KEY, new JavaOnlyMap(), promise);

        // then
        verify(promise).resolve(argThat(value -> {
            ReadableMap map = (ReadableMap) value;
            return "notSent".equals(map.getString("status")) && "duplicate".equals(map.getString("notSentReason"));
        }));
        mockArguments.close();
    }

    @Test
    public void givenUnknownType$submitReport_whenQuery_thenShouldResolveUnavailable() {
        // given
        MockedStatic<Arguments> mockArguments = mockStatic(Arguments.class);
        mockArguments.when(Arguments::createMap).thenAnswer(invocation -> new JavaOnlyMap());
        mockArguments.when(Arguments::createArray).thenAnswer(invocation -> new JavaOnlyArray());
        Promise promise = mock(Promise.class);

        // when
        bugReportingModule.submitReport("notAReportType", new JavaOnlyMap(), promise);

        // then
        verify(promise).resolve(argThat(value -> {
            ReadableMap map = (ReadableMap) value;
            return "notSent".equals(map.getString("status")) && "unavailable".equals(map.getString("notSentReason"));
        }));
        mockBugReporting.verify(() -> BugReporting.submitReport(any(), any()), never());
        mockArguments.close();
    }
}
