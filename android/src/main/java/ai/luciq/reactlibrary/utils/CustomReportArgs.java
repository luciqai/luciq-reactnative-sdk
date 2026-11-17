package ai.luciq.reactlibrary.utils;

import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;

import java.util.ArrayList;

import ai.luciq.bug.customreport.CustomReport;
import ai.luciq.bug.customreport.ReportScreenshot;

/**
 * Translates the report map sent by the JS layer (see {@code src/models/CustomReport.ts}
 * and {@code test/fixtures/customReport/report.*.json}) into a {@link CustomReport}
 * through its {@link CustomReport.Builder}.
 * <p>
 * Only the shape is checked here: a value of the wrong type throws
 * {@link IllegalArgumentException}, which the module turns into a Promise
 * rejection with code {@code LCQ_INVALID_ARGUMENT}. Limits, unknown keys and
 * attachment path rules are validated by the SDK and reported in the result.
 */
public final class CustomReportArgs {

    private static final String KEY_COMMENT = "comment";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_CATEGORY = "categoryIdentifier";
    private static final String KEY_ANSWERS = "answers";
    private static final String KEY_CONSENTS = "consents";
    private static final String KEY_EXTENDED_FIELDS = "extendedFields";
    private static final String KEY_SCREENSHOT = "screenshot";
    private static final String KEY_ATTACHMENTS = "attachments";

    private static final String SCREENSHOT_NONE = "none";
    private static final String SCREENSHOT_CURRENT_SCREEN = "currentScreen";

    private CustomReportArgs() {
    }

    /**
     * @param reportType one of {@link ai.luciq.bug.BugReporting.ReportType}, already resolved by the module.
     * @param report     the map from JS; {@code null} means a report with only a type.
     * @throws IllegalArgumentException when a value has the wrong type.
     */
    @NonNull
    public static CustomReport build(int reportType, @Nullable ReadableMap report) {
        final CustomReport.Builder builder = new CustomReport.Builder(reportType);
        populate(builder, report);
        return builder.build();
    }

    /**
     * Applies every entry of {@code report} to {@code builder}. Split from
     * {@link #build(int, ReadableMap)} so tests can observe the builder calls
     * ({@link CustomReport} exposes no getters).
     */
    public static void populate(@NonNull CustomReport.Builder builder, @Nullable ReadableMap report) {
        if (report == null) {
            return;
        }

        if (hasValue(report, KEY_COMMENT)) {
            builder.setComment(requireString(report, KEY_COMMENT));
        }
        if (hasValue(report, KEY_EMAIL)) {
            builder.setEmail(requireString(report, KEY_EMAIL));
        }
        if (hasValue(report, KEY_CATEGORY)) {
            builder.setCategory(requireString(report, KEY_CATEGORY));
        }
        if (hasValue(report, KEY_ANSWERS)) {
            applyAnswers(builder, requireMap(report, KEY_ANSWERS));
        }
        if (hasValue(report, KEY_CONSENTS)) {
            applyConsents(builder, requireMap(report, KEY_CONSENTS));
        }
        if (hasValue(report, KEY_EXTENDED_FIELDS)) {
            applyExtendedFields(builder, requireMap(report, KEY_EXTENDED_FIELDS));
        }
        if (hasValue(report, KEY_SCREENSHOT)) {
            builder.setScreenshot(parseScreenshot(requireString(report, KEY_SCREENSHOT)));
        }
        if (hasValue(report, KEY_ATTACHMENTS)) {
            applyAttachments(builder, requireArray(report, KEY_ATTACHMENTS));
        }
    }

    private static void applyAnswers(@NonNull CustomReport.Builder builder, @NonNull ReadableMap answers) {
        final ReadableMapKeySetIterator iterator = answers.keySetIterator();
        while (iterator.hasNextKey()) {
            final String fieldKey = iterator.nextKey();
            final ReadableType type = answers.getType(fieldKey);
            if (type == ReadableType.Null) {
                builder.setAnswer(fieldKey);
                continue;
            }
            if (type != ReadableType.Array) {
                throw new IllegalArgumentException("answers." + fieldKey + " must be an array of strings");
            }
            final ReadableArray values = answers.getArray(fieldKey);
            final String[] parsed = new String[values == null ? 0 : values.size()];
            for (int i = 0; i < parsed.length; i++) {
                if (values.getType(i) != ReadableType.String) {
                    throw new IllegalArgumentException("answers." + fieldKey + "[" + i + "] must be a string");
                }
                parsed[i] = values.getString(i);
            }
            builder.setAnswer(fieldKey, parsed);
        }
    }

    private static void applyConsents(@NonNull CustomReport.Builder builder, @NonNull ReadableMap consents) {
        final ReadableMapKeySetIterator iterator = consents.keySetIterator();
        while (iterator.hasNextKey()) {
            final String key = iterator.nextKey();
            if (consents.getType(key) != ReadableType.Boolean) {
                throw new IllegalArgumentException("consents." + key + " must be a boolean");
            }
            builder.setConsent(key, consents.getBoolean(key));
        }
    }

    private static void applyExtendedFields(@NonNull CustomReport.Builder builder, @NonNull ReadableMap fields) {
        final ReadableMapKeySetIterator iterator = fields.keySetIterator();
        while (iterator.hasNextKey()) {
            final String id = iterator.nextKey();
            final ReadableType type = fields.getType(id);
            if (type == ReadableType.Null) {
                builder.setExtendedField(id, null);
            } else if (type == ReadableType.String) {
                builder.setExtendedField(id, fields.getString(id));
            } else {
                throw new IllegalArgumentException("extendedFields." + id + " must be a string or null");
            }
        }
    }

    private static void applyAttachments(@NonNull CustomReport.Builder builder, @NonNull ReadableArray attachments) {
        final ArrayList<String> uris = new ArrayList<>();
        for (int i = 0; i < attachments.size(); i++) {
            if (attachments.getType(i) != ReadableType.String) {
                throw new IllegalArgumentException("attachments[" + i + "] must be a URI string");
            }
            uris.add(attachments.getString(i));
        }
        for (String uri : uris) {
            // Path and size rules are enforced by the SDK (content:// or file:// inside the app's storage).
            builder.addAttachment(Uri.parse(uri));
        }
    }

    @NonNull
    private static ReportScreenshot parseScreenshot(@NonNull String value) {
        switch (value) {
            case SCREENSHOT_NONE:
                return ReportScreenshot.NONE;
            case SCREENSHOT_CURRENT_SCREEN:
                return ReportScreenshot.CURRENT_SCREEN;
            default:
                throw new IllegalArgumentException("screenshot must be 'none' or 'currentScreen', got '" + value + "'");
        }
    }

    private static boolean hasValue(@NonNull ReadableMap map, @NonNull String key) {
        return map.hasKey(key) && !map.isNull(key);
    }

    @NonNull
    private static String requireString(@NonNull ReadableMap map, @NonNull String key) {
        if (map.getType(key) != ReadableType.String) {
            throw new IllegalArgumentException(key + " must be a string");
        }
        final String value = map.getString(key);
        return value == null ? "" : value;
    }

    @NonNull
    private static ReadableMap requireMap(@NonNull ReadableMap map, @NonNull String key) {
        if (map.getType(key) != ReadableType.Map) {
            throw new IllegalArgumentException(key + " must be an object");
        }
        final ReadableMap value = map.getMap(key);
        if (value == null) {
            throw new IllegalArgumentException(key + " must be an object");
        }
        return value;
    }

    @NonNull
    private static ReadableArray requireArray(@NonNull ReadableMap map, @NonNull String key) {
        if (map.getType(key) != ReadableType.Array) {
            throw new IllegalArgumentException(key + " must be an array");
        }
        final ReadableArray value = map.getArray(key);
        if (value == null) {
            throw new IllegalArgumentException(key + " must be an array");
        }
        return value;
    }
}
