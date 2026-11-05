package ai.luciq.reactlibrary;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.facebook.react.bridge.ReactApplicationContext;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import ai.luciq.library.Luciq;

public class RNLuciqReactnativePackageTest {

    /** Not a module name the package serves, so getModule constructs nothing. */
    private static final String UNKNOWN_MODULE = "NotALuciqModule";

    private MockedStatic<Luciq> mockLuciq;
    private MockedStatic<RNLuciq> mockRNLuciq;
    private RNLuciq rnLuciq;

    @Before
    public void setUp() {
        mockLuciq = mockStatic(Luciq.class);
        mockRNLuciq = mockStatic(RNLuciq.class);
        rnLuciq = mock(RNLuciq.class);
        mockRNLuciq.when(RNLuciq::getInstance).thenReturn(rnLuciq);
    }

    @After
    public void tearDown() {
        mockRNLuciq.close();
        mockLuciq.close();
    }

    @Test
    public void givenLuciqNotStartedYet_whenModuleLoads_thenSetsTheReactNativePlatform() {
        mockLuciq.when(Luciq::isBuilt).thenReturn(false);

        new RNLuciqReactnativePackage().getModule(UNKNOWN_MODULE, mock(ReactApplicationContext.class));

        verify(rnLuciq).setCurrentPlatform();
    }

    @Test
    public void givenNativeAppAlreadyStartedLuciq_whenModuleLoads_thenLeavesThePlatformAlone() {
        mockLuciq.when(Luciq::isBuilt).thenReturn(true);

        new RNLuciqReactnativePackage().getModule(UNKNOWN_MODULE, mock(ReactApplicationContext.class));

        verify(rnLuciq, never()).setCurrentPlatform();
    }
}
