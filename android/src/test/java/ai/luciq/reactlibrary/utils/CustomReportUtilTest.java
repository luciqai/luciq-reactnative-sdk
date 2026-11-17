package ai.luciq.reactlibrary.utils;

import android.net.Uri;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;

import ai.luciq.bug.BugReporting;
import ai.luciq.bug.customreport.CustomReport;
import ai.luciq.bug.customreport.CustomReportResult;
import ai.luciq.bug.customreport.EmailRequirement;
import ai.luciq.bug.customreport.FieldError;
import ai.luciq.bug.customreport.NotSentReason;
import ai.luciq.bug.customreport.ReportConfiguration;
import ai.luciq.bug.customreport.ReportConfigurationCategory;
import ai.luciq.bug.customreport.ReportConfigurationField;
import ai.luciq.bug.customreport.ReportConsent;
import ai.luciq.bug.customreport.ReportExtendedField;
import ai.luciq.bug.customreport.ReportRequirements;
import ai.luciq.bug.customreport.ReportScreenshot;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

public class CustomReportUtilTest {

    private static final String LOG_PATH = "/data/user/0/com.example/files/report.log";

    private final CustomReport.Builder builder = mock(CustomReport.Builder.class);
    private MockedStatic<Arguments> mockArguments;
    private MockedStatic<Uri> mockUri;

    @Before
    public void setUp() {
        mockArguments = mockStatic(Arguments.class);
        mockArguments.when(Arguments::createMap).thenAnswer(invocation -> new JavaOnlyMap());
        mockArguments.when(Arguments::createArray).thenAnswer(invocation -> new JavaOnlyArray());
        mockUri = mockStatic(Uri.class);
        mockUri.when(() -> Uri.parse(anyString())).thenAnswer(invocation -> uri(invocation.getArgument(0)));
        mockUri.when(() -> Uri.fromFile(any(File.class)))
                .thenAnswer(invocation -> uri("file://" + invocation.<File>getArgument(0).getPath()));
    }

    @After
    public void tearDown() {
        mockArguments.close();
        mockUri.close();
    }

    /******** Report *********/

    @Test
    public void givenFullReport$populate_thenShouldSetEveryPart() throws IOException {
        CustomReportUtil.populate(builder, fixture("report.full.json"));

        verify(builder).setComment("Refund was for the wrong amount");
        verify(builder).setEmail("reporter@example.com");
        verify(builder).setCategory("checkout-refund");
        verify(builder).setScreenshot(ReportScreenshot.CURRENT_SCREEN);
        verify(builder).setAnswer("f_reason", "o_wrong_amount");
        verify(builder).setAnswer("f_items", "o_item_a", "o_item_b");
        verify(builder).setAnswer("f_details", "Charged twice on the same order");
        verify(builder).setConsent("c_share_logs", true);
        verify(builder).setConsent("c_contact_me", false);
        verify(builder).setExtendedField("repro_steps", "1. Pay 2. Request a refund");
        verify(builder).setExtendedField("actual_result", "Refund of 0.00");
        verify(builder).setExtendedField("expected_result", "Full refund");
        verify(builder).addAttachment(argThat(uri -> ("file://" + LOG_PATH).equals(uri.toString())));
        verify(builder).addAttachment(argThat(uri -> "content://media/external/images/media/42".equals(uri.toString())));
        verifyNoMoreInteractions(builder);
    }

    @Test
    public void givenEmptyReport$populate_thenShouldSetNothing() {
        CustomReportUtil.populate(builder, new JavaOnlyMap());

        verify(builder).setComment(null);
        verify(builder).setEmail(null);
        verify(builder).setCategory(null);
        verifyNoMoreInteractions(builder);
    }

    @Test
    public void givenAttachmentPathWithoutScheme$populate_thenShouldAddItAsFileUri() {
        CustomReportUtil.populate(builder, JavaOnlyMap.of("attachments", JavaOnlyArray.of(LOG_PATH)));

        verify(builder).addAttachment(argThat(uri -> ("file://" + LOG_PATH).equals(uri.toString())));
    }

    /******** Result *********/

    @Test
    public void givenQueued$toMap_thenShouldMatchFixture() throws IOException {
        assertEquals(fixture("result.queued.json"), CustomReportUtil.toMap(CustomReportResult.Queued.INSTANCE));
    }

    @Test
    public void givenNotSent$toMap_thenShouldMatchFixture() throws IOException {
        assertEquals(fixture("result.notSent.tryLater.json"),
                CustomReportUtil.toMap(new CustomReportResult.NotSent(NotSentReason.TRY_LATER)));
    }

    @Test
    public void givenEveryNotSentReason$toMap_thenShouldNameItInLowerCamel() {
        final String[] names = {"unavailable", "tryLater", "duplicate"};

        for (NotSentReason reason : NotSentReason.values()) {
            assertEquals(names[reason.ordinal()],
                    CustomReportUtil.toMap(new CustomReportResult.NotSent(reason)).getString("notSentReason"));
        }
    }

    @Test
    public void givenInvalid$toMap_thenShouldMatchFixture() throws IOException {
        assertEquals(fixture("result.invalid.json"), CustomReportUtil.toMap(invalidResult()));
    }

    @Test
    public void givenTurkishLocale$toMap_thenShouldNameEnumsTheSame() throws IOException {
        final Locale defaultLocale = Locale.getDefault();
        // In Turkish, "INVALID".toLowerCase() is "ınvalıd".
        Locale.setDefault(new Locale("tr", "TR"));
        try {
            assertEquals(fixture("result.invalid.json"), CustomReportUtil.toMap(invalidResult()));
        } finally {
            Locale.setDefault(defaultLocale);
        }
    }

    /******** Configuration *********/

    @Test
    public void givenFullConfiguration$toMap_thenShouldMatchFixture() throws IOException {
        final ReportConfigurationCategory refund = new ReportConfigurationCategory(
                "checkout-refund", "Refund", "Refund issues", Collections.emptyList(), Arrays.asList(
                new ReportConfigurationField("f_reason", ReportConfigurationField.Type.DROPDOWN, "Reason", "Pick one", true,
                        Arrays.asList(new ReportConfigurationField.Option("o_wrong_amount", "Wrong amount"),
                                new ReportConfigurationField.Option("o_not_received", "Not received"))),
                new ReportConfigurationField("f_items", ReportConfigurationField.Type.CHECKBOX, "Items", null, false,
                        Arrays.asList(new ReportConfigurationField.Option("o_item_a", "Item A"),
                                new ReportConfigurationField.Option("o_item_b", "Item B"))),
                new ReportConfigurationField("f_store", ReportConfigurationField.Type.SEARCH, "Store", "Search stores", false,
                        Collections.singletonList(new ReportConfigurationField.Option("o_store_1", "Store 1"))),
                new ReportConfigurationField("f_details", ReportConfigurationField.Type.TEXT, null, "Tell us more", false,
                        Collections.emptyList())));
        final ReportConfigurationCategory reportAProblem = category("report-a-problem", "Report a problem", "Something is broken",
                category("checkout", "Checkout", null, refund));
        final ReportRequirements requirements = new ReportRequirements(
                EmailRequirement.OPTIONAL, "identified@example.com", 2, 4000,
                Arrays.asList(new ReportConsent("c_share_logs", "Share logs", true, false),
                        new ReportConsent("c_contact_me", null, false, true)),
                Arrays.asList(new ReportExtendedField("repro_steps", "Steps to reproduce", true),
                        new ReportExtendedField("actual_result", "Actual result", false),
                        new ReportExtendedField("expected_result", "Expected result", false)),
                false, 3, 5242880L);

        assertEquals(fixture("configuration.full.json"), CustomReportUtil.toMap(new ReportConfiguration(
                BugReporting.ReportType.BUG, Arrays.asList(reportAProblem, category("other", "Other", null)), null, requirements)));
    }

    @Test
    public void givenScopedConfiguration$toMap_thenShouldMatchFixture() throws IOException {
        final ReportConfigurationCategory checkout = category("checkout", "Checkout", null,
                category("checkout-refund", "Refund", null));
        final ReportRequirements requirements = new ReportRequirements(
                EmailRequirement.HIDDEN, null, 0, 4000, Collections.emptyList(), Collections.emptyList(), true, 3, 5242880L);

        assertEquals(fixture("configuration.scoped.json"), CustomReportUtil.toMap(new ReportConfiguration(
                BugReporting.ReportType.FEEDBACK, Collections.singletonList(checkout),
                category("report-a-problem", "Report a problem", "Something is broken", checkout), requirements)));
    }

    /******** Helpers *********/

    private static Uri uri(String value) {
        final Uri uri = mock(Uri.class);
        when(uri.toString()).thenReturn(value);
        when(uri.getScheme()).thenReturn(value.contains("://") ? value.substring(0, value.indexOf("://")) : null);
        return uri;
    }

    private static CustomReportResult invalidResult() {
        return new CustomReportResult.Invalid(Arrays.asList(
                new FieldError(FieldError.Field.CATEGORY, null, FieldError.Problem.MISSING),
                new FieldError(FieldError.Field.ANSWER, "f_reason", FieldError.Problem.UNKNOWN),
                new FieldError(FieldError.Field.COMMENT, null, FieldError.Problem.TOO_SHORT),
                new FieldError(FieldError.Field.EMAIL, null, FieldError.Problem.INVALID),
                new FieldError(FieldError.Field.CONSENT, "c_share_logs", FieldError.Problem.MISSING),
                new FieldError(FieldError.Field.EXTENDED_FIELD, "repro_steps", FieldError.Problem.MISSING),
                new FieldError(FieldError.Field.SCREENSHOT, null, FieldError.Problem.INVALID),
                new FieldError(FieldError.Field.ATTACHMENT, "0", FieldError.Problem.TOO_LONG)));
    }

    private static ReportConfigurationCategory category(String identifier, String title, String description,
                                                        ReportConfigurationCategory... children) {
        return new ReportConfigurationCategory(identifier, title, description, Arrays.asList(children), Collections.emptyList());
    }

    /** A fixture shared with the Jest tests, as the map that crosses the bridge. */
    private static JavaOnlyMap fixture(String name) throws IOException {
        // Gradle runs unit tests from the module directory (android/).
        final byte[] json = Files.readAllBytes(Paths.get("..", "test", "fixtures", "customReport", name));
        return toMap(JsonParser.parseString(new String(json, StandardCharsets.UTF_8)).getAsJsonObject());
    }

    private static JavaOnlyMap toMap(JsonObject json) {
        final JavaOnlyMap map = new JavaOnlyMap();
        for (Map.Entry<String, JsonElement> entry : json.entrySet()) {
            final String key = entry.getKey();
            final JsonElement value = entry.getValue();
            if (value.isJsonObject()) {
                map.putMap(key, toMap(value.getAsJsonObject()));
            } else if (value.isJsonArray()) {
                map.putArray(key, toArray(value.getAsJsonArray()));
            } else if (value.isJsonNull()) {
                map.putNull(key);
            } else if (value.getAsJsonPrimitive().isBoolean()) {
                map.putBoolean(key, value.getAsBoolean());
            } else if (value.getAsJsonPrimitive().isNumber()) {
                map.putDouble(key, value.getAsDouble());
            } else {
                map.putString(key, value.getAsString());
            }
        }
        return map;
    }

    // Arrays in the fixtures only hold objects or strings.
    private static JavaOnlyArray toArray(JsonArray json) {
        final JavaOnlyArray array = new JavaOnlyArray();
        for (JsonElement value : json) {
            if (value.isJsonObject()) {
                array.pushMap(toMap(value.getAsJsonObject()));
            } else {
                array.pushString(value.getAsString());
            }
        }
        return array;
    }
}
