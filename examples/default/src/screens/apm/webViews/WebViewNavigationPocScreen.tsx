import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  WebViewNavigation,
  WebViewNativeEvent,
  WebViewHttpErrorEvent,
  WebViewErrorEvent,
} from 'react-native-webview/lib/WebViewTypes';

const DEFAULT_URL = 'https://www.example.com';

export const WebViewNavigationPocScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [urlInput, setUrlInput] = useState(DEFAULT_URL);
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [logs, setLogs] = useState<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [blockedUrls, setBlockedUrls] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  const handleLoadStart = useCallback(
    (event: { nativeEvent: WebViewNativeEvent }) => {
      setIsLoading(true);
      addLog(`onLoadStart: ${event.nativeEvent.url}`);
    },
    [addLog],
  );

  const handleLoad = useCallback(
    (event: { nativeEvent: WebViewNativeEvent }) => {
      addLog(`onLoad: ${event.nativeEvent.url} (title: ${event.nativeEvent.title})`);
    },
    [addLog],
  );

  const handleLoadEnd = useCallback(
    (event: { nativeEvent: WebViewNativeEvent }) => {
      setIsLoading(false);
      addLog(`onLoadEnd: ${event.nativeEvent.url} (loading: ${event.nativeEvent.loading})`);
    },
    [addLog],
  );

  const handleError = useCallback(
    (event: WebViewErrorEvent) => {
      setIsLoading(false);
      const { nativeEvent } = event;
      addLog(
        `onError: code=${nativeEvent.code}, description=${nativeEvent.description}, url=${nativeEvent.url}`,
      );
    },
    [addLog],
  );

  const handleHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      const { nativeEvent } = event;
      addLog(
        `onHttpError: statusCode=${nativeEvent.statusCode}, url=${nativeEvent.url}, description=${nativeEvent.description}`,
      );
    },
    [addLog],
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      setCanGoBack(navState.canGoBack);
      setCanGoForward(navState.canGoForward);
      setCurrentUrl(navState.url);
      addLog(
        `onNavigationStateChange: url=${navState.url}, canGoBack=${navState.canGoBack}, canGoForward=${navState.canGoForward}, loading=${navState.loading}`,
      );
    },
    [addLog],
  );

  const handleShouldStartLoadWithRequest = useCallback(
    (request: WebViewNavigation): boolean => {
      addLog(`onShouldStartLoadWithRequest: url=${request.url}, navigationType=${request.navigationType}`);
      // Block any URL that's in the blocked list
      const isBlocked = blockedUrls.some((blocked) => request.url.includes(blocked));
      if (isBlocked) {
        addLog(`BLOCKED navigation to: ${request.url}`);
        return false;
      }
      return true;
    },
    [addLog, blockedUrls],
  );

  const navigateToUrl = () => {
    let url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setCurrentUrl(url);
    setUrlInput(url);
  };

  const toggleBlockGoogle = () => {
    setBlockedUrls((prev) =>
      prev.includes('google.com')
        ? prev.filter((u) => u !== 'google.com')
        : [...prev, 'google.com'],
    );
  };

  return (
    <View style={styles.container}>
      {/* URL Bar */}
      <View style={styles.urlBar}>
        <TextInput
          style={styles.urlInput}
          value={urlInput}
          onChangeText={setUrlInput}
          onSubmitEditing={navigateToUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="Enter URL..."
        />
        <TouchableOpacity style={styles.goButton} onPress={navigateToUrl}>
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Controls */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}>
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}>
          <Text style={styles.navButtonText}>Forward</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => webViewRef.current?.reload()}>
          <Text style={styles.navButtonText}>Reload</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => webViewRef.current?.stopLoading()}>
          <Text style={styles.navButtonText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, blockedUrls.includes('google.com') && styles.activeButton]}
          onPress={toggleBlockGoogle}>
          <Text style={styles.navButtonText}>
            {blockedUrls.includes('google.com') ? 'Unblock Google' : 'Block Google'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingBar}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleHttpError}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          startInLoadingView={true}
        />
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText} numberOfLines={1}>
          URL: {currentUrl}
        </Text>
        <Text style={styles.statusText}>
          Back: {canGoBack ? 'Yes' : 'No'} | Forward: {canGoForward ? 'Yes' : 'No'} | Loading:{' '}
          {isLoading ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Event Log */}
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Event Log ({logs.length} entries)</Text>
        <TouchableOpacity onPress={() => setLogs([])}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.logScroll}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logEntry}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  urlBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  urlInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  goButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    justifyContent: 'center',
  },
  goButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexWrap: 'wrap',
  },
  navButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 2,
    marginVertical: 2,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeButton: {
    backgroundColor: '#FF3B30',
  },
  loadingBar: {
    backgroundColor: '#007AFF',
    padding: 2,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 11,
  },
  webViewContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statusBar: {
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statusText: {
    fontSize: 11,
    color: '#666',
  },
  logContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1a1a2e',
  },
  logTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    color: '#FF3B30',
    fontSize: 12,
  },
  logScroll: {
    maxHeight: 150,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 8,
  },
  logEntry: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
});