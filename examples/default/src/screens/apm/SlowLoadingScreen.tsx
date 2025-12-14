import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LuciqScreenLoading } from '@luciq/react-native';

/**
 * SlowLoadingScreen demonstrates slow loading detection and threshold callbacks.
 *
 * The screen loading configuration in App.tsx includes:
 * - slowLoadingThreshold: 2000ms
 * - onSlowLoading: callback when threshold is exceeded
 *
 * This screen lets you simulate different loading times to see
 * how the threshold detection works.
 */
const SlowLoadingScreen: React.FC = () => {
  const [loadDuration, setLoadDuration] = useState<number>(3000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [ttidTime, setTtidTime] = useState<number | null>(null);
  const [ttfdTime, setTtfdTime] = useState<number | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number>(Date.now());

  // Simulate slow loading
  useEffect(() => {
    setLoadStartTime(Date.now());

    const timer = setTimeout(() => {
      setData({
        message: 'Data loaded successfully!',
        loadedAt: new Date().toISOString(),
        simulatedDuration: loadDuration,
      });
      setIsLoading(false);
    }, loadDuration);

    return () => clearTimeout(timer);
  }, [loadDuration]);

  const handleReload = () => {
    setIsLoading(true);
    setData(null);
    setTtidTime(null);
    setTtfdTime(null);
    setLoadStartTime(Date.now());

    setTimeout(() => {
      setData({
        message: 'Reloaded successfully!',
        loadedAt: new Date().toISOString(),
        simulatedDuration: loadDuration,
      });
      setIsLoading(false);
    }, loadDuration);
  };

  const getLoadingStatus = () => {
    if (isLoading) {
      const elapsed = Date.now() - loadStartTime;
      if (elapsed > 2000) {
        return { text: '⚠️ Slow loading detected!', color: '#FF9500' };
      }
      return { text: '⏳ Loading...', color: '#007AFF' };
    }
    if (ttfdTime && ttfdTime > 2000) {
      return { text: '⚠️ Load time exceeded threshold', color: '#FF9500' };
    }
    return { text: '✅ Loaded within threshold', color: '#34C759' };
  };

  const status = getLoadingStatus();

  return (
    <ScrollView style={styles.container}>
      {/* TTID measurement */}
      <LuciqScreenLoading.InitialDisplay
        screenName="SlowLoadingExample"
        onMeasured={(duration) => {
          console.log(`[SlowLoadingScreen] TTID: ${duration}ms`);
          setTtidTime(duration);
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Slow Loading Simulation</Text>
        <Text style={styles.subtitle}>Test the slow loading threshold callback</Text>
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: `${status.color}20` }]}>
        <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
      </View>

      {/* Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>TTID</Text>
          <Text style={[styles.metricValue, styles.metricValueTTID]}>
            {ttidTime !== null ? `${ttidTime}ms` : '...'}
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>TTFD</Text>
          <Text
            style={[
              styles.metricValue,
              ttfdTime && ttfdTime > 2000 ? styles.metricValueWarning : styles.metricValueTTFD,
            ]}>
            {ttfdTime !== null ? `${ttfdTime}ms` : '...'}
          </Text>
        </View>
      </View>

      {/* Duration Control */}
      <View style={styles.controlContainer}>
        <Text style={styles.controlTitle}>Simulate Load Duration</Text>
        <Text style={styles.controlValue}>{loadDuration}ms</Text>
        <Slider
          style={styles.slider}
          minimumValue={500}
          maximumValue={5000}
          step={100}
          value={loadDuration}
          onValueChange={setLoadDuration}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#E0E0E0"
          disabled={isLoading}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>500ms (Fast)</Text>
          <Text style={styles.sliderLabel}>5000ms (Slow)</Text>
        </View>
        <View style={styles.thresholdIndicator}>
          <View style={styles.thresholdLine} />
          <Text style={styles.thresholdLabel}>Threshold: 2000ms</Text>
        </View>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Simulating slow load...</Text>
          <Text style={styles.loadingSubtext}>Duration: {loadDuration}ms</Text>
        </View>
      ) : (
        <>
          {/* TTFD measurement */}
          <LuciqScreenLoading.FullDisplay
            screenName="SlowLoadingExample"
            onMeasured={(duration) => {
              console.log(`[SlowLoadingScreen] TTFD: ${duration}ms`);
              setTtfdTime(duration);
            }}
          />

          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>✅ Data Loaded</Text>
            <View style={styles.dataCard}>
              <Text style={styles.dataText}>{data?.message}</Text>
              <Text style={styles.dataSubtext}>
                Simulated duration: {data?.simulatedDuration}ms
              </Text>
              <Text style={styles.dataSubtext}>Loaded at: {data?.loadedAt}</Text>
            </View>
          </View>
        </>
      )}

      {/* Reload Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleReload}
          disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : '🔄 Reload with New Duration'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About Slow Loading Detection</Text>

        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Configuration in App.tsx:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{`const screenLoadingConfig = createScreenLoadingConfig({
  slowLoadingThreshold: 2000, // 2 seconds
  onSlowLoading: (screenName, duration) => {
    console.warn(\`Slow load: \${screenName} took \${duration}ms\`);
  },
});`}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>How It Works:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• The threshold is set to 2000ms (configurable)</Text>
            <Text style={styles.bulletItem}>
              • When TTFD exceeds the threshold, onSlowLoading is called
            </Text>
            <Text style={styles.bulletItem}>
              • You can log warnings, send analytics, or alert users
            </Text>
            <Text style={styles.bulletItem}>• Check your console for slow loading warnings</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Use Cases:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>📊 Track performance regression in analytics</Text>
            <Text style={styles.bulletItem}>🚨 Alert on-call engineers for critical screens</Text>
            <Text style={styles.bulletItem}>📝 Log slow screens for debugging</Text>
            <Text style={styles.bulletItem}>🎯 Set different thresholds per screen type</Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipText}>1. Set realistic thresholds based on user expectations</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipText}>2. Different screens may need different thresholds</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipText}>
            3. Use onSlowLoading to send data to your monitoring system
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipText}>
            4. Consider showing loading states earlier for slow screens
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusBanner: {
    margin: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 15,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  metricValueTTID: {
    color: '#007AFF',
  },
  metricValueTTFD: {
    color: '#34C759',
  },
  metricValueWarning: {
    color: '#FF9500',
  },
  controlContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  controlValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  thresholdIndicator: {
    marginTop: 12,
    alignItems: 'center',
  },
  thresholdLine: {
    width: '40%',
    height: 2,
    backgroundColor: '#FF9500',
    marginBottom: 4,
  },
  thresholdLabel: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#8E8E93',
  },
  dataContainer: {
    margin: 20,
    marginTop: 10,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#34C759',
  },
  dataCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  dataText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  dataSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 11,
    color: '#D4D4D4',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  bulletList: {
    gap: 6,
  },
  bulletItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#FFF3E0',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SlowLoadingScreen;
