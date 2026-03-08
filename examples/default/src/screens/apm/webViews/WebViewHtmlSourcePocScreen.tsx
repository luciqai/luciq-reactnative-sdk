import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';

const SIMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 16px; background: #fff; }
    h1 { color: #333; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>Simple HTML Source</h1>
  <p>This page is loaded from a raw HTML string, not a URL.</p>
  <p>Current time: <span id="time"></span></p>
  <script>
    document.getElementById('time').textContent = new Date().toLocaleString();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'simple_html_loaded' }));
  </script>
</body>
</html>
`;

const FORM_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 16px; background: #f5f5f5; }
    h2 { color: #333; margin-top: 0; }
    .form-group { margin-bottom: 12px; }
    label { display: block; font-weight: 600; margin-bottom: 4px; color: #555; }
    input, select, textarea {
      width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;
      box-sizing: border-box; font-size: 14px;
    }
    textarea { height: 80px; resize: vertical; }
    button { padding: 10px 20px; background: #007AFF; color: white; border: none;
             border-radius: 6px; font-size: 16px; cursor: pointer; width: 100%; }
    .checkbox-group { display: flex; align-items: center; gap: 8px; }
    input[type="checkbox"] { width: auto; }
    .result { background: #d4edda; padding: 8px; border-radius: 4px; margin-top: 8px; display: none; }
  </style>
</head>
<body>
  <h2>Form Test</h2>
  <div class="form-group">
    <label>Text Input</label>
    <input type="text" id="textInput" placeholder="Type here..." />
  </div>
  <div class="form-group">
    <label>Email Input</label>
    <input type="email" id="emailInput" placeholder="email@example.com" />
  </div>
  <div class="form-group">
    <label>Number Input</label>
    <input type="number" id="numberInput" placeholder="42" />
  </div>
  <div class="form-group">
    <label>Password Input</label>
    <input type="password" id="passwordInput" placeholder="secret" />
  </div>
  <div class="form-group">
    <label>Date Input</label>
    <input type="date" id="dateInput" />
  </div>
  <div class="form-group">
    <label>Color Input</label>
    <input type="color" id="colorInput" value="#007AFF" />
  </div>
  <div class="form-group">
    <label>Range Input</label>
    <input type="range" id="rangeInput" min="0" max="100" value="50" />
    <span id="rangeValue">50</span>
  </div>
  <div class="form-group">
    <label>Select Dropdown</label>
    <select id="selectInput">
      <option value="opt1">Option 1</option>
      <option value="opt2">Option 2</option>
      <option value="opt3">Option 3</option>
    </select>
  </div>
  <div class="form-group">
    <label>Textarea</label>
    <textarea id="textareaInput" placeholder="Multi-line text..."></textarea>
  </div>
  <div class="form-group checkbox-group">
    <input type="checkbox" id="checkboxInput" />
    <label for="checkboxInput">Checkbox</label>
  </div>
  <div class="form-group">
    <label>Radio Buttons</label>
    <div class="checkbox-group">
      <input type="radio" name="radio" id="radio1" value="A" checked />
      <label for="radio1">A</label>
      <input type="radio" name="radio" id="radio2" value="B" />
      <label for="radio2">B</label>
      <input type="radio" name="radio" id="radio3" value="C" />
      <label for="radio3">C</label>
    </div>
  </div>
  <button onclick="submitForm()">Submit Form</button>
  <div id="result" class="result"></div>

  <script>
    document.getElementById('rangeInput').oninput = function() {
      document.getElementById('rangeValue').textContent = this.value;
    };

    function submitForm() {
      var data = {
        type: 'form_submit',
        text: document.getElementById('textInput').value,
        email: document.getElementById('emailInput').value,
        number: document.getElementById('numberInput').value,
        password: document.getElementById('passwordInput').value,
        date: document.getElementById('dateInput').value,
        color: document.getElementById('colorInput').value,
        range: document.getElementById('rangeInput').value,
        select: document.getElementById('selectInput').value,
        textarea: document.getElementById('textareaInput').value,
        checkbox: document.getElementById('checkboxInput').checked,
        radio: document.querySelector('input[name="radio"]:checked').value
      };
      var resultDiv = document.getElementById('result');
      resultDiv.style.display = 'block';
      resultDiv.textContent = 'Form submitted: ' + JSON.stringify(data);
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'form_html_loaded' }));
  </script>
</body>
</html>
`;

const MULTIMEDIA_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 16px; background: #f5f5f5; }
    h2 { color: #333; }
    .section { background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
    canvas { border: 1px solid #ccc; display: block; margin: 8px 0; }
    img { max-width: 100%; height: auto; border-radius: 4px; }
    svg { margin: 8px 0; }
  </style>
</head>
<body>
  <h2>Multimedia & Canvas Test</h2>

  <div class="section">
    <h3>Canvas 2D</h3>
    <canvas id="canvas" width="300" height="150"></canvas>
  </div>

  <div class="section">
    <h3>SVG</h3>
    <svg width="200" height="100" viewBox="0 0 200 100">
      <rect x="10" y="10" width="80" height="80" fill="#007AFF" rx="8"/>
      <circle cx="150" cy="50" r="40" fill="#34C759"/>
      <line x1="10" y1="90" x2="190" y2="10" stroke="#FF3B30" stroke-width="2"/>
    </svg>
  </div>

  <div class="section">
    <h3>CSS Animations</h3>
    <div id="animBox" style="width: 50px; height: 50px; background: #007AFF; border-radius: 8px;
         animation: bounce 1s ease infinite;"></div>
    <style>
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
    </style>
  </div>

  <div class="section">
    <h3>Image Loading</h3>
    <img src="https://picsum.photos/300/200" alt="Random image" onload="imageLoaded()" onerror="imageError()" />
    <p id="imgStatus">Loading image...</p>
  </div>

  <script>
    // Draw on canvas
    var ctx = document.getElementById('canvas').getContext('2d');
    var gradient = ctx.createLinearGradient(0, 0, 300, 150);
    gradient.addColorStop(0, '#007AFF');
    gradient.addColorStop(1, '#5856D6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 150);
    ctx.fillStyle = '#fff';
    ctx.font = '20px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Canvas Works!', 150, 80);

    function imageLoaded() {
      document.getElementById('imgStatus').textContent = 'Image loaded successfully!';
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'image_loaded' }));
    }
    function imageError() {
      document.getElementById('imgStatus').textContent = 'Image failed to load';
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'image_error' }));
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'multimedia_loaded' }));
  </script>
</body>
</html>
`;

const CUSTOM_HEADERS_URL = 'https://httpbin.org/headers';

type SourceMode = 'simple_html' | 'form_html' | 'multimedia_html' | 'custom_headers' | 'custom_html';

export const WebViewHtmlSourcePocScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [sourceMode, setSourceMode] = useState<SourceMode>('simple_html');
  const [customHtml, setCustomHtml] = useState(
    '<html><body><h1>Custom HTML</h1><script>window.ReactNativeWebView.postMessage("custom loaded");</script></body></html>',
  );

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const { data } = event.nativeEvent;
      try {
        const parsed = JSON.parse(data);
        addLog(`onMessage: type=${parsed.type}, ${JSON.stringify(parsed).slice(0, 120)}`);
      } catch {
        addLog(`onMessage: ${data.slice(0, 200)}`);
      }
    },
    [addLog],
  );

  const getSource = () => {
    switch (sourceMode) {
      case 'simple_html':
        return { html: SIMPLE_HTML };
      case 'form_html':
        return { html: FORM_HTML };
      case 'multimedia_html':
        return { html: MULTIMEDIA_HTML };
      case 'custom_headers':
        return {
          uri: CUSTOM_HEADERS_URL,
          headers: {
            'X-Custom-Header': 'LuciqTestValue',
            'X-App-Version': '1.0.0',
            'X-Request-ID': `req-${Date.now()}`,
          },
        };
      case 'custom_html':
        return { html: customHtml };
      default:
        return { html: SIMPLE_HTML };
    }
  };

  const sourceButtons: { mode: SourceMode; label: string; description: string }[] = [
    { mode: 'simple_html', label: 'Simple HTML', description: 'Basic HTML string source' },
    { mode: 'form_html', label: 'Form Test', description: 'All HTML form input types' },
    { mode: 'multimedia_html', label: 'Multimedia', description: 'Canvas, SVG, CSS animations, images' },
    { mode: 'custom_headers', label: 'Custom Headers', description: 'URI with custom HTTP headers' },
    { mode: 'custom_html', label: 'Custom HTML', description: 'Enter your own HTML' },
  ];

  return (
    <View style={styles.container}>
      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          key={`html-wv-${sourceMode}`}
          source={getSource()}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleMessage}
          onLoadEnd={() => addLog(`Loaded source: ${sourceMode}`)}
          originWhitelist={['*']}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
        />
      </View>

      <ScrollView style={styles.controlsContainer}>
        {/* Source Mode Selector */}
        <Text style={styles.sectionTitle}>Source Type</Text>
        {sourceButtons.map((btn) => (
          <TouchableOpacity
            key={btn.mode}
            style={[styles.sourceButton, sourceMode === btn.mode && styles.activeSourceButton]}
            onPress={() => setSourceMode(btn.mode)}>
            <Text
              style={[
                styles.sourceButtonLabel,
                sourceMode === btn.mode && styles.activeSourceButtonText,
              ]}>
              {btn.label}
            </Text>
            <Text
              style={[
                styles.sourceButtonDesc,
                sourceMode === btn.mode && styles.activeSourceButtonText,
              ]}>
              {btn.description}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Custom HTML Editor */}
        {sourceMode === 'custom_html' && (
          <>
            <Text style={styles.sectionTitle}>Custom HTML Editor</Text>
            <TextInput
              style={styles.htmlEditor}
              value={customHtml}
              onChangeText={setCustomHtml}
              multiline
              numberOfLines={6}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.reloadButton}
              onPress={() => webViewRef.current?.reload()}>
              <Text style={styles.reloadButtonText}>Reload with Custom HTML</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Info about custom headers */}
        {sourceMode === 'custom_headers' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Custom Headers Sent:</Text>
            <Text style={styles.infoText}>X-Custom-Header: LuciqTestValue</Text>
            <Text style={styles.infoText}>X-App-Version: 1.0.0</Text>
            <Text style={styles.infoText}>X-Request-ID: req-[timestamp]</Text>
            <Text style={styles.infoNote}>
              httpbin.org/headers echoes back all received headers
            </Text>
          </View>
        )}

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
    marginTop: 12,
    marginBottom: 4,
    color: '#333',
  },
  sourceButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeSourceButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sourceButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sourceButtonDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  activeSourceButtonText: {
    color: '#fff',
  },
  htmlEditor: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#f8f8f8',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  reloadButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  reloadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  infoTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1565C0',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333',
    marginBottom: 2,
  },
  infoNote: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
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
