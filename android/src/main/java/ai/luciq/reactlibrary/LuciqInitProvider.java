package ai.luciq.reactlibrary;

import android.app.Application;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import ai.luciq.library.LogLevel;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;

/**
 * No-op {@link ContentProvider} whose only purpose is to run {@link #onCreate()} before
 * {@code Application.onCreate()}, giving the SDK a chance to install its native crash handlers
 * before the React Native bridge and JS bundle load.
 *
 * <p>It reads build-time configuration from {@code <meta-data>} entries in the merged
 * AndroidManifest (written by the Expo config plugin or manually for bare React Native) and, when
 * pre-init is enabled and a token is present, calls {@link RNLuciq#startPreInit}.</p>
 *
 * <p>This provider is declared in the SDK's own AndroidManifest, so no host-app code is required.
 * When pre-init is not configured it does nothing.</p>
 */
public class LuciqInitProvider extends ContentProvider {

    static final String META_ENABLED = "ai.luciq.preinit.enabled";
    static final String META_TOKEN = "ai.luciq.preinit.token";
    static final String META_LOG_LEVEL = "ai.luciq.preinit.logLevel";
    static final String META_IGNORE_SECURE_FLAG = "ai.luciq.preinit.ignoreAndroidSecureFlag";

    @Override
    public boolean onCreate() {
        try {
            final Context context = getContext();
            if (context == null) {
                return false;
            }

            final Bundle metaData = getMetaData(context);
            if (metaData == null || !metaData.getBoolean(META_ENABLED, false)) {
                return true;
            }

            final String token = readString(metaData, META_TOKEN);
            if (TextUtils.isEmpty(token)) {
                LuciqRNLogger.e(LuciqRNDebugTags.CORE,
                        "[LuciqInitProvider] pre-init enabled but no token found in manifest meta-data; skipping");
                return true;
            }

            final int logLevel = metaData.getInt(META_LOG_LEVEL, LogLevel.ERROR);
            final Boolean ignoreSecureFlag = metaData.containsKey(META_IGNORE_SECURE_FLAG)
                    ? metaData.getBoolean(META_IGNORE_SECURE_FLAG) : null;

            if (!(context.getApplicationContext() instanceof Application)) {
                return true;
            }
            final Application application = (Application) context.getApplicationContext();

            LuciqRNLogger.d(LuciqRNDebugTags.CORE, "[LuciqInitProvider] starting native pre-init");
            RNLuciq.getInstance().startPreInit(application, token, logLevel, ignoreSecureFlag);
        } catch (Exception e) {
            // Never crash the host app from the provider; pre-init is best-effort.
            LuciqRNLogger.e(LuciqRNDebugTags.CORE, "[LuciqInitProvider] failed", e);
        }
        return true;
    }

    @Nullable
    private Bundle getMetaData(@NonNull Context context) {
        try {
            final ApplicationInfo info = context.getPackageManager().getApplicationInfo(
                    context.getPackageName(), PackageManager.GET_META_DATA);
            return info.metaData;
        } catch (Exception e) {
            LuciqRNLogger.e(LuciqRNDebugTags.CORE, "[LuciqInitProvider] failed to read meta-data", e);
            return null;
        }
    }

    @Nullable
    private String readString(@NonNull Bundle metaData, @NonNull String key) {
        final Object value = metaData.get(key);
        return value == null ? null : String.valueOf(value);
    }

    @Nullable
    @Override
    public Cursor query(@NonNull Uri uri, @Nullable String[] projection, @Nullable String selection,
                        @Nullable String[] selectionArgs, @Nullable String sortOrder) {
        return null;
    }

    @Nullable
    @Override
    public String getType(@NonNull Uri uri) {
        return null;
    }

    @Nullable
    @Override
    public Uri insert(@NonNull Uri uri, @Nullable ContentValues values) {
        return null;
    }

    @Override
    public int delete(@NonNull Uri uri, @Nullable String selection, @Nullable String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(@NonNull Uri uri, @Nullable ContentValues values, @Nullable String selection,
                      @Nullable String[] selectionArgs) {
        return 0;
    }
}
