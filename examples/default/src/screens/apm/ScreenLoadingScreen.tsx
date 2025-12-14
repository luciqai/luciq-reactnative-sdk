import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { APM, LuciqScreenLoading, useNavigationTiming } from '@luciq/react-native';
import type { HomeStackParamList } from '../../navigation/HomeStack';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

/**
 * ScreenLoadingScreen demonstrates the new Screen Loading APIs including:
 * - Component-based measurement with LuciqScreenLoading.InitialDisplay/FullDisplay
 * - Navigation timing context integration
 * - Custom attributes for measurements
 * - Manual measurement APIs
 */
const ScreenLoadingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [ttidDuration, setTtidDuration] = useState<number | null>(null);
  const [ttfdDuration, setTtfdDuration] = useState<number | null>(null);

  // Access navigation timing context to show timing information
  const navigationTiming = useNavigationTiming();

  useEffect(() => {
    // Simulate async data loading
    const loadData = async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Set fake data
      setData({
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          title: `Item ${i + 1}`,
          description: `This is the description for item ${i + 1}`,
        })),
      });
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleManualMeasurement = useCallback(() => {
    // Start a manual screen loading measurement
    APM.startScreenLoading('ManualMeasurementTest');

    // Simulate some work
    setTimeout(() => {
      APM.endScreenLoading('ManualMeasurementTest');
      console.log('Manual Measurement completed!');
    }, 500);
  }, []);

  const handleResetScreen = useCallback(() => {
    // Reset the screen to demonstrate re-measurement
    setIsLoading(true);
    setData(null);
    setTtidDuration(null);
    setTtfdDuration(null);

    // Reload data after a short delay
    setTimeout(() => {
      setData({
        items: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          title: `Reloaded Item ${i + 1}`,
          description: `Reloaded description ${i + 1}`,
        })),
      });
      setIsLoading(false);
    }, 2000);
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/*
       * TTID - Measures Time To Initial Display
       * Place this at the top of your screen to capture when the initial UI is visible.
       * It uses navigation dispatch time as the start time for accurate measurement.
       */}
      <LuciqScreenLoading.InitialDisplay
        screenName="ScreenLoadingExample"
        onMeasured={(duration) => {
          console.log(`TTID: ${duration}ms`);
          setTtidDuration(duration);
        }}
        attributes={{
          screen_type: 'demo',
          measurement_approach: 'component_based',
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Screen Loading Demo</Text>
        <Text style={styles.subtitle}>Demonstrating TTID and TTFD measurements</Text>
      </View>

      {/* Navigation Timing Context Display */}
      <View style={styles.contextCard}>
        <Text style={styles.contextTitle}>Navigation Timing Context</Text>
        <Text style={styles.contextText}>
          Current Screen: {navigationTiming.currentScreenName || 'N/A'}
        </Text>
        <Text style={styles.contextText}>
          Previous Screen: {navigationTiming.previousScreenName || 'N/A'}
        </Text>
        <Text style={styles.contextText}>
          Dispatch Time:{' '}
          {navigationTiming.dispatchTime ? `${navigationTiming.dispatchTime}` : 'N/A'}
        </Text>
        <Text style={styles.contextText}>
          Is Navigating: {navigationTiming.isNavigating ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Metrics Display */}
      {ttidDuration !== null && (
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Time To Initial Display (TTID)</Text>
          <Text style={styles.metricValue}>{ttidDuration}ms</Text>
          <Text style={styles.metricDescription}>
            Time from navigation dispatch to initial UI render
          </Text>
        </View>
      )}

      {ttfdDuration !== null && (
        <View style={[styles.metricCard, styles.metricCardSuccess]}>
          <Text style={styles.metricTitle}>Time To Full Display (TTFD)</Text>
          <Text style={[styles.metricValue, styles.metricValueSuccess]}>{ttfdDuration}ms</Text>
          <Text style={styles.metricDescription}>
            Time from navigation dispatch to full content load
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleManualMeasurement}>
          <Text style={styles.buttonText}>Manual Measurement</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleResetScreen}>
          <Text style={styles.buttonTextSecondary}>Reset & Remeasure</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation to Example Screens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Screen Loading Examples</Text>
        <Text style={styles.sectionDescription}>
          Explore different approaches to measure screen loading
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('HookBasedScreenLoading' as any)}>
          <View style={styles.navButtonContent}>
            <Text style={styles.navButtonTitle}>Hook-Based Measurement</Text>
            <Text style={styles.navButtonSubtitle}>Using useScreenLoading hook</Text>
          </View>
          <Text style={styles.navButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('StateBasedScreenLoading' as any)}>
          <View style={styles.navButtonContent}>
            <Text style={styles.navButtonTitle}>State-Based Measurement</Text>
            <Text style={styles.navButtonSubtitle}>Using useScreenLoadingState hook</Text>
          </View>
          <Text style={styles.navButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('HOCBasedScreenLoading' as any)}>
          <View style={styles.navButtonContent}>
            <Text style={styles.navButtonTitle}>HOC-Based Measurement</Text>
            <Text style={styles.navButtonSubtitle}>Using withScreenLoading HOC</Text>
          </View>
          <Text style={styles.navButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('SlowLoadingScreen' as any)}>
          <View style={styles.navButtonContent}>
            <Text style={styles.navButtonTitle}>Slow Loading Simulation</Text>
            <Text style={styles.navButtonSubtitle}>Test slow loading threshold callback</Text>
          </View>
          <Text style={styles.navButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Loading State / Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : (
        <>
          {/*
           * TTFD - Measures Time To Full Display
           * Place this where your screen is fully loaded (after async data loads).
           * Note: TTFD requires TTID to be measured first for the same screen.
           */}
          <LuciqScreenLoading.FullDisplay
            screenName="ScreenLoadingExample"
            onMeasured={(duration) => {
              console.log(`TTFD: ${duration}ms`);
              setTtfdDuration(duration);
            }}
            attributes={{
              items_count: String(data?.items.length || 0),
              data_source: 'simulated',
            }}
          />

          <View style={styles.dataContainer}>
            <Text style={styles.dataSectionTitle}>Loaded Data ({data?.items.length} items)</Text>
            {data?.items.slice(0, 5).map((item: any) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
            ))}
            <Text style={styles.moreText}>... and {data?.items.length - 5} more items</Text>
          </View>
        </>
      )}

      {/* Information Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How Screen Loading Works</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>TTID</Text>: Time To Initial Display - measures when the
            initial UI becomes visible to the user
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>TTFD</Text>: Time To Full Display - measures when all content
            is loaded and displayed
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>
            Measurements start from navigation dispatch time (not component mount) for accurate
            timing
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>
            Custom attributes can be attached to measurements for better analysis
          </Text>
        </View>
      </View>

      <View style={styles.apiReferenceContainer}>
        <Text style={styles.apiReferenceTitle}>API Reference</Text>

        <View style={styles.apiItem}>
          <Text style={styles.apiName}>LuciqScreenLoading.InitialDisplay</Text>
          <Text style={styles.apiDescription}>Component for measuring TTID</Text>
        </View>

        <View style={styles.apiItem}>
          <Text style={styles.apiName}>LuciqScreenLoading.FullDisplay</Text>
          <Text style={styles.apiDescription}>Component for measuring TTFD</Text>
        </View>

        <View style={styles.apiItem}>
          <Text style={styles.apiName}>useScreenLoading(options)</Text>
          <Text style={styles.apiDescription}>
            Hook for programmatic measurement with manual control
          </Text>
        </View>

        <View style={styles.apiItem}>
          <Text style={styles.apiName}>useScreenLoadingState(options)</Text>
          <Text style={styles.apiDescription}>Hook that auto-reports based on isReady state</Text>
        </View>

        <View style={styles.apiItem}>
          <Text style={styles.apiName}>withScreenLoading(Component, options)</Text>
          <Text style={styles.apiDescription}>HOC for class components or simple wrapping</Text>
        </View>

        <View style={styles.apiItem}>
          <Text style={styles.apiName}>LuciqNavigationContainer</Text>
          <Text style={styles.apiDescription}>
            Drop-in NavigationContainer with automatic tracking
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  contextCard: {
    backgroundColor: '#E8F4FD',
    margin: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  contextText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  metricCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  metricCardSuccess: {
    borderLeftColor: '#34C759',
  },
  metricTitle: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },
  metricValueSuccess: {
    color: '#34C759',
  },
  metricDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonTextSecondary: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonContent: {
    flex: 1,
  },
  navButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  navButtonSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  navButtonArrow: {
    fontSize: 20,
    color: '#8E8E93',
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#8E8E93',
    fontSize: 15,
  },
  dataContainer: {
    padding: 20,
  },
  dataSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  item: {
    backgroundColor: 'white',
    padding: 14,
    marginBottom: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  itemDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  moreText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#E5F6FF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoBullet: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
    fontWeight: 'bold',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  apiReferenceContainer: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  apiReferenceTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  apiItem: {
    marginBottom: 12,
  },
  apiName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  apiDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ScreenLoadingScreen;
