import type { ConfigPlugin } from 'expo/config-plugins';
import { withAppBuildGradle, withAndroidManifest } from 'expo/config-plugins';
import type { PluginProps } from './pluginProps';
import { setMetaData } from './preInitHelpers';

export const withLuciqAndroid: ConfigPlugin<PluginProps> = (config, props) => {
  config = withAppBuildGradle(config, (configAndroid) => {
    if (props.forceUploadSourceMaps) {
      const gradle = configAndroid.modResults;
      const packageName = props.name;

      if (!packageName) {
        console.warn('[Luciq] Missing "name" in plugin props. Skipping Android configuration.');
        return configAndroid;
      }

      if (gradle.language === 'groovy') {
        gradle.contents = injectGroovyScript(gradle.contents, packageName);
      } else if (gradle.language === 'kt') {
        gradle.contents = injectKotlinScript(gradle.contents, packageName);
      } else {
        throw new Error(
          '[Luciq] Unsupported Gradle language. Only Groovy and Kotlin DSL are supported.',
        );
      }
    }
    return configAndroid;
  });

  // Enable native pre-init crash capture via manifest meta-data read by LuciqInitProvider
  if (props.enablePreInitCrashCapture) {
    const token = props.token ?? (config.extra?.luciq?.token as string | undefined);

    if (!token) {
      console.warn(
        '[Luciq] enablePreInitCrashCapture is true but no token was provided (plugin "token" prop or extra.luciq.token). Skipping Android pre-init.',
      );
    } else {
      config = withAndroidManifest(config, (configAndroid) => {
        const application = configAndroid.modResults.manifest.application?.[0];

        if (!application) {
          console.warn(
            '[Luciq] No <application> found in AndroidManifest. Skipping Android pre-init.',
          );
          return configAndroid;
        }

        const entries: Record<string, string> = {
          'ai.luciq.preinit.enabled': 'true',
          'ai.luciq.preinit.token': token,
        };
        if (props.ignoreAndroidSecureFlag != null) {
          entries['ai.luciq.preinit.ignoreAndroidSecureFlag'] = String(
            props.ignoreAndroidSecureFlag,
          );
        }

        application['meta-data'] = setMetaData(application['meta-data'], entries);

        return configAndroid;
      });
    }
  }

  // Inject the permission if requested
  if (props.addScreenRecordingBugReportingPermission) {
    config = withAndroidManifest(config, (configAndroid) => {
      const manifest = configAndroid.modResults;

      const permissionName = 'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION';
      const alreadyExists = manifest.manifest['uses-permission']?.some(
        (permission: any) => permission.$?.['android:name'] === permissionName,
      );

      if (!alreadyExists) {
        manifest.manifest['uses-permission'] = [
          ...(manifest.manifest['uses-permission'] || []),
          {
            $: {
              'android:name': permissionName,
            },
          },
        ];
      }

      return configAndroid;
    });
  }

  return config;
};

// --- Helper Functions ---

function injectGroovyScript(buildGradle: string, packageName: string): string {
  if (buildGradle.includes('sourcemaps.gradle')) {
    return buildGradle;
  }

  const androidBlockPattern = /^android\s*{/m;
  if (!androidBlockPattern.test(buildGradle)) {
    console.warn('[Luciq] Could not find "android {" block in Groovy build.gradle.');
    return buildGradle;
  }

  const script = `
def luciqPath = ["node", "--print", "require('path').dirname(require.resolve('${packageName}/package.json'))"]
    .execute()
    .text
    .trim()
apply from: new File(luciqPath, "android/sourcemaps.gradle")
`.trim();

  return buildGradle.replace(androidBlockPattern, `${script}\n\nandroid {`);
}

function injectKotlinScript(buildGradle: string, packageName: string): string {
  if (buildGradle.includes('sourcemaps.gradle')) {
    return buildGradle;
  }

  const androidBlockPattern = /^android\s*{/m;
  if (!androidBlockPattern.test(buildGradle)) {
    console.warn('[Luciq] Could not find "android {" block in Kotlin build.gradle.kts.');
    return buildGradle;
  }

  const script = `
val luciqPath = listOf("node", "--print", "require('path').dirname(require.resolve("${packageName}/package.json"))")
    .let { ProcessBuilder(it).start().inputStream.bufferedReader().readText().trim() }
apply(from = File(luciqPath, "android/sourcemaps.gradle"))
`.trim();

  return buildGradle.replace(androidBlockPattern, `${script}\n\nandroid {`);
}
