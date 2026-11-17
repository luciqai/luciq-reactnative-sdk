package ai.luciq.reactlibrary;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.Assert.assertEquals;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import java.util.ArrayList;
import java.util.List;

import ai.luciq.library.Luciq;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

/**
 * addPrivateView runs from a ref callback, when JavaScript commits a render. With the new
 * architecture the native view is mounted later, so the module retries until it is.
 */
public class RNLuciqPrivateViewTest {

    private static final int TAG = 42;

    private MockedStatic<Log> mockLog;
    private MockedStatic<Looper> mockLooper;
    private MockedStatic<MainThreadHandler> mockMainThreadHandler;
    private MockedStatic<Luciq> mockLuciq;

    private RNLuciqReactnativeModule module;
    private final List<Runnable> retries = new ArrayList<>();

    @Before
    public void setUp() {
        mockLog = mockStatic(Log.class);
        mockLooper = mockStatic(Looper.class);
        mockMainThreadHandler = mockStatic(MainThreadHandler.class);
        mockLuciq = mockStatic(Luciq.class);
        when(Looper.getMainLooper()).thenReturn(mock(Looper.class));
        mockMainThreadHandler.when(() -> MainThreadHandler.runOnMainThread(any(Runnable.class)))
                .thenAnswer(invocation -> {
                    invocation.getArgument(0, Runnable.class).run();
                    return null;
                });

        module = spy(new RNLuciqReactnativeModule(null));
        Handler handler = mock(Handler.class);
        doAnswer(invocation -> {
            retries.add(invocation.getArgument(0, Runnable.class));
            return true;
        }).when(handler).postDelayed(any(Runnable.class), anyLong());
        doReturn(handler).when(module).privateViewRetryHandler();
    }

    @After
    public void tearDown() {
        mockLog.close();
        mockLooper.close();
        mockMainThreadHandler.close();
        mockLuciq.close();
    }

    /** Runs the retries posted so far, as the main looper would on the next frames. */
    private void runRetries() {
        List<Runnable> due = new ArrayList<>(retries);
        retries.clear();
        for (Runnable retry : due) {
            retry.run();
        }
    }

    @Test
    public void givenAMountedView_whenAddPrivateView_thenItIsPrivateWithoutRetrying() {
        View view = mock(View.class);
        doReturn(view).when(module).resolveReactView(TAG);

        module.addPrivateView((double) TAG);

        mockLuciq.verify(() -> Luciq.addPrivateViews(view), times(1));
        assertEquals(0, retries.size());
    }

    @Test
    public void givenAViewMountedAfterTheCall_whenAddPrivateView_thenItIsPrivateOnceMounted() {
        View view = mock(View.class);
        doReturn(null).doReturn(null).doReturn(view).when(module).resolveReactView(TAG);

        module.addPrivateView((double) TAG);
        mockLuciq.verify(() -> Luciq.addPrivateViews(any(View[].class)), never());
        runRetries();
        runRetries();

        mockLuciq.verify(() -> Luciq.addPrivateViews(view), times(1));
        assertEquals(0, retries.size());
    }

    @Test
    public void givenAViewNotMountedYet_whenRemovePrivateViewRunsFirst_thenItIsNeverMadePrivate() {
        View view = mock(View.class);
        doReturn(null).doReturn(view).when(module).resolveReactView(TAG);

        module.addPrivateView((double) TAG);
        module.removePrivateView((double) TAG);
        runRetries();

        mockLuciq.verify(() -> Luciq.addPrivateViews(any(View[].class)), never());
    }

    @Test
    public void givenAViewThatNeverMounts_whenAddPrivateView_thenItStopsRetrying() {
        doReturn(null).when(module).resolveReactView(anyInt());

        module.addPrivateView((double) TAG);
        for (int i = 0; i < RNLuciqReactnativeModule.PRIVATE_VIEW_MAX_ATTEMPTS + 5; i++) {
            runRetries();
        }

        verify(module, times(RNLuciqReactnativeModule.PRIVATE_VIEW_MAX_ATTEMPTS)).resolveReactView(TAG);
        assertEquals(0, retries.size());
        mockLuciq.verify(() -> Luciq.addPrivateViews(any(View[].class)), never());
    }
}
