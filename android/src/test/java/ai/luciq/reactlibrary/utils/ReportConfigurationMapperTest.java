package ai.luciq.reactlibrary.utils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import java.util.Arrays;
import java.util.Collections;

import ai.luciq.bug.BugReporting;
import ai.luciq.bug.customreport.EmailRequirement;
import ai.luciq.bug.customreport.ReportConfiguration;
import ai.luciq.bug.customreport.ReportConfigurationCategory;
import ai.luciq.bug.customreport.ReportConfigurationField;
import ai.luciq.bug.customreport.ReportConsent;
import ai.luciq.bug.customreport.ReportExtendedField;
import ai.luciq.bug.customreport.ReportRequirements;
import ai.luciq.reactlibrary.util.CustomReportFixtures;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mockStatic;

public class ReportConfigurationMapperTest {

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

    /** The tree of configuration.full.json: report-a-problem > checkout > checkout-refund (4 fields), plus "other". */
    private static ReportConfigurationCategory reportAProblem() {
        final ReportConfigurationField reason = new ReportConfigurationField(
                "f_reason", ReportConfigurationField.Type.DROPDOWN, "Reason", "Pick one", true,
                Arrays.asList(new ReportConfigurationField.Option("o_wrong_amount", "Wrong amount"),
                        new ReportConfigurationField.Option("o_not_received", "Not received")));
        final ReportConfigurationField items = new ReportConfigurationField(
                "f_items", ReportConfigurationField.Type.CHECKBOX, "Items", null, false,
                Arrays.asList(new ReportConfigurationField.Option("o_item_a", "Item A"),
                        new ReportConfigurationField.Option("o_item_b", "Item B")));
        final ReportConfigurationField store = new ReportConfigurationField(
                "f_store", ReportConfigurationField.Type.SEARCH, "Store", "Search stores", false,
                Collections.singletonList(new ReportConfigurationField.Option("o_store_1", "Store 1")));
        final ReportConfigurationField details = new ReportConfigurationField(
                "f_details", ReportConfigurationField.Type.TEXT, null, "Tell us more", false,
                Collections.emptyList());
        final ReportConfigurationCategory refund = new ReportConfigurationCategory(
                "checkout-refund", "Refund", "Refund issues", Collections.emptyList(),
                Arrays.asList(reason, items, store, details));
        final ReportConfigurationCategory checkout = new ReportConfigurationCategory(
                "checkout", "Checkout", null, Collections.singletonList(refund), Collections.emptyList());
        return new ReportConfigurationCategory(
                "report-a-problem", "Report a problem", "Something is broken",
                Collections.singletonList(checkout), Collections.emptyList());
    }

    @Test
    public void fullConfiguration_matchesFixture() {
        final ReportConfigurationCategory other = new ReportConfigurationCategory(
                "other", "Other", null, Collections.emptyList(), Collections.emptyList());
        final ReportRequirements requirements = new ReportRequirements(
                EmailRequirement.OPTIONAL, "identified@example.com", 2, 4000,
                Arrays.asList(new ReportConsent("c_share_logs", "Share logs", true, false),
                        new ReportConsent("c_contact_me", null, false, true)),
                Arrays.asList(new ReportExtendedField("repro_steps", "Steps to reproduce", true),
                        new ReportExtendedField("actual_result", "Actual result", false),
                        new ReportExtendedField("expected_result", "Expected result", false)),
                false, 3, 5242880L);
        final ReportConfiguration configuration = new ReportConfiguration(
                BugReporting.ReportType.BUG, Arrays.asList(reportAProblem(), other), null, requirements);

        final ReadableMap map = ReportConfigurationMapper.toWritableMap(configuration);

        CustomReportFixtures.assertMatchesFixture("configuration.full.json", map);
    }

    @Test
    public void scopedConfiguration_matchesFixture_withPreselectedParent() {
        final ReportConfigurationCategory refund = new ReportConfigurationCategory(
                "checkout-refund", "Refund", null, Collections.emptyList(), Collections.emptyList());
        final ReportConfigurationCategory checkout = new ReportConfigurationCategory(
                "checkout", "Checkout", null, Collections.singletonList(refund), Collections.emptyList());
        final ReportConfigurationCategory parent = new ReportConfigurationCategory(
                "report-a-problem", "Report a problem", "Something is broken",
                Collections.singletonList(checkout), Collections.emptyList());
        final ReportRequirements requirements = new ReportRequirements(
                EmailRequirement.HIDDEN, null, 0, 4000, Collections.emptyList(), Collections.emptyList(),
                true, 3, 5242880L);
        final ReportConfiguration configuration = new ReportConfiguration(
                BugReporting.ReportType.FEEDBACK, Collections.singletonList(checkout), parent, requirements);

        final ReadableMap map = ReportConfigurationMapper.toWritableMap(configuration);

        CustomReportFixtures.assertMatchesFixture("configuration.scoped.json", map);
    }

    @Test
    public void leaf_isDerivedFromChildren() {
        final ReportConfigurationCategory leaf = new ReportConfigurationCategory(
                "leaf", "Leaf", null, Collections.emptyList(), Collections.emptyList());
        final ReportConfigurationCategory parent = new ReportConfigurationCategory(
                "parent", "Parent", null, Collections.singletonList(leaf), Collections.emptyList());

        final ReadableMap parentMap = ReportConfigurationMapper.toCategoryMap(parent);

        assertFalse(parentMap.getBoolean("leaf"));
        assertTrue(parentMap.getArray("children").getMap(0).getBoolean("leaf"));
    }

    @Test
    public void reportTypeName_coversEveryReportType() {
        assertEquals("bug", ReportConfigurationMapper.reportTypeName(BugReporting.ReportType.BUG));
        assertEquals("feedback", ReportConfigurationMapper.reportTypeName(BugReporting.ReportType.FEEDBACK));
        assertEquals("question", ReportConfigurationMapper.reportTypeName(BugReporting.ReportType.QUESTION));
    }

    @Test(expected = IllegalArgumentException.class)
    public void reportTypeName_rejectsUnknownType() {
        ReportConfigurationMapper.reportTypeName(42);
    }
}
