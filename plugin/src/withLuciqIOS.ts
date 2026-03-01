import type { ConfigPlugin, XcodeProject } from 'expo/config-plugins';
import { withXcodeProject, withInfoPlist } from 'expo/config-plugins';
import type { PluginProps } from './pluginProps';
import * as path from 'path';
import * as fs from 'fs';

const BUILD_PHASE = 'PBXShellScriptBuildPhase';
const PHASE_COMMENT = 'Bundle React Native code and images';
const LUCIQ_BUILD_PHASE = '[@luciq/react-native] Upload Sourcemap';

export const withLuciqIOS: ConfigPlugin<PluginProps> = (config, props) => {
  let updatedConfig = withXcodeProject(config, (configXcode) => {
    const xcodeProject = configXcode.modResults;
    const buildPhases = xcodeProject.hash.project.objects[BUILD_PHASE];

    if (!buildPhases) {
      console.warn('[Luciq] No build phases found in Xcode project.');
      return configXcode;
    }

    // Add Luciq build phase if not already present
    const hasLuciqPhase = Boolean(findBuildPhase(buildPhases, LUCIQ_BUILD_PHASE));

    if (!hasLuciqPhase && props.forceUploadSourceMaps) {
      addLuciqBuildPhase(xcodeProject, props.name);
    }

    // Patch bundle React Native phase with source map export
    const bundlePhase = xcodeProject.pbxItemByComment(PHASE_COMMENT, BUILD_PHASE);
    if (bundlePhase?.shellScript) {
      bundlePhase.shellScript = injectSourceMapExport(bundlePhase.shellScript);
    }

    return configXcode;
  });

  // Add media permissions to Info.plist if enabled
  if (props.addBugReportingIosMediaPermission) {
    const luciqConfig = config.extra?.luciq ?? {};

    const microphonePermission =
      luciqConfig.microphonePermission ||
      'This needs access to your microphone so you can attach voice notes.';

    const photoLibraryPermission =
      luciqConfig.photoLibraryPermission ||
      'This needs access to your photo library so you can attach images.';

    updatedConfig = withInfoPlist(updatedConfig, (configXcode) => {
      const plist = configXcode.ios.infoPlist ?? {};

      if (!plist.NSMicrophoneUsageDescription) {
        plist.NSMicrophoneUsageDescription = microphonePermission;
      }

      if (!plist.NSPhotoLibraryUsageDescription) {
        plist.NSPhotoLibraryUsageDescription = photoLibraryPermission;
      }

      configXcode.ios.infoPlist = plist;
      return configXcode;
    });
  }

  return updatedConfig;
};

// Find a build phase by its clean name
function findBuildPhase(buildPhases: any, targetName: string): any | undefined {
  const target = targetName.toLowerCase().trim();
  return Object.values(buildPhases).find((phase: any) => {
    const rawName = phase?.name ?? '';
    const cleanName = rawName
      .toLowerCase()
      .replace('[cp-user] ', '')
      .replace(/^"+|"+$/g, '')
      .trim();
    return cleanName === target;
  });
}

// Inject Luciq shell script phase
function addLuciqBuildPhase(xcodeProject: XcodeProject, packageName: string): void {
  try {
    const packagePath = require.resolve(`${packageName}/package.json`);
    const sourcemapScriptPath = path.join(path.dirname(packagePath), 'ios/sourcemaps.sh');

    if (!fs.existsSync(sourcemapScriptPath)) {
      console.warn(`[Luciq] sourcemaps.sh not found at: ${sourcemapScriptPath}`);
      return;
    }

    xcodeProject.addBuildPhase([], BUILD_PHASE, LUCIQ_BUILD_PHASE, null, {
      shellPath: '/bin/sh',
      shellScript: `/bin/sh ${sourcemapScriptPath}`,
    });
  } catch (err) {
    console.warn(`[Luciq] Failed to resolve package path for "${packageName}":`, err);
  }
}

// Inject source map export line into the shell script
function injectSourceMapExport(script: string): string {
  const exportLine = 'export SOURCEMAP_FILE="$DERIVED_FILE_DIR/main.jsbundle.map"';
  const escapedLine = exportLine.replace(/"/g, '\\"');
  const injectedLine = `${escapedLine}\\n`;

  if (script.includes(escapedLine)) {
    return script;
  }
  const buggyLine = exportLine.replace(/\$/g, '\\$').replace(/"/g, '\\"');
  if (script.includes(buggyLine)) {
    return script.split(buggyLine).join(escapedLine);
  }
  return script.replace(/^"/, `"${injectedLine}`);
}
