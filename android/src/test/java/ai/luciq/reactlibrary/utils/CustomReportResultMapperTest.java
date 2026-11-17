package ai.luciq.reactlibrary.utils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import ai.luciq.bug.customreport.CustomReportResult;
import ai.luciq.bug.customreport.FieldError;
import ai.luciq.bug.customreport.NotSentReason;
import ai.luciq.reactlibrary.util.CustomReportFixtures;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.mockito.Mockito.mockStatic;

public class CustomReportResultMapperTest {

    private MockedStatic<Arguments> mockArguments;

    @Before
    public void setUp() {
        mockArguments = mockStatic(Arguments.class);
        mockArguments.when(Arguments::createMap).thenAnswer(invocation -> new JavaOnlyMap());
        mockArguments.when(Arguments::createArray).thenAnswer(invocation -> new JavaOnlyArray());
    }

    @After
    public void tearDown() {
        mockArguments.close();
    }

    @Test
    public void queued_matchesFixture() {
        final ReadableMap map = CustomReportResultMapper.toWritableMap(CustomReportResult.Queued.INSTANCE);

        CustomReportFixtures.assertMatchesFixture("result.queued.json", map);
        assertFalse(map.hasKey("notSentReason"));
    }

    @Test
    public void notSentTryLater_matchesFixture() {
        final ReadableMap map = CustomReportResultMapper.toWritableMap(
                new CustomReportResult.NotSent(NotSentReason.TRY_LATER));

        CustomReportFixtures.assertMatchesFixture("result.notSent.tryLater.json", map);
    }

    @Test
    public void invalid_matchesFixture_withAllErrorsInOrder() {
        final List<FieldError> errors = Arrays.asList(
                new FieldError(FieldError.Field.CATEGORY, null, FieldError.Problem.MISSING),
                new FieldError(FieldError.Field.ANSWER, "f_reason", FieldError.Problem.UNKNOWN),
                new FieldError(FieldError.Field.COMMENT, null, FieldError.Problem.TOO_SHORT),
                new FieldError(FieldError.Field.EMAIL, null, FieldError.Problem.INVALID),
                new FieldError(FieldError.Field.CONSENT, "c_share_logs", FieldError.Problem.MISSING),
                new FieldError(FieldError.Field.EXTENDED_FIELD, "repro_steps", FieldError.Problem.MISSING),
                new FieldError(FieldError.Field.SCREENSHOT, null, FieldError.Problem.INVALID),
                new FieldError(FieldError.Field.ATTACHMENT, "0", FieldError.Problem.TOO_LONG));

        final ReadableMap map = CustomReportResultMapper.toWritableMap(new CustomReportResult.Invalid(errors));

        CustomReportFixtures.assertMatchesFixture("result.invalid.json", map);
    }

    @Test
    public void everyNotSentReason_isEmittedByName() {
        final Map<NotSentReason, String> expected = new EnumMap<>(NotSentReason.class);
        expected.put(NotSentReason.UNAVAILABLE, "unavailable");
        expected.put(NotSentReason.TRY_LATER, "tryLater");
        expected.put(NotSentReason.DUPLICATE, "duplicate");
        assertEquals("every reason has an expected name", NotSentReason.values().length, expected.size());

        for (NotSentReason reason : NotSentReason.values()) {
            final ReadableMap map = CustomReportResultMapper.toWritableMap(new CustomReportResult.NotSent(reason));
            assertEquals("notSent", map.getString("status"));
            assertEquals(expected.get(reason), map.getString("notSentReason"));
            assertEquals(0, map.getArray("errors").size());
        }
    }

    @Test
    public void everyFieldAndProblem_isEmittedByName() {
        final Map<FieldError.Field, String> fields = new EnumMap<>(FieldError.Field.class);
        fields.put(FieldError.Field.CATEGORY, "category");
        fields.put(FieldError.Field.ANSWER, "answer");
        fields.put(FieldError.Field.COMMENT, "comment");
        fields.put(FieldError.Field.EMAIL, "email");
        fields.put(FieldError.Field.CONSENT, "consent");
        fields.put(FieldError.Field.EXTENDED_FIELD, "extendedField");
        fields.put(FieldError.Field.SCREENSHOT, "screenshot");
        fields.put(FieldError.Field.ATTACHMENT, "attachment");
        final Map<FieldError.Problem, String> problems = new EnumMap<>(FieldError.Problem.class);
        problems.put(FieldError.Problem.MISSING, "missing");
        problems.put(FieldError.Problem.UNKNOWN, "unknown");
        problems.put(FieldError.Problem.INVALID, "invalid");
        problems.put(FieldError.Problem.TOO_SHORT, "tooShort");
        problems.put(FieldError.Problem.TOO_LONG, "tooLong");
        assertEquals(FieldError.Field.values().length, fields.size());
        assertEquals(FieldError.Problem.values().length, problems.size());

        for (FieldError.Field field : FieldError.Field.values()) {
            for (FieldError.Problem problem : FieldError.Problem.values()) {
                final List<FieldError> errors = new ArrayList<>(
                        Collections.singletonList(new FieldError(field, "k", problem)));
                final ReadableMap map = CustomReportResultMapper.toWritableMap(new CustomReportResult.Invalid(errors));
                final ReadableMap error = map.getArray("errors").getMap(0);

                assertEquals("invalid", map.getString("status"));
                assertEquals(fields.get(field), error.getString("field"));
                assertEquals(problems.get(problem), error.getString("problem"));
                assertEquals("k", error.getString("key"));
            }
        }
    }

    @Test
    public void unavailable_isNotSentUnavailableWithNoErrors() {
        final ReadableMap map = CustomReportResultMapper.unavailable();

        assertEquals("notSent", map.getString("status"));
        assertEquals("unavailable", map.getString("notSentReason"));
        assertEquals(0, map.getArray("errors").size());
    }
}
