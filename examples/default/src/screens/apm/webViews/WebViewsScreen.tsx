import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/HomeStack';
import React from 'react';
import { Screen } from '../../../components/Screen';
import { ListTile } from '../../../components/ListTile';

export const WebViewsScreen: React.FC<NativeStackScreenProps<HomeStackParamList, 'WebViews'>> = ({
  navigation,
}) => {
  return (
    <Screen>
      <ListTile title="Full Web View" onPress={() => navigation.navigate('FullWebViews')} />
      <ListTile title="Partial Web View" onPress={() => navigation.navigate('PartialWebViews')} />
      <ListTile
        title="Navigation & Callbacks POC"
        subtitle="goBack, goForward, reload, stop, onLoad*, onError, onNavigationStateChange, onShouldStartLoadWithRequest"
        onPress={() => navigation.navigate('WebViewNavigationPoc')}
      />
      <ListTile
        title="JS Bridge POC"
        subtitle="injectedJS, postMessage, onMessage, injectJavaScript, JS toggle"
        onPress={() => navigation.navigate('WebViewJSBridgePoc')}
      />
      <ListTile
        title="Config & Properties POC"
        subtitle="cache, incognito, userAgent, mixedContent, media, bounce, scroll, renderError/Loading"
        onPress={() => navigation.navigate('WebViewConfigPoc')}
      />
      <ListTile
        title="HTML Source & Headers POC"
        subtitle="HTML string source, forms, canvas, SVG, custom headers, custom HTML editor"
        onPress={() => navigation.navigate('WebViewHtmlSourcePoc')}
      />
      <ListTile
        title="Diagnostic Tests"
        subtitle="Automated tests: bridge, events, JS injection, DOM, storage, network, navigation"
        onPress={() => navigation.navigate('WebViewDiagnosticPoc')}
      />
    </Screen>
  );
};
