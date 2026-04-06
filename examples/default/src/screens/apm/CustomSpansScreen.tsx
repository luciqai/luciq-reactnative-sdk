import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { APM, CustomSpan } from '@luciq/react-native';

export const CustomSpansScreen: React.FC = () => {
  const [activeSpan, setActiveSpan] = useState<CustomSpan | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
    console.log(`[CustomSpansExample] ${message}`);
  };

  const handleStartSpan = async () => {
    if (activeSpan) {
      Alert.alert('Error', 'Please end the current span first');
      return;
    }

    addLog('Starting custom span...');
    const span = await APM.startCustomSpan('Example Span');
    if (span) {
      setActiveSpan(span);
      addLog(`Span started: "${span.getName()}"`);
    } else {
      addLog('Failed to start span (check console for details)');
    }
  };

  const handleEndSpan = async () => {
    if (!activeSpan) {
      Alert.alert('Error', 'No active span to end');
      return;
    }

    addLog('Ending custom span...');
    try {
      await activeSpan.end();
      addLog(
        `Span ended: "${activeSpan.getName()}" (duration: ${activeSpan.getDuration()?.toFixed(2)}ms)`,
      );
      setActiveSpan(null);
    } catch (error) {
      addLog(`Error ending span: ${error}`);
    }
  };

  const handleCompletedSpan = async () => {
    addLog('Recording completed span...');
    const start = new Date(Date.now() - 1500); // 1.5 seconds ago
    const end = new Date();

    try {
      await APM.addCompletedCustomSpan('Completed Example Span', start, end);
      addLog('Completed span recorded successfully');
    } catch (error) {
      addLog(`Error recording completed span: ${error}`);
    }
  };

  const handleMultipleSpans = async () => {
    addLog('Creating 5 concurrent spans...');
    const spans: CustomSpan[] = [];

    for (let i = 1; i <= 5; i++) {
      const span = await APM.startCustomSpan(`Concurrent Span ${i}`);
      if (span) {
        spans.push(span);
        addLog(`Started span ${i}/5`);
      }
    }

    addLog('Waiting 1 second...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    addLog('Ending all spans...');
    for (const span of spans) {
      await span.end();
    }
    addLog('All spans ended');
  };

  const handleLimitTest = async () => {
    addLog('Testing 100 span limit...');
    const spans: CustomSpan[] = [];

    // Create 100 spans (should succeed)
    for (let i = 1; i <= 100; i++) {
      const span = await APM.startCustomSpan(`Limit Test Span ${i}`);
      if (span) {
        spans.push(span);
      }
    }
    addLog(`Created ${spans.length} spans`);

    // Try to create 101st span (should fail)
    const extraSpan = await APM.startCustomSpan('Extra Span');
    if (extraSpan) {
      addLog('ERROR: 101st span was created (limit not enforced)');
    } else {
      addLog('✓ 101st span rejected (limit enforced correctly)');
    }

    // Clean up
    addLog('Cleaning up test spans...');
    for (const span of spans) {
      await span.end();
    }
    addLog('Test complete');
  };

  const handleValidationTest = async () => {
    addLog('Testing validation...');

    // Empty name
    const emptySpan = await APM.startCustomSpan('');
    addLog(emptySpan ? '✗ Empty name accepted' : '✓ Empty name rejected');

    // Whitespace-only name
    const whitespaceSpan = await APM.startCustomSpan('   ');
    addLog(whitespaceSpan ? '✗ Whitespace name accepted' : '✓ Whitespace name rejected');

    // Long name (>150 chars)
    const longName = 'A'.repeat(200);
    const longSpan = await APM.startCustomSpan(longName);
    if (longSpan) {
      addLog(`✓ Long name truncated to: ${longSpan.getName().length} chars`);
      await longSpan.end();
    }

    // Invalid timestamps
    const now = new Date();
    const past = new Date(now.getTime() - 1000);
    await APM.addCompletedCustomSpan('Invalid Span', now, past); // end before start
    addLog('✓ Invalid timestamps handled (check console)');

    addLog('Validation test complete');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Custom Spans Example</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Usage</Text>
        <Button
          title={activeSpan ? `Active: "${activeSpan.getName()}"` : 'Start Span'}
          onPress={handleStartSpan}
          disabled={!!activeSpan}
        />
        <Button title="End Span" onPress={handleEndSpan} disabled={!activeSpan} />
        <Button title="Record Completed Span" onPress={handleCompletedSpan} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced Tests</Text>
        <Button title="Multiple Concurrent Spans" onPress={handleMultipleSpans} />
        <Button title="Test 100 Span Limit" onPress={handleLimitTest} />
        <Button title="Test Validation" onPress={handleValidationTest} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Log</Text>
        <Button title="Clear Log" onPress={() => setLogs([])} />
        <ScrollView style={styles.logContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  logContainer: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    maxHeight: 300,
    marginTop: 8,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
});
