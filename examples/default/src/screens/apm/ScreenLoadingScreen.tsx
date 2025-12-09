import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { APM, LuciqScreenLoading } from '@luciq/react-native';

const ScreenLoadingScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [ttidDuration, setTtidDuration] = useState<number | null>(null);
  const [ttfdDuration, setTtfdDuration] = useState<number | null>(null);

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

  const handleManualMeasurement = () => {
    // Start a manual screen loading measurement
    APM.startScreenLoading('ManualMeasurementTest');

    // Simulate some work
    setTimeout(() => {
      APM.endScreenLoading('ManualMeasurementTest');
      Alert.alert('Manual Measurement', 'Screen loading measurement completed!');
    }, 500);
  };

  const handleNavigateToSlowScreen = () => {
    // This would normally navigate to another screen
    // For demo purposes, we'll just reset the current screen
    setIsLoading(true);
    setData(null);
    setTtidDuration(null);
    setTtfdDuration(null);

    // Reload data after a short delay
    setTimeout(() => {
      setIsLoading(false);
      setData({
        items: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          title: `Reloaded Item ${i + 1}`,
          description: `Reloaded description ${i + 1}`,
        })),
      });
    }, 2000);
  };

  return (
    <ScrollView style={styles.container}>
      {/* TTID - Measures when initial UI is visible */}
      <LuciqScreenLoading.InitialDisplay
        screenName="ScreenLoadingExample"
        onMeasured={(duration) => {
          console.log(`TTID: ${duration}ms`);
          setTtidDuration(duration);
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Screen Loading Example</Text>
        <Text style={styles.subtitle}>Demonstrating TTID and TTFD measurements</Text>
      </View>

      {ttidDuration && (
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Time To Initial Display (TTID)</Text>
          <Text style={styles.metricValue}>{ttidDuration}ms</Text>
        </View>
      )}

      {ttfdDuration && (
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Time To Full Display (TTFD)</Text>
          <Text style={styles.metricValue}>{ttfdDuration}ms</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Manual Measurement" onPress={handleManualMeasurement} color="#007AFF" />
        <View style={styles.buttonSpacer} />
        <Button
          title="Navigate to Slow Screen"
          onPress={handleNavigateToSlowScreen}
          color="#34C759"
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : (
        <>
          {/* TTFD - Measures when all data is loaded */}
          <LuciqScreenLoading.FullDisplay
            screenName="ScreenLoadingExample"
            record={!isLoading}
            onMeasured={(duration) => {
              console.log(`TTFD: ${duration}ms`);
              setTtfdDuration(duration);
            }}
          />

          <View style={styles.dataContainer}>
            <Text style={styles.sectionTitle}>Loaded Data ({data?.items.length} items)</Text>
            {data?.items.slice(0, 10).map((item: any) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
            ))}
            <Text style={styles.moreText}>... and {data?.items.length - 10} more items</Text>
          </View>
        </>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How Screen Loading Works:</Text>
        <Text style={styles.infoText}>
          • TTID (Time To Initial Display): Measures when the initial UI becomes visible
        </Text>
        <Text style={styles.infoText}>
          • TTFD (Time To Full Display): Measures when all content is loaded and displayed
        </Text>
        <Text style={styles.infoText}>
          • Automatic measurement via React Navigation integration
        </Text>
        <Text style={styles.infoText}>
          • Manual measurement using APM.startScreenLoading() and APM.endScreenLoading()
        </Text>
      </View>
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
  metricCard: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricTitle: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonSpacer: {
    width: 10,
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#8E8E93',
  },
  dataContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  item: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
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
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  infoText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 6,
  },
});

export default ScreenLoadingScreen;
