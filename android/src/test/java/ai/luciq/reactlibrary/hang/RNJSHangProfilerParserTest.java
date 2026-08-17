package ai.luciq.reactlibrary.hang;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;

import ai.luciq.library.LogLevel;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;

public class RNJSHangProfilerParserTest {
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
    public void parsesModalLeafParentChain() throws Exception {
        File trace = writeTrace("{"
                + "\"samples\":[{\"sf\":1},{\"sf\":1},{\"sf\":2}],"
                + "\"stackFrames\":{"
                + "\"1\":{\"name\":\"blocked(main.jsbundle:12:34)\",\"category\":\"JavaScript\",\"parent\":3},"
                + "\"2\":{\"name\":\"other(main.jsbundle:1:1)\",\"category\":\"JavaScript\"},"
                + "\"3\":{\"name\":\"caller(main.jsbundle:56:78)\",\"category\":\"JavaScript\"}"
                + "}}");

        List<RNJSHangProfiler.Frame> frames =
                RNJSHangProfiler.parseCulpritFrames(trace, "main.jsbundle", 0L);

        assertEquals(2, frames.size());
        assertEquals("blocked", frames.get(0).methodName);
        assertEquals(12L, frames.get(0).lineNumber);
        assertEquals("caller", frames.get(1).methodName);
    }

    @Test
    public void emitsBytecodeFramesInHermesErrorStackShape() throws Exception {
        File trace = writeTrace("{"
                + "\"samples\":[{\"sf\":1}],"
                + "\"stackFrames\":{"
                + "\"1\":{\"name\":\"anonymous\",\"category\":\"JavaScript\","
                + "\"funcVirtAddr\":1000,\"offset\":24}"
                + "}}");

        List<RNJSHangProfiler.Frame> frames =
                RNJSHangProfiler.parseCulpritFrames(trace, "index.android.bundle", 0L);

        assertEquals(1, frames.size());
        assertEquals("index.android.bundle", frames.get(0).file);
        assertEquals(1L, frames.get(0).lineNumber);
        assertEquals(1024L, frames.get(0).column);
    }

    @Test
    public void filtersSamplesBeyondTheBlockedWindow() throws Exception {
        // Timestamps are microsecond deltas: the recovery frame is sampled more
        // often but falls outside the 1 s window, so the blocked frame must win.
        File trace = writeTrace("{"
                + "\"samples\":["
                + "{\"sf\":1,\"ts\":0},{\"sf\":1,\"ts\":500000},"
                + "{\"sf\":2,\"ts\":1500000},{\"sf\":2,\"ts\":1600000},{\"sf\":2,\"ts\":1700000}],"
                + "\"stackFrames\":{"
                + "\"1\":{\"name\":\"blocked(main.jsbundle:12:34)\",\"category\":\"JavaScript\"},"
                + "\"2\":{\"name\":\"recovery(main.jsbundle:56:78)\",\"category\":\"JavaScript\"}"
                + "}}");

        List<RNJSHangProfiler.Frame> frames =
                RNJSHangProfiler.parseCulpritFrames(trace, "main.jsbundle", 1000L);

        assertEquals(1, frames.size());
        assertEquals("blocked", frames.get(0).methodName);
    }

    @Test
    public void malformedTraceDegradesToNoFrames() throws Exception {
        assertTrue(RNJSHangProfiler.parseCulpritFrames(
                writeTrace("not json at all"), "main.jsbundle", 0L).isEmpty());
        assertTrue(RNJSHangProfiler.parseCulpritFrames(
                writeTrace("{\"samples\":[],\"stackFrames\":{}}"), "main.jsbundle", 0L).isEmpty());
        assertTrue(RNJSHangProfiler.parseCulpritFrames(
                writeTrace("{\"samples\":[{\"sf\":1}]}"), "main.jsbundle", 0L).isEmpty());
    }

    @Test
    public void oversizedTraceIsRejected() throws Exception {
        StringBuilder oversized = new StringBuilder("{\"samples\":[{\"sf\":1}],\"padding\":\"");
        for (int i = 0; i < 1024 * 1024 + 1; i++) {
            oversized.append('x');
        }
        oversized.append("\"}");

        assertTrue(RNJSHangProfiler.parseCulpritFrames(
                writeTrace(oversized.toString()), "main.jsbundle", 0L).isEmpty());
    }

    @Test
    public void framesJsonRoundTripsAndBoundsMalformedInput() {
        List<RNJSHangProfiler.Frame> frames = new ArrayList<>();
        frames.add(new RNJSHangProfiler.Frame("blocked", "main.jsbundle", 12L, 34L));

        List<RNJSHangProfiler.Frame> restored =
                RNJSHangProfiler.framesFromJson(RNJSHangProfiler.framesToJson(frames));

        assertEquals(1, restored.size());
        assertEquals("blocked", restored.get(0).methodName);
        assertEquals("main.jsbundle", restored.get(0).file);
        assertEquals(12L, restored.get(0).lineNumber);
        assertEquals(34L, restored.get(0).column);

        assertTrue(RNJSHangProfiler.framesFromJson(null).isEmpty());
        assertTrue(RNJSHangProfiler.framesFromJson("not json").isEmpty());
        assertTrue(RNJSHangProfiler.framesFromJson("{\"an\":\"object\"}").isEmpty());
    }

    private File writeTrace(String content) throws Exception {
        File trace = temporaryFolder.newFile();
        FileOutputStream output = new FileOutputStream(trace);
        try {
            output.write(content.getBytes(Charset.forName("UTF-8")));
        } finally {
            output.close();
        }
        return trace;
    }
}
