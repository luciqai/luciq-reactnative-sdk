import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import Luciq, {
  APM,
  AutoMaskingType,
  CapturingMode,
  CrashReporting,
  InvocationEvent,
  LaunchType,
  LogLevel,
  NetworkInterceptionMode,
  NetworkLogger,
  OverAirUpdateServices,
  ReproStepsMode,
  ScreenshotQuality,
  SessionMetadata,
  SessionReplay,
  WelcomeMessageMode,
} from '@luciq/react-native';
import { NativeBaseProvider } from 'native-base';

import { RootTabNavigator } from './navigation/RootTab';
import { nativeBaseTheme } from './theme/nativeBaseTheme';
import { navigationTheme } from './theme/navigationTheme';

import { QueryClient, QueryClientProvider } from 'react-query';
import { CallbackHandlersProvider } from './contexts/callbackContext';
import { ColdStartTelemetry, fireColdStartBurstOnce } from './utils/coldStartTelemetry';

const queryClient = new QueryClient();

/**
 * Enables the INSD-14886 cold-start race reproduction. When true, a burst
 * of REST requests is fired immediately after Luciq.init() returns —
 * mirroring the Discogs RN app's startup pattern. Use the
 * "Cold-Start Network Race" screen under APM to inspect fired vs captured
 * counts. Set to false to disable the burst on launch.
 */
const COLD_START_REPRO_ENABLED = true;

export const App: React.FC = () => {
  const shouldSyncSession = (data: SessionMetadata) => {
    if (data.launchType === LaunchType.cold) {
      return true;
    }
    if (data.sessionDurationInSeconds > 20) {
      return true;
    }
    if (data.OS === 'OS Level 34') {
      return true;
    }
    return true;
  };

  const navigationRef = useNavigationContainerRef();

  const initializeLuciq = () => {
    try {
      // Configure video-like session replay (before SDK init for best results)
      SessionReplay.setCapturingMode(CapturingMode.interactions);
      SessionReplay.setScreenshotCaptureInterval(1000); // 1 FPS
      SessionReplay.setScreenshotQuality(ScreenshotQuality.greyscale);

      SessionReplay.setSyncCallback((data) => shouldSyncSession(data));

      Luciq.init({
        token: 'deb1910a7342814af4e4c9210c786f35',
        invocationEvents: [InvocationEvent.floatingButton],
        debugLogsLevel: LogLevel.verbose,
        networkInterceptionMode: NetworkInterceptionMode.javascript,
        appVariant: 'App variant',
        overAirVersion: { service: OverAirUpdateServices.codePush, version: '1.0.0' },
      });

      CrashReporting.setNDKCrashesEnabled(true);
      Luciq.setWelcomeMessageMode(WelcomeMessageMode.disabled);
      Luciq.setReproStepsConfig({ all: ReproStepsMode.enabled });
      Luciq.enableAutoMasking([AutoMaskingType.none]);

      Luciq.setWebViewMonitoringEnabled(true);
      Luciq.setWebViewNetworkTrackingEnabled(true);
      Luciq.setWebViewUserInteractionsTrackingEnabled(true);

      if (COLD_START_REPRO_ENABLED) {
        // Fire the burst on the same JS tick that init() returns. On Android
        // before the Luciq.ts fix, the JS XHR interceptor was still off here
        // (it waits for LCQ_ON_FEATURES_UPDATED_CALLBACK from native), so
        // these requests bypass APM entirely. Guard so the no-deps useEffect
        // in this component doesn't fire it on every render.
        fireColdStartBurstOnce();
      }
    } catch (error) {
      console.error('Luciq initialization failed:', error);
    }
  };

  useEffect(() => {
    initializeLuciq();
    APM.setScreenRenderingEnabled(true);
    APM.excludeScreenLoadingRoutes(['APM']);
    NetworkLogger.setNetworkDataObfuscationHandler(async (networkData) => {
      // Record the captured URL before any transformation so it matches the
      // exact string recorded by fireColdStartBurst.
      ColdStartTelemetry.recordCaptured(networkData.url);
      networkData.url = `${networkData.url}/JS/Obfuscated`;
      return networkData;
    });
  });

  useEffect(() => {
    // @ts-ignore
    Luciq.setNavigationListener(navigationRef);
  }, [navigationRef]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <NativeBaseProvider theme={nativeBaseTheme}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer
            onStateChange={Luciq.onStateChange}
            ref={navigationRef}
            theme={navigationTheme}>
            <CallbackHandlersProvider>
              <RootTabNavigator />
            </CallbackHandlersProvider>
          </NavigationContainer>
        </QueryClientProvider>
      </NativeBaseProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
