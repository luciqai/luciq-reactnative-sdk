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

const queryClient = new QueryClient();

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
        token: 'edf39870075f79dc20e11ff34dc27925',
        invocationEvents: [InvocationEvent.floatingButton],
        debugLogsLevel: LogLevel.verbose,
        networkInterceptionMode: NetworkInterceptionMode.javascript,
      });

      CrashReporting.setNDKCrashesEnabled(true);
      Luciq.setWelcomeMessageMode(WelcomeMessageMode.disabled);
      Luciq.setReproStepsConfig({ all: ReproStepsMode.enabled });
      Luciq.enableAutoMasking([AutoMaskingType.none]);

      Luciq.setWebViewMonitoringEnabled(true);
      Luciq.setWebViewNetworkTrackingEnabled(true);
      Luciq.setWebViewUserInteractionsTrackingEnabled(true);
    } catch (error) {
      console.error('Luciq initialization failed:', error);
    }
  };

  useEffect(() => {
    initializeLuciq();
    APM.setScreenRenderingEnabled(true);
    APM.excludeScreenLoadingRoutes(['APM']);
    NetworkLogger.setNetworkDataObfuscationHandler(async (networkData) => {
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
