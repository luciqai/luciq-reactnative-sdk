package ai.luciq.reactlibrary.utils;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import ai.luciq.bug.customreport.CustomReportResult;
import ai.luciq.bug.customreport.FieldError;
import ai.luciq.bug.customreport.NotSentReason;

/**
 * Serialises a {@link CustomReportResult} into the flat map the JS layer expects
 * (see {@code src/models/CustomReportResult.ts} and
 * {@code test/fixtures/customReport/result.*.json}):
 * <pre>
 * { status: 'queued' | 'notSent' | 'invalid', notSentReason?: string, errors: [{ field, key, problem }] }
 * </pre>
 * Enum values are lower-camel names, never ordinals.
 */
public final class CustomReportResultMapper {

    private CustomReportResultMapper() {
    }

    @NonNull
    public static WritableMap toWritableMap(@NonNull CustomReportResult result) {
        final WritableMap map = Arguments.createMap();
        final WritableArray errors = Arguments.createArray();

        if (result instanceof CustomReportResult.Queued) {
            map.putString("status", "queued");
        } else if (result instanceof CustomReportResult.NotSent) {
            map.putString("status", "notSent");
            map.putString("notSentReason", EnumNameUtil.toLowerCamel(((CustomReportResult.NotSent) result).getReason()));
        } else if (result instanceof CustomReportResult.Invalid) {
            map.putString("status", "invalid");
            for (FieldError error : ((CustomReportResult.Invalid) result).getErrors()) {
                errors.pushMap(toErrorMap(error));
            }
        } else {
            // A result type this bridge doesn't know (newer SDK): report it as not sent.
            map.putString("status", "notSent");
            map.putString("notSentReason", EnumNameUtil.toLowerCamel(NotSentReason.UNAVAILABLE));
        }

        map.putArray("errors", errors);
        return map;
    }

    /** The result resolved when the bridge itself fails after the report was handed to the SDK. */
    @NonNull
    public static WritableMap unavailable() {
        final WritableMap map = Arguments.createMap();
        map.putString("status", "notSent");
        map.putString("notSentReason", EnumNameUtil.toLowerCamel(NotSentReason.UNAVAILABLE));
        map.putArray("errors", Arguments.createArray());
        return map;
    }

    @NonNull
    private static WritableMap toErrorMap(@NonNull FieldError error) {
        final WritableMap map = Arguments.createMap();
        map.putString("field", EnumNameUtil.toLowerCamel(error.getField()));
        if (error.getKey() == null) {
            map.putNull("key");
        } else {
            map.putString("key", error.getKey());
        }
        map.putString("problem", EnumNameUtil.toLowerCamel(error.getProblem()));
        return map;
    }
}
