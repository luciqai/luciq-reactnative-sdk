import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import Luciq, {
  APM,
  CrashReporting,
  InvocationEvent,
  LaunchType,
  LogLevel,
  NetworkInterceptionMode,
  NetworkLogger,
  ReproStepsMode,
  type SessionMetadata,
  SessionReplay,
  OverAirUpdateServices,
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
    return false;
  };

  const navigationRef = useNavigationContainerRef();

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

  useEffect(() => {
    // @ts-ignore
    const unregisterListener = Luciq.setNavigationListener(navigationRef);

    return unregisterListener;
  }, [navigationRef]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <NativeBaseProvider theme={nativeBaseTheme}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer onStateChange={Luciq.onStateChange} theme={navigationTheme}>
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
