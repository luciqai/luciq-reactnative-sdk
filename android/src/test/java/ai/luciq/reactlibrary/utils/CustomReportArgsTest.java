package ai.luciq.reactlibrary.utils;

import android.net.Uri;

import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import ai.luciq.bug.customreport.CustomReport;
import ai.luciq.bug.customreport.ReportScreenshot;
import ai.luciq.reactlibrary.util.CustomReportFixtures;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;

public class CustomReportArgsTest {

    private CustomReport.Builder builder;
    private MockedStatic<Uri> mockUri;

    @Before
    public void setUp() {
        builder = mock(CustomReport.Builder.class);
        mockUri = mockStatic(Uri.class);
        mockUri.when(() -> Uri.parse(anyString())).thenAnswer(invocation -> {
            final Uri uri = mock(Uri.class);
            final String value = invocation.getArgument(0);
            org.mockito.Mockito.when(uri.toString()).thenReturn(value);
            return uri;
        });
    }

    @After
    public void tearDown() {
        mockUri.close();
    }

    @Test
    public void fullReport_appliesEveryField() throws Exception {
        final JavaOnlyMap report = CustomReportFixtures.toReadableMap(CustomReportFixtures.read("report.full.json"));

        CustomReportArgs.populate(builder, report);

        verify(builder).setComment("Refund was for the wrong amount");
        verify(builder).setEmail("reporter@example.com");
        verify(builder).setCategory("checkout-refund");
        verify(builder).setAnswer("f_reason", "o_wrong_amount");
        verify(builder).setAnswer("f_items", "o_item_a", "o_item_b");
        verify(builder).setAnswer("f_details", "Charged twice on the same order");
        verify(builder).setConsent("c_share_logs", true);
        verify(builder).setConsent("c_contact_me", false);
        verify(builder).setExtendedField("repro_steps", "1. Pay 2. Request a refund");
        verify(builder).setExtendedField("actual_result", "Refund of 0.00");
        verify(builder).setExtendedField("expected_result", "Full refund");
        verify(builder).setScreenshot(ReportScreenshot.CURRENT_SCREEN);
        verify(builder).addAttachment(org.mockito.ArgumentMatchers.argThat(
                uri -> "file:///data/user/0/com.example/files/report.log".equals(uri.toString())));
        verify(builder).addAttachment(org.mockito.ArgumentMatchers.argThat(
                uri -> "content://media/external/images/media/42".equals(uri.toString())));
        verifyNoMoreInteractions(builder);
    }

    @Test
    public void minimalReport_onlySetsTheScreenshot() throws Exception {
        final JavaOnlyMap report = CustomReportFixtures.toReadableMap(CustomReportFixtures.read("report.minimal.json"));

        CustomReportArgs.populate(builder, report);

        verify(builder).setScreenshot(ReportScreenshot.NONE);
        verifyNoMoreInteractions(builder);
    }

    @Test
    public void nullReport_touchesNothing() {
        CustomReportArgs.populate(builder, null);

        verifyNoInteractions(builder);
    }

    @Test
    public void explicitNulls_areSkippedExceptForClearingAnswersAndExtendedFields() {
        final JavaOnlyMap answers = new JavaOnlyMap();
        answers.putNull("f_reason");
        answers.putArray("f_items", new JavaOnlyArray());
        final JavaOnlyMap extendedFields = new JavaOnlyMap();
        extendedFields.putNull("repro_steps");
        final JavaOnlyMap report = new JavaOnlyMap();
        report.putNull("comment");
        report.putNull("email");
        report.putMap("answers", answers);
        report.putMap("extendedFields", extendedFields);

        CustomReportArgs.populate(builder, report);

        verify(builder, never()).setComment(anyString());
        verify(builder, never()).setEmail(anyString());
        verify(builder).setAnswer("f_reason");
        verify(builder).setAnswer("f_items");
        verify(builder).setExtendedField("repro_steps", null);
        verifyNoMoreInteractions(builder);
    }

    @Test(expected = IllegalArgumentException.class)
    public void unknownScreenshot_isRejected() {
        CustomReportArgs.populate(builder, JavaOnlyMap.of("screenshot", "fromGallery"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void commentOfWrongType_isRejected() {
        CustomReportArgs.populate(builder, JavaOnlyMap.of("comment", 42));
    }

    @Test(expected = IllegalArgumentException.class)
    public void answersNotAnObject_isRejected() {
        CustomReportArgs.populate(builder, JavaOnlyMap.of("answers", "o_wrong_amount"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void answerValuesNotAnArray_isRejected() {
        CustomReportArgs.populate(builder, JavaOnlyMap.of("answers", JavaOnlyMap.of("f_reason", "o_wrong_amount")));
    }

    @Test(expected = IllegalArgumentException.class)
    public void answerValueNotAString_isRejected() {
        CustomReportArgs.populate(builder,
                JavaOnlyMap.of("answers", JavaOnlyMap.of("f_reason", JavaOnlyArray.of(1))));
    }

    @Test(expected = IllegalArgumentException.class)
    public void consentNotABoolean_isRejected() {
        CustomReportArgs.populate(builder, JavaOnlyMap.of("consents", JavaOnlyMap.of("c_share_logs", "yes")));
    }

    @Test(expected = IllegalArgumentException.class)
    public void extendedFieldNotAString_isRejected() {
        CustomReportArgs.populate(builder, JavaOnlyMap.of("extendedFields", JavaOnlyMap.of("repro_steps", true)));
    }

    @Test(expected = IllegalArgumentException.class)
    public void attachmentNotAString_isRejected() {
        CustomReportArgs.populate(builder, JavaOnlyMap.of("attachments", JavaOnlyArray.of(1)));
    }
}
