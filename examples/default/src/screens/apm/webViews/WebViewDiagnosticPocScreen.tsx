// @ts-nocheck
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  WebViewMessageEvent,
  WebViewNavigation,
  WebViewNativeEvent,
  WebViewErrorEvent,
} from 'react-native-webview/lib/WebViewTypes';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail' | 'skipped';
  detail?: string;
  duration?: number;
}

const DIAGNOSTIC_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 8px; background: #f5f5f5; font-size: 13px; }
    .status { padding: 4px 8px; border-radius: 4px; margin: 2px 0; font-family: monospace; font-size: 11px; }
    .pass { background: #d4edda; color: #155724; }
    .fail { background: #f8d7da; color: #721c24; }
    .info { background: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <div id="log"></div>
  <script>
    var results = {};
    function log(msg, cls) {
      var el = document.createElement('div');
      el.className = 'status ' + (cls || 'info');
      el.textContent = msg;
      document.getElementById('log').appendChild(el);
    }

    function sendResult(testName, passed, detail) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'test_result',
        test: testName,
        passed: passed,
        detail: detail || ''
      }));
    }

    // Test 1: postMessage bridge works
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'bridge_check' }));
      log('postMessage bridge: available', 'pass');
      sendResult('postMessage_bridge', true, 'window.ReactNativeWebView.postMessage is available');
    } catch (e) {
      log('postMessage bridge: FAILED - ' + e.message, 'fail');
      sendResult('postMessage_bridge', false, e.message);
    }

    // Test 2: DOM manipulation
    try {
      var testDiv = document.createElement('div');
      testDiv.id = 'dom-test';
      testDiv.textContent = 'DOM test element';
      document.body.appendChild(testDiv);
      var found = document.getElementById('dom-test');
      var passed = found && found.textContent === 'DOM test element';
      log('DOM manipulation: ' + (passed ? 'OK' : 'FAILED'), passed ? 'pass' : 'fail');
      sendResult('dom_manipulation', passed, passed ? 'createElement and getElementById work' : 'DOM operations failed');
      document.body.removeChild(testDiv);
    } catch (e) {
      log('DOM manipulation: FAILED - ' + e.message, 'fail');
      sendResult('dom_manipulation', false, e.message);
    }

    // Test 3: localStorage
    try {
      localStorage.setItem('diag_test', 'diag_value');
      var val = localStorage.getItem('diag_test');
      var passed = val === 'diag_value';
      localStorage.removeItem('diag_test');
      log('localStorage: ' + (passed ? 'OK' : 'FAILED'), passed ? 'pass' : 'fail');
      sendResult('localStorage', passed, passed ? 'read/write works' : 'value mismatch: ' + val);
    } catch (e) {
      log('localStorage: FAILED - ' + e.message, 'fail');
      sendResult('localStorage', false, e.message);
    }

    // Test 4: sessionStorage
    try {
      sessionStorage.setItem('diag_test', 'session_value');
      var val = sessionStorage.getItem('diag_test');
      var passed = val === 'session_value';
      sessionStorage.removeItem('diag_test');
      log('sessionStorage: ' + (passed ? 'OK' : 'FAILED'), passed ? 'pass' : 'fail');
      sendResult('sessionStorage', passed, passed ? 'read/write works' : 'value mismatch: ' + val);
    } catch (e) {
      log('sessionStorage: FAILED - ' + e.message, 'fail');
      sendResult('sessionStorage', false, e.message);
    }

    // Test 5: Timers
    var timerPassed = false;
    setTimeout(function() {
      timerPassed = true;
      log('setTimeout: OK', 'pass');
      sendResult('setTimeout', true, 'Fired after delay');
    }, 100);
    setTimeout(function() {
      if (!timerPassed) {
        log('setTimeout: FAILED - did not fire', 'fail');
        sendResult('setTimeout', false, 'Timer did not fire within 500ms');
      }
    }, 500);

    // Test 6: Promises
    new Promise(function(resolve) {
      resolve('promise_value');
    }).then(function(val) {
      var passed = val === 'promise_value';
      log('Promise: ' + (passed ? 'OK' : 'FAILED'), passed ? 'pass' : 'fail');
      sendResult('promise', passed, passed ? 'Promise resolved correctly' : 'value: ' + val);
    }).catch(function(e) {
      log('Promise: FAILED - ' + e.message, 'fail');
      sendResult('promise', false, e.message);
    });

    // Test 7: Fetch API
    fetch('https://httpbin.org/get')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        log('Fetch API: OK (status from httpbin)', 'pass');
        sendResult('fetch_api', true, 'Network request succeeded');
      })
      .catch(function(e) {
        log('Fetch API: FAILED - ' + e.message, 'fail');
        sendResult('fetch_api', false, e.message);
      });

    // Test 8: CSS/rendering
    try {
      var styled = document.createElement('div');
      styled.style.width = '10px';
      styled.style.height = '10px';
      styled.style.backgroundColor = 'red';
      document.body.appendChild(styled);
      var computed = window.getComputedStyle(styled);
      var passed = computed.backgroundColor !== '' && computed.width === '10px';
      log('CSS rendering: ' + (passed ? 'OK' : 'FAILED'), passed ? 'pass' : 'fail');
      sendResult('css_rendering', passed, passed ? 'getComputedStyle works' : 'Style not applied');
      document.body.removeChild(styled);
    } catch (e) {
      log('CSS rendering: FAILED - ' + e.message, 'fail');
      sendResult('css_rendering', false, e.message);
    }

    // Test 9: Canvas
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 10; canvas.height = 10;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 10, 10);
      var pixel = ctx.getImageData(5, 5, 1, 1).data;
      var passed = pixel[0] === 255 && pixel[1] === 0 && pixel[2] === 0;
      log('Canvas 2D: ' + (passed ? 'OK' : 'FAILED'), passed ? 'pass' : 'fail');
      sendResult('canvas_2d', passed, passed ? 'Canvas rendering works' : 'Pixel data mismatch');
    } catch (e) {
      log('Canvas 2D: FAILED - ' + e.message, 'fail');
      sendResult('canvas_2d', false, e.message);
    }

    // Test 10: navigator/window properties
    try {
      var ua = navigator.userAgent;
      var hasCookie = typeof document.cookie !== 'undefined';
      var hasHistory = typeof window.history !== 'undefined';
      var passed = ua && ua.length > 0 && hasCookie && hasHistory;
      log('Browser APIs: ' + (passed ? 'OK' : 'FAILED') + ' (UA: ' + ua.substring(0, 50) + '...)', passed ? 'pass' : 'fail');
      sendResult('browser_apis', passed, 'UA=' + ua.substring(0, 80));
    } catch (e) {
      log('Browser APIs: FAILED - ' + e.message, 'fail');
      sendResult('browser_apis', false, e.message);
    }

    // Test 11: Large message roundtrip
    try {
      var large = 'X'.repeat(50000);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'large_roundtrip',
        size: large.length,
        payload: large
      }));
      log('Large message (50KB): sent', 'info');
    } catch (e) {
      log('Large message: FAILED - ' + e.message, 'fail');
      sendResult('large_message', false, e.message);
    }

    // Listen for messages from RN to test bidirectional bridge
    document.addEventListener('message', function(e) {
      if (e.data === '__BRIDGE_ROUNDTRIP_CHECK__') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'roundtrip_response',
          timestamp: Date.now()
        }));
        log('Roundtrip response: sent back to RN', 'pass');
      }
    });
    window.addEventListener('message', function(e) {
      if (e.data === '__BRIDGE_ROUNDTRIP_CHECK__') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'roundtrip_response',
          timestamp: Date.now()
        }));
        log('Roundtrip response: sent back to RN', 'pass');
      }
    });

    // Signal all initial tests dispatched
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'initial_tests_done' }));
  </script>
</body>
</html>
`;

const INJECTED_JS_BEFORE = `
  (function() {
    window.__DIAGNOSTIC_BEFORE_LOAD = true;
    window.__DIAGNOSTIC_BEFORE_TIMESTAMP = Date.now();
    true;
  })();
`;

const INJECTED_JS_AFTER = `
  (function() {
    window.__DIAGNOSTIC_AFTER_LOAD = true;
    var beforeOk = !!window.__DIAGNOSTIC_BEFORE_LOAD;
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'test_result',
      test: 'injectedJS_before_content_loaded',
      passed: beforeOk,
      detail: beforeOk
        ? 'injectedJavaScriptBeforeContentLoaded ran before page content'
        : 'injectedJavaScriptBeforeContentLoaded did NOT run'
    }));
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'test_result',
      test: 'injectedJS_after_load',
      passed: true,
      detail: 'injectedJavaScript ran after page load'
    }));
    true;
  })();
`;

export const WebViewDiagnosticPocScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [tests, setTests] = useState<Record<string, TestResult>>({});
  const [navEvents, setNavEvents] = useState<string[]>([]);
  const [phase, setPhase] = useState<'html_tests' | 'navigation_tests' | 'done'>('html_tests');
  const [webViewKey, setWebViewKey] = useState(0);
  const roundtripStartRef = useRef<number>(0);
  const navTestPhaseRef = useRef(0);

  const updateTest = useCallback(
    (name: string, status: TestResult['status'], detail?: string, duration?: number) => {
      setTests((prev) => ({
        ...prev,
        [name]: { name, status, detail, duration },
      }));
    },
    [],
  );

  const addNavEvent = useCallback((msg: string) => {
    setNavEvents((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-30));
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const { data } = event.nativeEvent;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'test_result') {
          updateTest(parsed.test, parsed.passed ? 'pass' : 'fail', parsed.detail);
        } else if (parsed.type === 'bridge_check') {
          updateTest('event_dispatch', 'pass', 'onMessage event dispatched to RN successfully');
        } else if (parsed.type === 'large_roundtrip') {
          const sizeOk = parsed.size === 50000;
          const payloadOk = parsed.payload && parsed.payload.length === 50000;
          updateTest(
            'large_message',
            sizeOk && payloadOk ? 'pass' : 'fail',
            `Received ${parsed.payload?.length ?? 0} chars (expected 50000)`,
          );
        } else if (parsed.type === 'roundtrip_response') {
          const elapsed = Date.now() - roundtripStartRef.current;
          updateTest(
            'bidirectional_bridge',
            true ? 'pass' : 'fail',
            `Round-trip completed in ${elapsed}ms`,
            elapsed,
          );
        } else if (parsed.type === 'initial_tests_done') {
          setTimeout(() => {
            roundtripStartRef.current = Date.now();
            webViewRef.current?.postMessage('__BRIDGE_ROUNDTRIP_CHECK__');
            updateTest('bidirectional_bridge', 'running', 'Waiting for round-trip response...');
          }, 200);
        }
      } catch {
        updateTest('event_dispatch', 'pass', `Raw string message received: ${data.slice(0, 50)}`);
      }
    },
    [updateTest],
  );

  const handleLoadStart = useCallback(
    (event: { nativeEvent: WebViewNativeEvent }) => {
      addNavEvent(`onLoadStart: ${event.nativeEvent.url.slice(0, 60)}`);
      if (phase === 'navigation_tests') {
        updateTest('onLoadStart', 'pass', 'Fired with url: ' + event.nativeEvent.url.slice(0, 60));
      }
    },
    [addNavEvent, phase, updateTest],
  );

  const handleLoad = useCallback(
    (event: { nativeEvent: WebViewNativeEvent }) => {
      addNavEvent(`onLoad: ${event.nativeEvent.url.slice(0, 60)}`);
      if (phase === 'navigation_tests') {
        updateTest('onLoad', 'pass', 'Fired with title: ' + event.nativeEvent.title);
      }
    },
    [addNavEvent, phase, updateTest],
  );

  const handleLoadEnd = useCallback(
    (event: { nativeEvent: WebViewNativeEvent }) => {
      addNavEvent(`onLoadEnd: loading=${event.nativeEvent.loading}`);
      if (phase === 'navigation_tests') {
        updateTest('onLoadEnd', 'pass', 'Loading finished: ' + event.nativeEvent.url.slice(0, 60));
        if (navTestPhaseRef.current === 0) {
          navTestPhaseRef.current = 1;
          setTimeout(() => {
            updateTest('goBack', 'running', 'Testing goBack...');
            webViewRef.current?.goBack();
          }, 500);
        }
      }
    },
    [addNavEvent, phase, updateTest],
  );

  const handleError = useCallback(
    (event: WebViewErrorEvent) => {
      addNavEvent(`onError: ${event.nativeEvent.description}`);
      if (phase === 'navigation_tests') {
        updateTest('onError', 'pass', 'Error callback fired: ' + event.nativeEvent.description);
      }
    },
    [addNavEvent, phase, updateTest],
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      addNavEvent(
        `navStateChange: url=${navState.url.slice(0, 40)}, back=${navState.canGoBack}, fwd=${navState.canGoForward}`,
      );
      if (phase === 'navigation_tests') {
        updateTest(
          'onNavigationStateChange',
          'pass',
          `url=${navState.url.slice(0, 50)}, canGoBack=${navState.canGoBack}`,
        );
      }
    },
    [addNavEvent, phase, updateTest],
  );

  const handleShouldStartLoadWithRequest = useCallback(
    (request: WebViewNavigation): boolean => {
      addNavEvent(`shouldStartLoad: ${request.url.slice(0, 60)}`);
      if (phase === 'navigation_tests') {
        updateTest(
          'onShouldStartLoadWithRequest',
          'pass',
          'Callback invoked for: ' + request.url.slice(0, 50),
        );
      }
      return true;
    },
    [addNavEvent, phase, updateTest],
  );

  const runNavigationTests = () => {
    setPhase('navigation_tests');
    navTestPhaseRef.current = 0;
    updateTest('onLoadStart', 'running');
    updateTest('onLoad', 'running');
    updateTest('onLoadEnd', 'running');
    updateTest('onNavigationStateChange', 'running');
    updateTest('onShouldStartLoadWithRequest', 'running');
    setWebViewKey((p) => p + 1);
  };

  const runInjectJSTest = () => {
    updateTest('injectJavaScript', 'running');
    webViewRef.current?.injectJavaScript(
      'window.ReactNativeWebView.postMessage(JSON.stringify({ type: "test_result", test: "injectJavaScript", passed: true, detail: "JS injected from RN and response received" })); true;',
    );
  };

  const resetTests = () => {
    setTests({});
    setNavEvents([]);
    setPhase('html_tests');
    setWebViewKey((p) => p + 1);
  };

  const testList = Object.values(tests);
  const passCount = testList.filter((t) => t.status === 'pass').length;
  const failCount = testList.filter((t) => t.status === 'fail').length;
  const totalCount = testList.length;

  useEffect(() => {
    updateTest('postMessage_bridge', 'running', 'Waiting for WebView...');
    updateTest('event_dispatch', 'running', 'Waiting for onMessage...');
    updateTest('dom_manipulation', 'running');
    updateTest('localStorage', 'running');
    updateTest('sessionStorage', 'running');
    updateTest('setTimeout', 'running');
    updateTest('promise', 'running');
    updateTest('fetch_api', 'running');
    updateTest('css_rendering', 'running');
    updateTest('canvas_2d', 'running');
    updateTest('browser_apis', 'running');
    updateTest('large_message', 'running');
    updateTest('injectedJS_before_content_loaded', 'running');
    updateTest('injectedJS_after_load', 'running');
  }, [updateTest, webViewKey]);

  const getSource = () => {
    if (phase === 'navigation_tests') {
      return { uri: 'https://www.example.com' };
    }
    return { html: DIAGNOSTIC_HTML };
  };

  return (
    <View style={styles.container}>
      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          Tests: {totalCount} | Pass: {passCount} | Fail: {failCount} |{' '}
          {failCount === 0 && passCount > 0
            ? 'ALL PASSING'
            : failCount > 0
              ? 'FAILURES DETECTED'
              : 'RUNNING...'}
        </Text>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          key={`diag-wv-${webViewKey}`}
          source={getSource()}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleMessage}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          injectedJavaScript={phase === 'html_tests' ? INJECTED_JS_AFTER : undefined}
          injectedJavaScriptBeforeContentLoaded={
            phase === 'html_tests' ? INJECTED_JS_BEFORE : undefined
          }
        />
      </View>

      {/* Controls */}
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.ctrlButton} onPress={runNavigationTests}>
          <Text style={styles.ctrlButtonText}>Run Nav Tests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlButton} onPress={runInjectJSTest}>
          <Text style={styles.ctrlButtonText}>Test injectJS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlButton, styles.resetButton]} onPress={resetTests}>
          <Text style={styles.ctrlButtonText}>Reset All</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        {testList.map((test) => (
          <View key={test.name} style={styles.testRow}>
            <View
              style={[
                styles.statusBadge,
                test.status === 'pass' && styles.passBadge,
                test.status === 'fail' && styles.failBadge,
                test.status === 'running' && styles.runningBadge,
              ]}>
              <Text style={styles.statusChar}>
                {test.status === 'pass'
                  ? 'P'
                  : test.status === 'fail'
                    ? 'F'
                    : test.status === 'running'
                      ? '...'
                      : '?'}
              </Text>
            </View>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{test.name}</Text>
              {test.detail ? (
                <Text style={styles.testDetail} numberOfLines={2}>
                  {test.detail}
                </Text>
              ) : null}
            </View>
          </View>
        ))}

        {navEvents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Navigation Events</Text>
            <View style={styles.logBox}>
              {navEvents.map((evt, i) => (
                <Text key={i} style={styles.logEntry}>
                  {evt}
                </Text>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  summaryBar: {
    padding: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  summaryText: {
    color: '#0f0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  webViewContainer: {
    height: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  controlBar: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 4,
  },
  ctrlButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  ctrlButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  passBadge: {
    backgroundColor: '#34C759',
  },
  failBadge: {
    backgroundColor: '#FF3B30',
  },
  runningBadge: {
    backgroundColor: '#FF9500',
  },
  statusChar: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  testDetail: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  logBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  logEntry: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
});
