package ai.luciq.reactlibrary.util;

import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Map;

import static org.junit.Assert.assertEquals;

/**
 * Reads the cross-platform bridge fixtures under {@code test/fixtures/customReport}
 * (the repository root, found by walking up from the Gradle project directory)
 * and converts between JSON and the React Native {@code JavaOnly*} bridge types.
 * <p>
 * Gson is used rather than {@code org.json} because the mockable {@code android.jar}
 * shadows {@code org.json} on the unit-test classpath.
 */
public final class CustomReportFixtures {

    private static final String FIXTURES_DIR = "test/fixtures/customReport";

    private CustomReportFixtures() {
    }

    public static JsonObject read(String name) {
        File dir = new File(System.getProperty("user.dir")).getAbsoluteFile();
        for (int i = 0; i < 8 && dir != null; i++) {
            final File candidate = new File(dir, FIXTURES_DIR + "/" + name);
            if (candidate.isFile()) {
                try {
                    final String content = new String(Files.readAllBytes(candidate.toPath()), StandardCharsets.UTF_8);
                    return JsonParser.parseString(content).getAsJsonObject();
                } catch (IOException e) {
                    throw new IllegalStateException("Could not read fixture " + candidate, e);
                }
            }
            dir = dir.getParentFile();
        }
        throw new IllegalStateException("Fixture " + name + " not found under " + FIXTURES_DIR
                + " walking up from " + System.getProperty("user.dir"));
    }

    /** Builds the {@link ReadableMap} JS would send for a JSON fixture (nulls kept as Null entries). */
    public static JavaOnlyMap toReadableMap(JsonObject json) {
        final JavaOnlyMap map = new JavaOnlyMap();
        for (Map.Entry<String, JsonElement> entry : json.entrySet()) {
            final String key = entry.getKey();
            final JsonElement value = entry.getValue();
            if (value == null || value.isJsonNull()) {
                map.putNull(key);
            } else if (value.isJsonObject()) {
                map.putMap(key, toReadableMap(value.getAsJsonObject()));
            } else if (value.isJsonArray()) {
                map.putArray(key, toReadableArray(value.getAsJsonArray()));
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

    public static JavaOnlyArray toReadableArray(JsonArray json) {
        final JavaOnlyArray array = new JavaOnlyArray();
        for (JsonElement value : json) {
            if (value == null || value.isJsonNull()) {
                array.pushNull();
            } else if (value.isJsonObject()) {
                array.pushMap(toReadableMap(value.getAsJsonObject()));
            } else if (value.isJsonArray()) {
                array.pushArray(toReadableArray(value.getAsJsonArray()));
            } else if (value.getAsJsonPrimitive().isBoolean()) {
                array.pushBoolean(value.getAsBoolean());
            } else if (value.getAsJsonPrimitive().isNumber()) {
                array.pushDouble(value.getAsDouble());
            } else {
                array.pushString(value.getAsString());
            }
        }
        return array;
    }

    /** Converts what a mapper produced into JSON, keeping explicit nulls, so it can be compared with a fixture. */
    public static JsonObject toJson(ReadableMap map) {
        final JsonObject json = new JsonObject();
        final ReadableMapKeySetIterator iterator = map.keySetIterator();
        while (iterator.hasNextKey()) {
            final String key = iterator.nextKey();
            switch (map.getType(key)) {
                case Null:
                    json.add(key, JsonNull.INSTANCE);
                    break;
                case Boolean:
                    json.add(key, new JsonPrimitive(map.getBoolean(key)));
                    break;
                case Number:
                    json.add(key, new JsonPrimitive(map.getDouble(key)));
                    break;
                case String:
                    json.add(key, new JsonPrimitive(map.getString(key)));
                    break;
                case Map:
                    json.add(key, toJson(map.getMap(key)));
                    break;
                case Array:
                    json.add(key, toJson(map.getArray(key)));
                    break;
            }
        }
        return json;
    }

    public static JsonArray toJson(ReadableArray array) {
        final JsonArray json = new JsonArray();
        for (int i = 0; i < array.size(); i++) {
            switch (array.getType(i)) {
                case Null:
                    json.add(JsonNull.INSTANCE);
                    break;
                case Boolean:
                    json.add(new JsonPrimitive(array.getBoolean(i)));
                    break;
                case Number:
                    json.add(new JsonPrimitive(array.getDouble(i)));
                    break;
                case String:
                    json.add(new JsonPrimitive(array.getString(i)));
                    break;
                case Map:
                    json.add(toJson(array.getMap(i)));
                    break;
                case Array:
                    json.add(toJson(array.getArray(i)));
                    break;
            }
        }
        return json;
    }

    /**
     * Asserts that {@code actual} carries exactly the fixture's keys and values.
     * Gson compares numbers by value, so an integer in the fixture equals the double a mapper emits.
     */
    public static void assertMatchesFixture(String fixtureName, ReadableMap actual) {
        final JsonObject expected = read(fixtureName);
        final JsonObject actualJson = toJson(actual);
        final String pretty = new GsonBuilder().setPrettyPrinting().serializeNulls().create().toJson(actualJson);
        assertEquals("Bridge output differs from " + fixtureName + "\nactual:\n" + pretty, expected, actualJson);
    }
}
