import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SessionMetadata, WelcomeMessageMode } from '@luciq/react-native';
import Luciq, {
  APM,
  CrashReporting,
  InvocationEvent,
  LaunchType,
  LogLevel,
  NetworkInterceptionMode,
  NetworkLogger,
  ReproStepsMode,
  SessionReplay,
  OverAirUpdateServices,
  LuciqNavigationContainer,
  createScreenLoadingConfig,
} from '@luciq/react-native';
import { NativeBaseProvider } from 'native-base';

import { RootTabNavigator } from './navigation/RootTab';
import { nativeBaseTheme } from './theme/nativeBaseTheme';
import { navigationTheme } from './theme/navigationTheme';

import { QueryClient, QueryClientProvider } from 'react-query';
import { CallbackHandlersProvider } from './contexts/callbackContext';

const queryClient = new QueryClient();

/**
 * Screen loading configuration for the example app.
 * Demonstrates the new createScreenLoadingConfig helper.
 */
const screenLoadingConfig = createScreenLoadingConfig({
  enabled: true,
  autoTrackingEnabled: true,
  excludedScreens: ['SplashScreen'], // Example: exclude specific screens from tracking
  slowLoadingThreshold: 2000, // Warn when screen takes > 2 seconds to load
  onSlowLoading: (screenName, duration) => {
    console.warn(`[ScreenLoading] Slow load detected: ${screenName} took ${duration}ms`);
  },
});

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
    return false;
  };

  const initializeLuciq = () => {
    try {
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
    } catch (error) {
      console.error('Luciq initialization failed:', error);
    }
  };

  useEffect(() => {
    initializeLuciq();
    APM.setScreenRenderingEnabled(true);
    NetworkLogger.setNetworkDataObfuscationHandler(async (networkData) => {
      networkData.url = `${networkData.url}/JS/Obfuscated`;
      return networkData;
    });
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <NativeBaseProvider theme={nativeBaseTheme}>
        <QueryClientProvider client={queryClient}>
          {/*
           * LuciqNavigationContainer is a drop-in replacement for NavigationContainer
           * that automatically sets up:
           * - Screen change reporting for repro steps
           * - Navigation timing context for accurate screen loading measurement
           * - Automatic TTID/TTFD measurement when enabled
           */}
          <LuciqNavigationContainer
            NavigationContainer={NavigationContainer as any}
            enableScreenTracking={true}
            enableScreenLoading={true}
            screenLoadingConfig={screenLoadingConfig}
            theme={navigationTheme}
            screenNameExtractor={(route) => {
              // Custom screen name extraction example
              // You can include params in screen names for more detailed analytics
              if (route.name === 'Product' && route.params?.id) {
                return `Product-${route.params.id}`;
              }
              return route.name;
            }}>
            <CallbackHandlersProvider>
              <RootTabNavigator />
            </CallbackHandlersProvider>
          </LuciqNavigationContainer>
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
