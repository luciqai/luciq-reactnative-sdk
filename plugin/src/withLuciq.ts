import type { ConfigPlugin } from 'expo/config-plugins';
import { createRunOncePlugin } from 'expo/config-plugins';

import { withLuciqAndroid } from './withLuciqAndroid';
import { withLuciqIOS } from './withLuciqIOS';
import { PluginProps } from './pluginProps';

const luciqPackage = require('../../package.json') as {
  name: string;
  version: string;
};

const withLuciqPlugin: ConfigPlugin<PluginProps> = (config, props: PluginProps = {}) => {
  const {
    forceUploadSourceMaps = false,
    addScreenRecordingBugReportingPermission = false,
    addBugReportingIosMediaPermission = true,
  } = props;

  const sharedProps = {
    ...props,
    name: luciqPackage.name,
    forceUploadSourceMaps,
    addScreenRecordingBugReportingPermission,
    addBugReportingIosMediaPermission,
  };

  let updatedConfig = config;

  // Android configuration (only if source maps are enabled)
  try {
    updatedConfig = withLuciqAndroid(updatedConfig, sharedProps);
  } catch (err) {
    console.warn('[Luciq] Failed to configure Android project:', (err as Error).message ?? err);
  }

  // iOS configuration
  try {
    updatedConfig = withLuciqIOS(updatedConfig, sharedProps);
  } catch (err) {
    console.warn('[Luciq] Failed to configure iOS project:', (err as Error).message ?? err);
  }

  return updatedConfig;
};

export const withLuciq = createRunOncePlugin(
  withLuciqPlugin,
  luciqPackage.name,
  luciqPackage.version,
);
