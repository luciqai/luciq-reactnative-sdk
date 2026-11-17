package ai.luciq.reactlibrary.utils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import ai.luciq.bug.BugReporting;
import ai.luciq.bug.customreport.ReportConfiguration;
import ai.luciq.bug.customreport.ReportConfigurationCategory;
import ai.luciq.bug.customreport.ReportConfigurationField;
import ai.luciq.bug.customreport.ReportConsent;
import ai.luciq.bug.customreport.ReportExtendedField;
import ai.luciq.bug.customreport.ReportRequirements;

/**
 * Serialises a {@link ReportConfiguration} into the map the JS layer expects
 * (see {@code src/models/ReportConfiguration.ts} and
 * {@code test/fixtures/customReport/configuration.*.json}).
 * <ul>
 * <li>{@code reportType} is the short name ({@code bug}, {@code feedback}, {@code question}).</li>
 * <li>Enums are lower-camel names ({@code extendedField}, {@code tooShort}).</li>
 * <li>{@code leaf} is derived as "no children" (iOS exposes it directly).</li>
 * <li>{@code maxAttachmentBytes} is a double (5,242,880 fits exactly).</li>
 * </ul>
 */
public final class ReportConfigurationMapper {

    private ReportConfigurationMapper() {
    }

    @NonNull
    public static String reportTypeName(int reportType) {
        switch (reportType) {
            case BugReporting.ReportType.BUG:
                return "bug";
            case BugReporting.ReportType.FEEDBACK:
                return "feedback";
            case BugReporting.ReportType.QUESTION:
                return "question";
            default:
                throw new IllegalArgumentException("Unknown report type " + reportType);
        }
    }

    @NonNull
    public static WritableMap toWritableMap(@NonNull ReportConfiguration configuration) {
        final WritableMap map = Arguments.createMap();
        map.putString("reportType", reportTypeName(configuration.getReportType()));
        map.putArray("categories", toCategoriesArray(configuration.getCategories()));

        final ReportConfigurationCategory preselected = configuration.getPreselectedCategory();
        if (preselected == null) {
            map.putNull("preselectedCategory");
        } else {
            map.putMap("preselectedCategory", toCategoryMap(preselected));
        }

        map.putMap("requirements", toRequirementsMap(configuration.getRequirements()));
        return map;
    }

    @NonNull
    private static WritableArray toCategoriesArray(@NonNull Iterable<ReportConfigurationCategory> categories) {
        final WritableArray array = Arguments.createArray();
        for (ReportConfigurationCategory category : categories) {
            array.pushMap(toCategoryMap(category));
        }
        return array;
    }

    @NonNull
    public static WritableMap toCategoryMap(@NonNull ReportConfigurationCategory category) {
        final WritableMap map = Arguments.createMap();
        map.putString("identifier", category.getIdentifier());
        map.putString("title", category.getTitle());
        putNullableString(map, "description", category.getDescription());
        map.putBoolean("leaf", category.getChildren().isEmpty());
        map.putArray("children", toCategoriesArray(category.getChildren()));

        final WritableArray fields = Arguments.createArray();
        for (ReportConfigurationField field : category.getFields()) {
            fields.pushMap(toFieldMap(field));
        }
        map.putArray("fields", fields);
        return map;
    }

    @NonNull
    private static WritableMap toFieldMap(@NonNull ReportConfigurationField field) {
        final WritableMap map = Arguments.createMap();
        map.putString("key", field.getKey());
        map.putString("type", EnumNameUtil.toLowerCamel(field.getType()));
        putNullableString(map, "label", field.getLabel());
        putNullableString(map, "placeholder", field.getPlaceholder());
        map.putBoolean("required", field.getRequired());

        final WritableArray options = Arguments.createArray();
        for (ReportConfigurationField.Option option : field.getOptions()) {
            final WritableMap optionMap = Arguments.createMap();
            optionMap.putString("key", option.getKey());
            optionMap.putString("label", option.getLabel());
            options.pushMap(optionMap);
        }
        map.putArray("options", options);
        return map;
    }

    @NonNull
    private static WritableMap toRequirementsMap(@NonNull ReportRequirements requirements) {
        final WritableMap map = Arguments.createMap();
        map.putString("email", EnumNameUtil.toLowerCamel(requirements.getEmail()));
        putNullableString(map, "identifiedEmail", requirements.getIdentifiedEmail());
        map.putInt("commentMinLength", requirements.getCommentMinLength());
        map.putInt("commentMaxLength", requirements.getCommentMaxLength());

        final WritableArray consents = Arguments.createArray();
        for (ReportConsent consent : requirements.getConsents()) {
            final WritableMap consentMap = Arguments.createMap();
            consentMap.putString("key", consent.getKey());
            putNullableString(consentMap, "description", consent.getDescription());
            consentMap.putBoolean("mandatory", consent.getMandatory());
            consentMap.putBoolean("checkedByDefault", consent.getCheckedByDefault());
            consents.pushMap(consentMap);
        }
        map.putArray("consents", consents);

        final WritableArray extendedFields = Arguments.createArray();
        for (ReportExtendedField field : requirements.getExtendedFields()) {
            final WritableMap fieldMap = Arguments.createMap();
            fieldMap.putString("id", field.getId());
            fieldMap.putString("label", field.getLabel());
            fieldMap.putBoolean("required", field.getRequired());
            extendedFields.pushMap(fieldMap);
        }
        map.putArray("extendedFields", extendedFields);

        map.putBoolean("screenshotRequired", requirements.getScreenshotRequired());
        map.putInt("maxAttachments", requirements.getMaxAttachments());
        map.putDouble("maxAttachmentBytes", (double) requirements.getMaxAttachmentBytes());
        return map;
    }

    private static void putNullableString(@NonNull WritableMap map, @NonNull String key, @Nullable String value) {
        if (value == null) {
            map.putNull(key);
        } else {
            map.putString(key, value);
        }
    }
}
