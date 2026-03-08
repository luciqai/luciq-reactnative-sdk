import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  WebViewScrollEvent,
  WebViewNativeEvent,
} from 'react-native-webview/lib/WebViewTypes';

const TEST_URL = 'https://www.wikipedia.org';
const MEDIA_TEST_URL = 'https://www.youtube.com';
const ERROR_TEST_URL = 'https://thisdomaindoesnotexist12345.com';
const HTTP_ERROR_URL = 'https://httpbin.org/status/404';

interface ConfigOption {
  key: string;
  label: string;
  defaultValue: boolean;
  description: string;
  platformNote?: string;
}

const CONFIG_OPTIONS: ConfigOption[] = [
  {
    key: 'javaScriptEnabled',
    label: 'JavaScript Enabled',
    defaultValue: true,
    description: 'Enable/disable JavaScript execution',
  },
  {
    key: 'domStorageEnabled',
    label: 'DOM Storage',
    defaultValue: true,
    description: 'Enable localStorage/sessionStorage',
  },
  {
    key: 'cacheEnabled',
    label: 'Cache Enabled',
    defaultValue: true,
    description: 'Enable HTTP cache',
  },
  {
    key: 'incognito',
    label: 'Incognito Mode',
    defaultValue: false,
    description: 'No cookies, cache, or storage persisted',
  },
  {
    key: 'mediaPlaybackRequiresUserAction',
    label: 'Media Requires User Action',
    defaultValue: true,
    description: 'Require tap to play media',
  },
  {
    key: 'allowsInlineMediaPlayback',
    label: 'Inline Media Playback',
    defaultValue: false,
    description: 'Allow inline video playback',
    platformNote: 'iOS only',
  },
  {
    key: 'pullToRefreshEnabled',
    label: 'Pull to Refresh',
    defaultValue: false,
    description: 'Enable pull-to-refresh gesture',
    platformNote: 'Android only',
  },
  {
    key: 'bounces',
    label: 'Bounces',
    defaultValue: true,
    description: 'Bounce on scroll edges',
    platformNote: 'iOS only',
  },
  {
    key: 'scalesPageToFit',
    label: 'Scales Page to Fit',
    defaultValue: true,
    description: 'Scale web content to fit viewport',
    platformNote: 'Android only',
  },
  {
    key: 'allowsBackForwardNavigationGestures',
    label: 'Back/Forward Gestures',
    defaultValue: false,
    description: 'Swipe to navigate back/forward',
    platformNote: 'iOS only',
  },
  {
    key: 'javaScriptCanOpenWindowsAutomatically',
    label: 'JS Can Open Windows',
    defaultValue: false,
    description: 'Allow window.open() from JS',
  },
  {
    key: 'thirdPartyCookiesEnabled',
    label: 'Third Party Cookies',
    defaultValue: true,
    description: 'Allow third-party cookies',
    platformNote: 'Android only',
  },
  {
    key: 'showsHorizontalScrollIndicator',
    label: 'Horizontal Scroll Indicator',
    defaultValue: true,
    description: 'Show horizontal scroll bar',
  },
  {
    key: 'showsVerticalScrollIndicator',
    label: 'Vertical Scroll Indicator',
    defaultValue: true,
    description: 'Show vertical scroll bar',
  },
  {
    key: 'textInteractionEnabled',
    label: 'Text Interaction',
    defaultValue: true,
    description: 'Allow text selection and interaction',
    platformNote: 'iOS 14.5+',
  },
];

type MixedContentMode = 'never' | 'always' | 'compatibility';

export const WebViewConfigPocScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState(TEST_URL);
  const [config, setConfig] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CONFIG_OPTIONS.forEach((opt) => {
      initial[opt.key] = opt.defaultValue;
    });
    return initial;
  });
  const [mixedContentMode, setMixedContentMode] = useState<MixedContentMode>('never');
  const [userAgent, setUserAgent] = useState<string | undefined>(undefined);
  const [webViewKey, setWebViewKey] = useState(0);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  const toggleConfig = (key: string) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyConfig = () => {
    setWebViewKey((prev) => prev + 1);
    addLog('Config applied - WebView reloaded');
  };

  const handleScroll = useCallback(
    (event: WebViewScrollEvent) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      addLog(
        `onScroll: x=${contentOffset.x.toFixed(0)}, y=${contentOffset.y.toFixed(0)}, ` +
          `content=${contentSize.width.toFixed(0)}x${contentSize.height.toFixed(0)}, ` +
          `layout=${layoutMeasurement.width.toFixed(0)}x${layoutMeasurement.height.toFixed(0)}`,
      );
    },
    [addLog],
  );

  const handleContentProcessDidTerminate = useCallback(() => {
    addLog('onContentProcessDidTerminate: WebView process terminated!');
    webViewRef.current?.reload();
  }, [addLog]);

  const handleRenderProcessGone = useCallback(() => {
    addLog('onRenderProcessGone: WebView render process gone! (Android)');
  }, [addLog]);

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Custom Loading View...</Text>
    </View>
  );

  const renderError = (errorDomain: string | undefined, errorCode: number, errorDesc: string) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Custom Error View</Text>
      <Text style={styles.errorText}>Domain: {errorDomain}</Text>
      <Text style={styles.errorText}>Code: {errorCode}</Text>
      <Text style={styles.errorText}>Description: {errorDesc}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => webViewRef.current?.reload()}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const originWhitelist = ['https://*', 'http://*'];

  return (
    <View style={styles.container}>
      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          key={`config-wv-${webViewKey}`}
          source={{ uri: currentUrl }}
          originWhitelist={originWhitelist}
          mixedContentMode={mixedContentMode}
          userAgent={userAgent}
          javaScriptEnabled={config.javaScriptEnabled}
          domStorageEnabled={config.domStorageEnabled}
          cacheEnabled={config.cacheEnabled}
          incognito={config.incognito}
          mediaPlaybackRequiresUserAction={config.mediaPlaybackRequiresUserAction}
          allowsInlineMediaPlayback={config.allowsInlineMediaPlayback}
          pullToRefreshEnabled={config.pullToRefreshEnabled}
          bounces={config.bounces}
          scalesPageToFit={config.scalesPageToFit}
          allowsBackForwardNavigationGestures={config.allowsBackForwardNavigationGestures}
          javaScriptCanOpenWindowsAutomatically={config.javaScriptCanOpenWindowsAutomatically}
          thirdPartyCookiesEnabled={config.thirdPartyCookiesEnabled}
          showsHorizontalScrollIndicator={config.showsHorizontalScrollIndicator}
          showsVerticalScrollIndicator={config.showsVerticalScrollIndicator}
          textInteractionEnabled={config.textInteractionEnabled}
          onScroll={handleScroll}
          onContentProcessDidTerminate={handleContentProcessDidTerminate}
          onRenderProcessGone={handleRenderProcessGone}
          renderLoading={renderLoading}
          renderError={renderError}
          startInLoadingView={true}
          onLoadEnd={(event: { nativeEvent: WebViewNativeEvent }) =>
            addLog(`Loaded: ${event.nativeEvent.url}`)
          }
        />
      </View>

      <ScrollView style={styles.controlsContainer}>
        {/* Quick URL switches */}
        <Text style={styles.sectionTitle}>Test URLs</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.urlButton, currentUrl === TEST_URL && styles.activeUrlButton]}
            onPress={() => {
              setCurrentUrl(TEST_URL);
              setWebViewKey((p) => p + 1);
            }}>
            <Text style={styles.urlButtonText}>Wikipedia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.urlButton, currentUrl === MEDIA_TEST_URL && styles.activeUrlButton]}
            onPress={() => {
              setCurrentUrl(MEDIA_TEST_URL);
              setWebViewKey((p) => p + 1);
            }}>
            <Text style={styles.urlButtonText}>YouTube (Media)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.urlButton, currentUrl === ERROR_TEST_URL && styles.activeUrlButton]}
            onPress={() => {
              setCurrentUrl(ERROR_TEST_URL);
              setWebViewKey((p) => p + 1);
            }}>
            <Text style={styles.urlButtonText}>Error URL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.urlButton, currentUrl === HTTP_ERROR_URL && styles.activeUrlButton]}
            onPress={() => {
              setCurrentUrl(HTTP_ERROR_URL);
              setWebViewKey((p) => p + 1);
            }}>
            <Text style={styles.urlButtonText}>HTTP 404</Text>
          </TouchableOpacity>
        </View>

        {/* User Agent */}
        <Text style={styles.sectionTitle}>User Agent</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.smallButton, !userAgent && styles.activeSmallButton]}
            onPress={() => {
              setUserAgent(undefined);
              setWebViewKey((p) => p + 1);
            }}>
            <Text style={styles.smallButtonText}>Default</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.smallButton,
              userAgent === 'LuciqTestApp/1.0' && styles.activeSmallButton,
            ]}
            onPress={() => {
              setUserAgent('LuciqTestApp/1.0');
              setWebViewKey((p) => p + 1);
            }}>
            <Text style={styles.smallButtonText}>Custom</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.smallButton,
              userAgent?.includes('Mozilla') && styles.activeSmallButton,
            ]}
            onPress={() => {
              setUserAgent(
                'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/91.0 Mobile Safari/537.36',
              );
              setWebViewKey((p) => p + 1);
            }}>
            <Text style={styles.smallButtonText}>Chrome Mobile</Text>
          </TouchableOpacity>
        </View>

        {/* Mixed Content Mode (Android) */}
        <Text style={styles.sectionTitle}>Mixed Content Mode (Android)</Text>
        <View style={styles.buttonRow}>
          {(['never', 'always', 'compatibility'] as MixedContentMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.smallButton,
                mixedContentMode === mode && styles.activeSmallButton,
              ]}
              onPress={() => {
                setMixedContentMode(mode);
                setWebViewKey((p) => p + 1);
              }}>
              <Text style={styles.smallButtonText}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Boolean Config Toggles */}
        <Text style={styles.sectionTitle}>Configuration Toggles</Text>
        {CONFIG_OPTIONS.map((opt) => (
          <View key={opt.key} style={styles.configRow}>
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>{opt.label}</Text>
              <Text style={styles.configDesc}>
                {opt.description}
                {opt.platformNote ? ` (${opt.platformNote})` : ''}
              </Text>
            </View>
            <Switch
              value={config[opt.key]}
              onValueChange={() => toggleConfig(opt.key)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.applyButton} onPress={applyConfig}>
          <Text style={styles.applyButtonText}>Apply Config & Reload WebView</Text>
        </TouchableOpacity>

        {/* Event Log */}
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>Event Log ({logs.length})</Text>
          <TouchableOpacity onPress={() => setLogs([])}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.logBox}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logEntry}>
              {log}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewContainer: {
    height: 250,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  controlsContainer: {
    flex: 1,
    padding: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  urlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
  },
  activeUrlButton: {
    backgroundColor: '#007AFF',
  },
  urlButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  activeSmallButton: {
    backgroundColor: '#34C759',
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  configInfo: {
    flex: 1,
    marginRight: 8,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  configDesc: {
    fontSize: 11,
    color: '#888',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  clearBtn: {
    color: '#FF3B30',
    fontSize: 12,
  },
  logBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    padding: 8,
    minHeight: 80,
    marginBottom: 24,
  },
  logEntry: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
});
