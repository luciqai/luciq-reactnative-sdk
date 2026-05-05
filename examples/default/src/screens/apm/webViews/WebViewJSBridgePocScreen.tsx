import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';

const HTML_PAGE = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 16px; background: #f5f5f5; }
    h2 { color: #333; }
    button { padding: 10px 16px; margin: 4px; border: none; border-radius: 6px;
             background: #007AFF; color: white; font-size: 14px; cursor: pointer; }
    button:active { opacity: 0.7; }
    .log { background: #1a1a2e; color: #0f0; padding: 8px; border-radius: 4px;
           font-family: monospace; font-size: 12px; max-height: 150px; overflow-y: auto;
           margin-top: 8px; }
    .section { background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
    input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;
            box-sizing: border-box; margin: 4px 0; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-block; }
    .success { background: #d4edda; color: #155724; }
    .info { background: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <h2>JS Bridge Test Page</h2>

  <div class="section">
    <h3>postMessage to React Native</h3>
    <input type="text" id="messageInput" placeholder="Type a message..." value="Hello from WebView!"/>
    <button onclick="sendMessage()">Send String Message</button>
    <button onclick="sendJsonMessage()">Send JSON Message</button>
    <button onclick="sendLargeMessage()">Send Large Message</button>
  </div>

  <div class="section">
    <h3>DOM Manipulation Tests</h3>
    <button onclick="createElements()">Create DOM Elements</button>
    <button onclick="modifyStyles()">Modify Styles</button>
    <button onclick="testLocalStorage()">Test localStorage</button>
    <button onclick="testSessionStorage()">Test sessionStorage</button>
    <div id="domTestArea"></div>
  </div>

  <div class="section">
    <h3>Timer & Async Tests</h3>
    <button onclick="testSetTimeout()">setTimeout</button>
    <button onclick="testSetInterval()">setInterval (3x)</button>
    <button onclick="testPromise()">Promise</button>
    <button onclick="testFetch()">Fetch API</button>
  </div>

  <div class="section">
    <h3>Messages from React Native</h3>
    <div id="rnMessages" class="log">Waiting for messages...</div>
  </div>

  <div class="section">
    <h3>JS Injection Log</h3>
    <div id="injectionLog" class="log">Waiting for injected scripts...</div>
  </div>

  <script>
    var logArea = document.getElementById('injectionLog');

    function addLog(msg) {
      logArea.innerHTML += '\\n' + new Date().toLocaleTimeString() + ': ' + msg;
      logArea.scrollTop = logArea.scrollHeight;
    }

    function sendMessage() {
      var msg = document.getElementById('messageInput').value;
      window.ReactNativeWebView.postMessage(msg);
    }

    function sendJsonMessage() {
      var json = JSON.stringify({
        type: 'json_test',
        timestamp: Date.now(),
        data: { nested: true, array: [1, 2, 3] }
      });
      window.ReactNativeWebView.postMessage(json);
    }

    function sendLargeMessage() {
      var large = 'x'.repeat(10000);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'large_message',
        size: large.length,
        payload: large
      }));
    }

    function createElements() {
      var area = document.getElementById('domTestArea');
      area.innerHTML = '';
      for (var i = 0; i < 5; i++) {
        var div = document.createElement('div');
        div.textContent = 'Dynamic element ' + (i + 1);
        div.style.padding = '4px';
        div.style.margin = '2px';
        div.style.background = '#e0e0e0';
        div.style.borderRadius = '4px';
        area.appendChild(div);
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dom_created', count: 5 }));
    }

    function modifyStyles() {
      document.body.style.background = '#' + Math.floor(Math.random()*16777215).toString(16);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'styles_modified' }));
    }

    function testLocalStorage() {
      try {
        localStorage.setItem('test_key', 'test_value_' + Date.now());
        var val = localStorage.getItem('test_key');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'localStorage_test',
          success: true,
          value: val
        }));
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'localStorage_test',
          success: false,
          error: e.message
        }));
      }
    }

    function testSessionStorage() {
      try {
        sessionStorage.setItem('test_key', 'session_value_' + Date.now());
        var val = sessionStorage.getItem('test_key');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'sessionStorage_test',
          success: true,
          value: val
        }));
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'sessionStorage_test',
          success: false,
          error: e.message
        }));
      }
    }

    function testSetTimeout() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'timeout_start' }));
      setTimeout(function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'timeout_fired', delay: 1000 }));
      }, 1000);
    }

    function testSetInterval() {
      var count = 0;
      var intervalId = setInterval(function() {
        count++;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'interval_tick',
          count: count
        }));
        if (count >= 3) {
          clearInterval(intervalId);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'interval_done' }));
        }
      }, 500);
    }

    function testPromise() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'promise_start' }));
      new Promise(function(resolve) {
        setTimeout(function() { resolve('resolved_value'); }, 500);
      }).then(function(val) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'promise_resolved', value: val }));
      });
    }

    function testFetch() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fetch_start' }));
      fetch('https://httpbin.org/get')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'fetch_success',
            url: data.url || 'unknown'
          }));
        })
        .catch(function(err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'fetch_error',
            error: err.message
          }));
        });
    }

    // Listen for messages from React Native
    document.addEventListener('message', function(e) {
      var msgDiv = document.getElementById('rnMessages');
      msgDiv.innerHTML += '\\nRN: ' + e.data;
      msgDiv.scrollTop = msgDiv.scrollHeight;
    });
    window.addEventListener('message', function(e) {
      var msgDiv = document.getElementById('rnMessages');
      msgDiv.innerHTML += '\\nRN: ' + e.data;
      msgDiv.scrollTop = msgDiv.scrollHeight;
    });

    // Signal page is ready
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'page_ready' }));
  </script>
</body>
</html>
`;

const INJECTED_JS_BEFORE = `
  (function() {
    var log = document.getElementById('injectionLog');
    if (log) {
      log.innerHTML += '\\n[BEFORE_LOAD] injectedJavaScriptBeforeContentLoaded executed';
    }
    window.__INJECTED_BEFORE = true;
    window.__INJECTION_TIMESTAMP = Date.now();
    true;
  })();
`;

const INJECTED_JS = `
  (function() {
    var log = document.getElementById('injectionLog');
    if (log) {
      log.innerHTML += '\\n[AFTER_LOAD] injectedJavaScript executed';
      log.innerHTML += '\\n[AFTER_LOAD] __INJECTED_BEFORE = ' + window.__INJECTED_BEFORE;
    }
    window.__INJECTED_AFTER = true;
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'injection_report',
      before: !!window.__INJECTED_BEFORE,
      after: true,
      timestamp: window.__INJECTION_TIMESTAMP
    }));
    true;
  })();
`;

export const WebViewJSBridgePocScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [jsEnabled, setJsEnabled] = useState(true);
  const [customJsInput, setCustomJsInput] = useState(
    'document.title = "Modified by RN"; window.ReactNativeWebView.postMessage("title changed");',
  );
  const [messageToSend, setMessageToSend] = useState('Hello from React Native!');

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const { data } = event.nativeEvent;
      try {
        const parsed = JSON.parse(data);
        addLog(`onMessage (JSON): type=${parsed.type}, ${JSON.stringify(parsed).slice(0, 100)}`);
      } catch {
        addLog(`onMessage (string): ${data.slice(0, 200)}`);
      }
    },
    [addLog],
  );

  const injectCustomJS = () => {
    webViewRef.current?.injectJavaScript(customJsInput + '; true;');
    addLog(`Injected JS: ${customJsInput.slice(0, 80)}...`);
  };

  const sendMessageToWebView = () => {
    webViewRef.current?.postMessage(messageToSend);
    addLog(`Sent to WebView: ${messageToSend}`);
  };

  const testInjections = [
    {
      label: 'Read Title',
      js: 'window.ReactNativeWebView.postMessage(JSON.stringify({ type: "title", value: document.title })); true;',
    },
    {
      label: 'Count Elements',
      js: 'window.ReactNativeWebView.postMessage(JSON.stringify({ type: "element_count", value: document.querySelectorAll("*").length })); true;',
    },
    {
      label: 'Get Cookies',
      js: 'window.ReactNativeWebView.postMessage(JSON.stringify({ type: "cookies", value: document.cookie || "none" })); true;',
    },
    {
      label: 'Get User Agent',
      js: 'window.ReactNativeWebView.postMessage(JSON.stringify({ type: "user_agent", value: navigator.userAgent })); true;',
    },
    {
      label: 'Change BG Color',
      js: 'document.body.style.backgroundColor = "#" + Math.floor(Math.random()*16777215).toString(16); window.ReactNativeWebView.postMessage("bg_changed"); true;',
    },
    {
      label: 'Test window.isNativeApp',
      js: 'window.ReactNativeWebView.postMessage(JSON.stringify({ type: "env_check", ReactNativeWebView: !!window.ReactNativeWebView })); true;',
    },
  ];

  return (
    <View style={styles.container}>
      {/* JS Toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>JavaScript Enabled:</Text>
        <Switch value={jsEnabled} onValueChange={setJsEnabled} />
        <Text style={styles.note}>(WebView will reload on toggle)</Text>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          key={`webview-js-${jsEnabled}`}
          source={{ html: HTML_PAGE }}
          javaScriptEnabled={jsEnabled}
          domStorageEnabled={true}
          onMessage={handleMessage}
          injectedJavaScript={INJECTED_JS}
          injectedJavaScriptBeforeContentLoaded={INJECTED_JS_BEFORE}
        />
      </View>

      {/* Controls */}
      <ScrollView style={styles.controlsContainer}>
        {/* Quick Inject Buttons */}
        <Text style={styles.sectionTitle}>Quick JS Injections</Text>
        <View style={styles.buttonRow}>
          {testInjections.map((test) => (
            <TouchableOpacity
              key={test.label}
              style={styles.smallButton}
              onPress={() => {
                webViewRef.current?.injectJavaScript(test.js);
                addLog(`Injected: ${test.label}`);
              }}>
              <Text style={styles.smallButtonText}>{test.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom JS Injection */}
        <Text style={styles.sectionTitle}>Custom JS Injection</Text>
        <TextInput
          style={styles.codeInput}
          value={customJsInput}
          onChangeText={setCustomJsInput}
          multiline
          numberOfLines={2}
          placeholder="Enter JavaScript to inject..."
        />
        <TouchableOpacity style={styles.actionButton} onPress={injectCustomJS}>
          <Text style={styles.actionButtonText}>Inject JavaScript</Text>
        </TouchableOpacity>

        {/* postMessage to WebView */}
        <Text style={styles.sectionTitle}>Send Message to WebView</Text>
        <TextInput
          style={styles.input}
          value={messageToSend}
          onChangeText={setMessageToSend}
          placeholder="Message to send..."
        />
        <TouchableOpacity style={styles.actionButton} onPress={sendMessageToWebView}>
          <Text style={styles.actionButtonText}>Send via postMessage</Text>
        </TouchableOpacity>

        {/* Event Log */}
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>Message Log ({logs.length})</Text>
          <TouchableOpacity onPress={() => setLogs([])}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.logScroll}>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  note: {
    fontSize: 11,
    color: '#888',
    marginLeft: 8,
  },
  webViewContainer: {
    height: 300,
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
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#f8f8f8',
    minHeight: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#f8f8f8',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  clearButton: {
    color: '#FF3B30',
    fontSize: 12,
  },
  logScroll: {
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    padding: 8,
    minHeight: 100,
    marginBottom: 16,
  },
  logEntry: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
});
