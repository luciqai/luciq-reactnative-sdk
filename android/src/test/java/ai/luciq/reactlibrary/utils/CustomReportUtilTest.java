package ai.luciq.reactlibrary.utils;

import android.net.Uri;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

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
    private static final String IMAGE_URI = "content://media/external/images/media/42";

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
    public void givenFullReport$populate_thenShouldSetEveryPart() {
        final JavaOnlyMap report = JavaOnlyMap.of(
                "comment", "Refund was for the wrong amount",
                "email", "reporter@example.com",
                "categoryIdentifier", "checkout-refund",
                "answers", JavaOnlyMap.of(
                        "f_reason", JavaOnlyArray.of("o_wrong_amount"),
                        "f_items", JavaOnlyArray.of("o_item_a", "o_item_b")),
                "consents", JavaOnlyMap.of("c_share_logs", true, "c_contact_me", false),
                "extendedFields", JavaOnlyMap.of("repro_steps", "1. Pay 2. Request a refund"),
                "screenshot", "currentScreen",
                "attachments", JavaOnlyArray.of("file://" + LOG_PATH, IMAGE_URI));

        CustomReportUtil.populate(builder, report);

        verify(builder).setComment("Refund was for the wrong amount");
        verify(builder).setEmail("reporter@example.com");
        verify(builder).setCategory("checkout-refund");
        verify(builder).setScreenshot(ReportScreenshot.CURRENT_SCREEN);
        verify(builder).setAnswer("f_reason", "o_wrong_amount");
        verify(builder).setAnswer("f_items", "o_item_a", "o_item_b");
        verify(builder).setConsent("c_share_logs", true);
        verify(builder).setConsent("c_contact_me", false);
        verify(builder).setExtendedField("repro_steps", "1. Pay 2. Request a refund");
        verify(builder).addAttachment(argThat(uri -> ("file://" + LOG_PATH).equals(uri.toString())));
        verify(builder).addAttachment(argThat(uri -> IMAGE_URI.equals(uri.toString())));
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
    public void givenQueued$toMap_thenShouldMapStatus() {
        assertEquals(JavaOnlyMap.of("status", "queued", "errors", new JavaOnlyArray()),
                CustomReportUtil.toMap(CustomReportResult.Queued.INSTANCE));
    }

    @Test
    public void givenEveryNotSentReason$toMap_thenShouldNameItInLowerCamel() {
        final String[] reasons = {"unavailable", "tryLater", "duplicate"};

        for (NotSentReason reason : NotSentReason.values()) {
            assertEquals(JavaOnlyMap.of("status", "notSent", "notSentReason", reasons[reason.ordinal()], "errors", new JavaOnlyArray()),
                    CustomReportUtil.toMap(new CustomReportResult.NotSent(reason)));
        }
    }

    @Test
    public void givenEveryFieldAndProblem$toMap_thenShouldListTheErrorsByLowerCamelName() {
        final String[] fields = {"category", "answer", "comment", "email", "consent", "extendedField", "screenshot", "attachment"};
        final String[] problems = {"missing", "unknown", "invalid", "tooShort", "tooLong"};
        final List<FieldError> errors = new ArrayList<>();
        final JavaOnlyArray expected = new JavaOnlyArray();
        for (FieldError.Field field : FieldError.Field.values()) {
            for (FieldError.Problem problem : FieldError.Problem.values()) {
                final String key = field == FieldError.Field.ANSWER ? "f_reason" : null;
                errors.add(new FieldError(field, key, problem));
                expected.pushMap(JavaOnlyMap.of("field", fields[field.ordinal()], "key", key, "problem", problems[problem.ordinal()]));
            }
        }

        assertEquals(JavaOnlyMap.of("status", "invalid", "errors", expected),
                CustomReportUtil.toMap(new CustomReportResult.Invalid(errors)));
    }

    @Test
    public void givenTurkishLocale$toMap_thenShouldNameEnumsTheSame() {
        final Locale defaultLocale = Locale.getDefault();
        // In Turkish, lowercasing "I" gives a dotless i, so "INVALID" would not become "invalid".
        Locale.setDefault(new Locale("tr", "TR"));
        try {
            final ReadableMap error = CustomReportUtil.toMap(new CustomReportResult.Invalid(Collections.singletonList(
                    new FieldError(FieldError.Field.EMAIL, null, FieldError.Problem.INVALID)))).getArray("errors").getMap(0);

            assertEquals("email", error.getString("field"));
            assertEquals("invalid", error.getString("problem"));
        } finally {
            Locale.setDefault(defaultLocale);
        }
    }

    /******** Configuration *********/

    @Test
    public void givenConfiguration$toMap_thenShouldMapCategoriesFieldsAndRequirements() {
        final ReportConfigurationCategory refund = new ReportConfigurationCategory(
                "checkout-refund", "Refund", "Refund issues", Collections.emptyList(), Arrays.asList(
                new ReportConfigurationField("f_reason", ReportConfigurationField.Type.DROPDOWN, "Reason", "Pick one", true,
                        Arrays.asList(new ReportConfigurationField.Option("o_wrong_amount", "Wrong amount"),
                                new ReportConfigurationField.Option("o_not_received", "Not received"))),
                new ReportConfigurationField("f_items", ReportConfigurationField.Type.CHECKBOX, "Items", null, false,
                        Collections.singletonList(new ReportConfigurationField.Option("o_item_a", "Item A"))),
                new ReportConfigurationField("f_store", ReportConfigurationField.Type.SEARCH, "Store", "Search stores", false,
                        Collections.singletonList(new ReportConfigurationField.Option("o_store_1", "Store 1"))),
                new ReportConfigurationField("f_details", ReportConfigurationField.Type.TEXT, null, "Tell us more", false,
                        Collections.emptyList())));
        final ReportConfigurationCategory checkout = new ReportConfigurationCategory(
                "checkout", "Checkout", null, Collections.singletonList(refund), Collections.emptyList());
        final ReportRequirements requirements = new ReportRequirements(
                EmailRequirement.OPTIONAL, "identified@example.com", 2, 4000,
                Arrays.asList(new ReportConsent("c_share_logs", "Share logs", true, false),
                        new ReportConsent("c_contact_me", null, false, true)),
                Collections.singletonList(new ReportExtendedField("repro_steps", "Steps to reproduce", true)),
                true, 3, 5242880L);

        final ReadableMap map = CustomReportUtil.toMap(new ReportConfiguration(
                BugReporting.ReportType.BUG, Collections.singletonList(checkout), null, requirements));

        final JavaOnlyMap expectedRefund = JavaOnlyMap.of(
                "identifier", "checkout-refund", "title", "Refund", "description", "Refund issues", "leaf", true,
                "children", new JavaOnlyArray(),
                "fields", JavaOnlyArray.of(
                        JavaOnlyMap.of("key", "f_reason", "type", "dropdown", "label", "Reason", "placeholder", "Pick one",
                                "required", true, "options", JavaOnlyArray.of(
                                        JavaOnlyMap.of("key", "o_wrong_amount", "label", "Wrong amount"),
                                        JavaOnlyMap.of("key", "o_not_received", "label", "Not received"))),
                        JavaOnlyMap.of("key", "f_items", "type", "checkbox", "label", "Items", "placeholder", null,
                                "required", false, "options", JavaOnlyArray.of(JavaOnlyMap.of("key", "o_item_a", "label", "Item A"))),
                        JavaOnlyMap.of("key", "f_store", "type", "search", "label", "Store", "placeholder", "Search stores",
                                "required", false, "options", JavaOnlyArray.of(JavaOnlyMap.of("key", "o_store_1", "label", "Store 1"))),
                        JavaOnlyMap.of("key", "f_details", "type", "text", "label", null, "placeholder", "Tell us more",
                                "required", false, "options", new JavaOnlyArray())));
        final JavaOnlyMap expectedCheckout = JavaOnlyMap.of(
                "identifier", "checkout", "title", "Checkout", "description", null, "leaf", false,
                "children", JavaOnlyArray.of(expectedRefund), "fields", new JavaOnlyArray());
        final JavaOnlyMap expectedRequirements = JavaOnlyMap.of(
                "email", "optional", "identifiedEmail", "identified@example.com",
                "commentMinLength", 2, "commentMaxLength", 4000,
                "consents", JavaOnlyArray.of(
                        JavaOnlyMap.of("key", "c_share_logs", "description", "Share logs", "mandatory", true, "checkedByDefault", false),
                        JavaOnlyMap.of("key", "c_contact_me", "description", null, "mandatory", false, "checkedByDefault", true)),
                "extendedFields", JavaOnlyArray.of(
                        JavaOnlyMap.of("id", "repro_steps", "label", "Steps to reproduce", "required", true)),
                "screenshotRequired", true, "maxAttachments", 3, "maxAttachmentBytes", 5242880);
        assertEquals(JavaOnlyMap.of("categories", JavaOnlyArray.of(expectedCheckout), "preselectedCategory", null,
                "requirements", expectedRequirements), map);
    }

    @Test
    public void givenPreselectedCategory$toMap_thenShouldMapIt() {
        final ReportConfigurationCategory other = new ReportConfigurationCategory(
                "other", "Other", null, Collections.emptyList(), Collections.emptyList());

        final ReadableMap map = CustomReportUtil.toMap(new ReportConfiguration(
                BugReporting.ReportType.FEEDBACK, Collections.singletonList(other), other, requirements(EmailRequirement.HIDDEN)));

        assertEquals(JavaOnlyMap.of("identifier", "other", "title", "Other", "description", null, "leaf", true,
                "children", new JavaOnlyArray(), "fields", new JavaOnlyArray()), map.getMap("preselectedCategory"));
    }

    @Test
    public void givenEveryEmailRequirement$toMap_thenShouldNameItInLowerCamel() {
        final String[] names = {"hidden", "optional", "required"};

        for (EmailRequirement email : EmailRequirement.values()) {
            final ReadableMap map = CustomReportUtil.toMap(new ReportConfiguration(
                    BugReporting.ReportType.BUG, Collections.emptyList(), null, requirements(email)));

            assertEquals(names[email.ordinal()], map.getMap("requirements").getString("email"));
        }
    }

    /******** Helpers *********/

    private static Uri uri(String value) {
        final Uri uri = mock(Uri.class);
        when(uri.toString()).thenReturn(value);
        when(uri.getScheme()).thenReturn(value.contains("://") ? value.substring(0, value.indexOf("://")) : null);
        return uri;
    }

    private static ReportRequirements requirements(EmailRequirement email) {
        return new ReportRequirements(email, null, 0, 4000, Collections.emptyList(), Collections.emptyList(), false, 3, 5242880L);
    }
}
