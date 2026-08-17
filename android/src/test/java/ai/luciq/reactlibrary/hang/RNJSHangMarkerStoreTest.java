package ai.luciq.reactlibrary.hang;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import android.content.Context;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.Charset;

import ai.luciq.library.LogLevel;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;

public class RNJSHangMarkerStoreTest {
    @Rule
    public final TemporaryFolder temporaryFolder = new TemporaryFolder();

    // android.util.Log is unavailable in JVM unit tests; silence the gate.
    @Before
    public void silenceLogger() {
        LuciqRNLogger.setLevel(LogLevel.NONE);
    }

    @After
    public void restoreLogger() {
        LuciqRNLogger.setLevel(LogLevel.ERROR);
    }

    @Test
    public void persistRejectsInvalidValues() {
        RNJSHangMarkerStore store = newStore();
        File markerFile = new File(temporaryFolder.getRoot(), "luciq_js_hang_marker.json");

        store.persist(-1L, 4000L, null, null);
        store.persist(System.currentTimeMillis(), -1L, null, null);

        assertEquals(false, markerFile.exists());
    }

    @Test
    public void persistAndLoadRoundTripCarriesCapturedFrames() {
        RNJSHangMarkerStore store = newStore();
        String framesJson =
                "[{\"methodName\":\"blocked\",\"file\":\"main.jsbundle\","
                        + "\"lineNumber\":12,\"column\":34}]";

        store.persist(System.currentTimeMillis(), 4000L, framesJson, "hermes_sampling");
        RNJSHangMarkerStore.Marker marker = store.load();

        assertNotNull(marker);
        assertEquals(4000L, marker.lastObservedGapMs);
        assertEquals("hermes_sampling", marker.stackCaptureMode);
        assertEquals(1, RNJSHangProfiler.framesFromJson(marker.framesJson).size());
    }

    @Test
    public void persistWithoutFramesLoadsDurationOnlyMarker() {
        RNJSHangMarkerStore store = newStore();

        store.persist(System.currentTimeMillis(), 4000L, null, null);
        RNJSHangMarkerStore.Marker marker = store.load();

        assertNotNull(marker);
        assertNull(marker.framesJson);
        assertNull(marker.stackCaptureMode);
    }

    @Test
    public void loadRejectsAndClearsMalformedMarker() throws Exception {
        RNJSHangMarkerStore store = newStore();
        File markerFile = new File(temporaryFolder.getRoot(), "luciq_js_hang_marker.json");
        write(markerFile, "not json {{{ torn write");

        assertNull(store.load());
        assertEquals(false, markerFile.exists());
    }

    private RNJSHangMarkerStore newStore() {
        Context context = mock(Context.class);
        when(context.getFilesDir()).thenReturn(temporaryFolder.getRoot());
        return new RNJSHangMarkerStore(context);
    }

    private static void write(File file, String value) throws Exception {
        FileOutputStream output = new FileOutputStream(file);
        try {
            output.write(value.getBytes(Charset.forName("UTF-8")));
        } finally {
            output.close();
        }
    }
}
