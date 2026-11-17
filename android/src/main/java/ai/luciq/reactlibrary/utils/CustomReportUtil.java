package ai.luciq.reactlibrary.utils;

import android.net.Uri;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.util.List;
import java.util.Locale;

import ai.luciq.bug.customreport.CustomReport;
import ai.luciq.bug.customreport.CustomReportResult;
import ai.luciq.bug.customreport.FieldError;
import ai.luciq.bug.customreport.ReportConfiguration;
import ai.luciq.bug.customreport.ReportConfigurationCategory;
import ai.luciq.bug.customreport.ReportConfigurationField;
import ai.luciq.bug.customreport.ReportConsent;
import ai.luciq.bug.customreport.ReportExtendedField;
import ai.luciq.bug.customreport.ReportRequirements;
import ai.luciq.bug.customreport.ReportScreenshot;

/**
 * Maps custom reports, their results and report configurations between the SDK types and
 * the JS shapes (src/models/CustomReport.ts, CustomReportResult.ts, ReportConfiguration.ts;
 * samples in test/fixtures/customReport). Enums cross the bridge by lower-camel name, as on iOS.
 */
public final class CustomReportUtil {

    private CustomReportUtil() {
    }

    /**
     * @param report the payload JS builds with toNativeCustomReport: types already checked, no null entries.
     */
    public static CustomReport toReport(int reportType, ReadableMap report) {
        final CustomReport.Builder builder = new CustomReport.Builder(reportType);
        populate(builder, report);
        return builder.build();
    }

    // Apart from toReport so tests can observe the builder; CustomReport exposes no getters.
    static void populate(CustomReport.Builder builder, ReadableMap report) {
        builder.setComment(report.getString("comment"));
        builder.setEmail(report.getString("email"));
        builder.setCategory(report.getString("categoryIdentifier"));
        if ("currentScreen".equals(report.getString("screenshot"))) {
            builder.setScreenshot(ReportScreenshot.CURRENT_SCREEN);
        }

        final ReadableMap answers = report.getMap("answers");
        if (answers != null) {
            final ReadableMapKeySetIterator keys = answers.keySetIterator();
            while (keys.hasNextKey()) {
                final String key = keys.nextKey();
                builder.setAnswer(key, ArrayUtil.parseReadableArrayOfStrings(answers.getArray(key)).toArray(new String[0]));
            }
        }

        final ReadableMap consents = report.getMap("consents");
        if (consents != null) {
            final ReadableMapKeySetIterator keys = consents.keySetIterator();
            while (keys.hasNextKey()) {
                final String key = keys.nextKey();
                builder.setConsent(key, consents.getBoolean(key));
            }
        }

        final ReadableMap extendedFields = report.getMap("extendedFields");
        if (extendedFields != null) {
            final ReadableMapKeySetIterator keys = extendedFields.keySetIterator();
            while (keys.hasNextKey()) {
                final String key = keys.nextKey();
                builder.setExtendedField(key, extendedFields.getString(key));
            }
        }

        final ReadableArray attachments = report.getArray("attachments");
        for (int i = 0; attachments != null && i < attachments.size(); i++) {
            final String attachment = attachments.getString(i);
            final Uri uri = Uri.parse(attachment);
            // A path without a scheme is a file path, as on iOS; the SDK only takes file:// and content://.
            builder.addAttachment(uri.getScheme() == null ? Uri.fromFile(new File(attachment)) : uri);
        }
    }

    /**
     * @return { status, notSentReason?, errors: [{ field, key, problem }] }
     */
    public static WritableMap toMap(CustomReportResult result) {
        final WritableMap map = Arguments.createMap();
        final WritableArray errors = Arguments.createArray();

        if (result instanceof CustomReportResult.Queued) {
            map.putString("status", "queued");
        } else if (result instanceof CustomReportResult.Invalid) {
            map.putString("status", "invalid");
            for (FieldError error : ((CustomReportResult.Invalid) result).getErrors()) {
                final WritableMap errorMap = Arguments.createMap();
                errorMap.putString("field", name(error.getField()));
                errorMap.putString("key", error.getKey());
                errorMap.putString("problem", name(error.getProblem()));
                errors.pushMap(errorMap);
            }
        } else {
            // Not sent, or a result type this bridge doesn't know (newer SDK).
            map.putString("status", "notSent");
            map.putString("notSentReason", result instanceof CustomReportResult.NotSent
                    ? name(((CustomReportResult.NotSent) result).getReason()) : "unavailable");
        }

        map.putArray("errors", errors);
        return map;
    }

    /**
     * @return { categories, preselectedCategory, requirements }; JS adds the report type it asked for.
     */
    public static WritableMap toMap(ReportConfiguration configuration) {
        final ReportConfigurationCategory preselected = configuration.getPreselectedCategory();
        final ReportRequirements requirements = configuration.getRequirements();

        final WritableArray consents = Arguments.createArray();
        for (ReportConsent consent : requirements.getConsents()) {
            final WritableMap consentMap = Arguments.createMap();
            consentMap.putString("key", consent.getKey());
            consentMap.putString("description", consent.getDescription());
            consentMap.putBoolean("mandatory", consent.getMandatory());
            consentMap.putBoolean("checkedByDefault", consent.getCheckedByDefault());
            consents.pushMap(consentMap);
        }

        final WritableArray extendedFields = Arguments.createArray();
        for (ReportExtendedField field : requirements.getExtendedFields()) {
            final WritableMap fieldMap = Arguments.createMap();
            fieldMap.putString("id", field.getId());
            fieldMap.putString("label", field.getLabel());
            fieldMap.putBoolean("required", field.getRequired());
            extendedFields.pushMap(fieldMap);
        }

        final WritableMap requirementsMap = Arguments.createMap();
        requirementsMap.putString("email", name(requirements.getEmail()));
        requirementsMap.putString("identifiedEmail", requirements.getIdentifiedEmail());
        requirementsMap.putInt("commentMinLength", requirements.getCommentMinLength());
        requirementsMap.putInt("commentMaxLength", requirements.getCommentMaxLength());
        requirementsMap.putArray("consents", consents);
        requirementsMap.putArray("extendedFields", extendedFields);
        requirementsMap.putBoolean("screenshotRequired", requirements.getScreenshotRequired());
        requirementsMap.putInt("maxAttachments", requirements.getMaxAttachments());
        requirementsMap.putDouble("maxAttachmentBytes", requirements.getMaxAttachmentBytes());

        final WritableMap map = Arguments.createMap();
        map.putArray("categories", toArray(configuration.getCategories()));
        map.putMap("preselectedCategory", preselected == null ? null : toMap(preselected));
        map.putMap("requirements", requirementsMap);
        return map;
    }

    private static WritableArray toArray(List<ReportConfigurationCategory> categories) {
        final WritableArray array = Arguments.createArray();
        for (ReportConfigurationCategory category : categories) {
            array.pushMap(toMap(category));
        }
        return array;
    }

    private static WritableMap toMap(ReportConfigurationCategory category) {
        final WritableArray fields = Arguments.createArray();
        for (ReportConfigurationField field : category.getFields()) {
            final WritableArray options = Arguments.createArray();
            for (ReportConfigurationField.Option option : field.getOptions()) {
                final WritableMap optionMap = Arguments.createMap();
                optionMap.putString("key", option.getKey());
                optionMap.putString("label", option.getLabel());
                options.pushMap(optionMap);
            }

            final WritableMap fieldMap = Arguments.createMap();
            fieldMap.putString("key", field.getKey());
            fieldMap.putString("type", name(field.getType()));
            fieldMap.putString("label", field.getLabel());
            fieldMap.putString("placeholder", field.getPlaceholder());
            fieldMap.putBoolean("required", field.getRequired());
            fieldMap.putArray("options", options);
            fields.pushMap(fieldMap);
        }

        final WritableMap map = Arguments.createMap();
        map.putString("identifier", category.getIdentifier());
        map.putString("title", category.getTitle());
        map.putString("description", category.getDescription());
        map.putBoolean("leaf", category.getChildren().isEmpty());
        map.putArray("children", toArray(category.getChildren()));
        map.putArray("fields", fields);
        return map;
    }

    /** TRY_LATER to tryLater. Locale.ROOT: the default locale can change letters (Turkish "I"). */
    private static String name(Enum<?> value) {
        final String[] words = value.name().toLowerCase(Locale.ROOT).split("_");
        final StringBuilder name = new StringBuilder(words[0]);
        for (int i = 1; i < words.length; i++) {
            name.append(Character.toUpperCase(words[i].charAt(0))).append(words[i].substring(1));
        }
        return name.toString();
    }
}
