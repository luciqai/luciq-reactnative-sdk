package ai.luciq.reactlibrary.utils;

import androidx.annotation.NonNull;

/**
 * Converts native enum constant names to the lower-camel names the React Native
 * layer uses on both platforms ({@code TRY_LATER} to {@code tryLater}).
 * <p>
 * Enum values never cross the bridge as ordinals: the Android and iOS ordinals
 * of the custom report enums differ, so the name is the only stable key.
 */
public final class EnumNameUtil {

    private EnumNameUtil() {
    }

    /**
     * @param enumName an {@code UPPER_SNAKE_CASE} enum constant name.
     * @return the {@code lowerCamelCase} form.
     */
    @NonNull
    public static String toLowerCamel(@NonNull String enumName) {
        final String[] parts = enumName.toLowerCase().split("_");
        final StringBuilder builder = new StringBuilder(parts[0]);
        for (int i = 1; i < parts.length; i++) {
            if (parts[i].isEmpty()) {
                continue;
            }
            builder.append(Character.toUpperCase(parts[i].charAt(0)));
            builder.append(parts[i].substring(1));
        }
        return builder.toString();
    }

    @NonNull
    public static String toLowerCamel(@NonNull Enum<?> value) {
        return toLowerCamel(value.name());
    }
}
