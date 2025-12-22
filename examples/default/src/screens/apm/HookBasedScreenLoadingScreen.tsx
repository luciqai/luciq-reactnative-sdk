import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useScreenLoading } from '@luciq/react-native';

/**
 * HookBasedScreenLoadingScreen demonstrates the useScreenLoading hook API.
 *
 * This approach provides programmatic control over when measurements are reported,
 * which is useful for:
 * - Complex loading scenarios with multiple stages
 * - Reporting custom stages during the loading process
 * - Dynamic screen name determination
 */
const HookBasedScreenLoadingScreen: React.FC = () => {
  const [loadingStage, setLoadingStage] = useState<string>('initial');
  const [userData, setUserData] = useState<any>(null);
  const [postsData, setPostsData] = useState<any>(null);
  const [commentsData, setCommentsData] = useState<any>(null);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});

  // useScreenLoading hook provides manual control over measurements
  const { reportInitialDisplay, reportStage, screenName, getElapsedTime } = useScreenLoading({
    screenName: 'HookBasedExample',
    autoStart: true, // Automatically start measurement on mount
    useDispatchTime: true, // Use navigation dispatch time as start time
  });

  // Report TTID immediately when component mounts
  useEffect(() => {
    reportInitialDisplay();
    setMeasurements((prev) => ({ ...prev, ttid: getElapsedTime() }));
  }, [reportInitialDisplay, getElapsedTime]);

  // Simulate multi-stage data loading
  useEffect(() => {
    const loadData = async () => {
      // Stage 1: Load user data
      setLoadingStage('loading_user');
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUserData({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
      });
      reportStage('user_loaded');
      setMeasurements((prev) => ({ ...prev, user_loaded: getElapsedTime() }));

      // Stage 2: Load posts
      setLoadingStage('loading_posts');
      await new Promise((resolve) => setTimeout(resolve, 600));
      setPostsData([
        { id: 1, title: 'First Post', likes: 42 },
        { id: 2, title: 'Second Post', likes: 128 },
        { id: 3, title: 'Third Post', likes: 89 },
      ]);
      reportStage('posts_loaded');
      setMeasurements((prev) => ({ ...prev, posts_loaded: getElapsedTime() }));

      // Stage 3: Load comments
      setLoadingStage('loading_comments');
      await new Promise((resolve) => setTimeout(resolve, 400));
      setCommentsData([
        { id: 1, text: 'Great post!' },
        { id: 2, text: 'Very informative' },
        { id: 3, text: 'Thanks for sharing' },
      ]);
      reportStage('comments_loaded');
      setMeasurements((prev) => ({ ...prev, comments_loaded: getElapsedTime() }));

      // All data loaded - report complete stage
      setLoadingStage('complete');
      reportStage('all_data_loaded');
      setMeasurements((prev) => ({ ...prev, all_data_loaded: getElapsedTime() }));
    };

    loadData();
  }, [reportStage, getElapsedTime]);

  const handleReload = useCallback(() => {
    // Reset state and trigger a reload
    setUserData(null);
    setPostsData(null);
    setCommentsData(null);
    setLoadingStage('initial');
    setMeasurements({});

    // Report initial display again
    reportInitialDisplay();
    setMeasurements((prev) => ({ ...prev, ttid: getElapsedTime() }));

    // Simulate reload
    const reload = async () => {
      setLoadingStage('loading_user');
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUserData({ id: 1, name: 'Jane Doe', email: 'jane@example.com' });
      reportStage('user_loaded_reload');

      setLoadingStage('loading_posts');
      await new Promise((resolve) => setTimeout(resolve, 400));
      setPostsData([{ id: 1, title: 'Reloaded Post', likes: 99 }]);

      setLoadingStage('loading_comments');
      await new Promise((resolve) => setTimeout(resolve, 300));
      setCommentsData([{ id: 1, text: 'Reloaded comment' }]);

      setLoadingStage('complete');
      reportStage('all_data_loaded_reload');
      setMeasurements((prev) => ({ ...prev, all_data_loaded_reload: getElapsedTime() }));
    };

    reload();
  }, [reportInitialDisplay, reportStage, getElapsedTime]);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'initial':
        return '⏳';
      case 'loading_user':
        return '👤';
      case 'loading_posts':
        return '📝';
      case 'loading_comments':
        return '💬';
      case 'complete':
        return '✅';
      default:
        return '•';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hook-Based Measurement</Text>
        <Text style={styles.subtitle}>Using useScreenLoading hook for programmatic control</Text>
      </View>

      {/* Current Screen Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Screen Name:</Text>
        <Text style={styles.infoValue}>{screenName}</Text>
      </View>

      {/* Loading Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Loading Progress</Text>
        <View style={styles.stageList}>
          {['initial', 'loading_user', 'loading_posts', 'loading_comments', 'complete'].map(
            (stage, index) => {
              const isComplete =
                [
                  'initial',
                  'loading_user',
                  'loading_posts',
                  'loading_comments',
                  'complete',
                ].indexOf(loadingStage) >= index;
              const isCurrent = loadingStage === stage;

              return (
                <View
                  key={stage}
                  style={[
                    styles.stageItem,
                    isComplete && styles.stageItemComplete,
                    isCurrent && styles.stageItemCurrent,
                  ]}>
                  <Text style={styles.stageIcon}>{getStageIcon(stage)}</Text>
                  <Text
                    style={[
                      styles.stageName,
                      isComplete && styles.stageNameComplete,
                      isCurrent && styles.stageNameCurrent,
                    ]}>
                    {stage.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                  {isCurrent && loadingStage !== 'complete' && (
                    <ActivityIndicator size="small" color="#007AFF" style={styles.stageLoader} />
                  )}
                </View>
              );
            },
          )}
        </View>
      </View>

      {/* Measurements Display */}
      <View style={styles.measurementsContainer}>
        <Text style={styles.measurementsTitle}>📊 Measurements</Text>
        {Object.entries(measurements).map(([key, value]) => (
          <View key={key} style={styles.measurementRow}>
            <Text style={styles.measurementLabel}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
            <Text
              style={[
                styles.measurementValue,
                key === 'ttid' && styles.measurementValueTTID,
                key.includes('all_data') && styles.measurementValueComplete,
              ]}>
              {value}ms
            </Text>
          </View>
        ))}
        {Object.keys(measurements).length === 0 && (
          <Text style={styles.noMeasurements}>Waiting for measurements...</Text>
        )}
      </View>

      {/* Loaded Data Display */}
      {userData && (
        <View style={styles.dataSection}>
          <Text style={styles.dataSectionTitle}>👤 User Data</Text>
          <View style={styles.dataCard}>
            <Text style={styles.dataText}>Name: {userData.name}</Text>
            <Text style={styles.dataText}>Email: {userData.email}</Text>
          </View>
        </View>
      )}

      {postsData && (
        <View style={styles.dataSection}>
          <Text style={styles.dataSectionTitle}>📝 Posts ({postsData.length})</Text>
          {postsData.map((post: any) => (
            <View key={post.id} style={styles.dataCard}>
              <Text style={styles.dataText}>{post.title}</Text>
              <Text style={styles.dataSubtext}>❤️ {post.likes} likes</Text>
            </View>
          ))}
        </View>
      )}

      {commentsData && (
        <View style={styles.dataSection}>
          <Text style={styles.dataSectionTitle}>💬 Comments ({commentsData.length})</Text>
          {commentsData.map((comment: any) => (
            <View key={comment.id} style={styles.dataCard}>
              <Text style={styles.dataText}>"{comment.text}"</Text>
            </View>
          ))}
        </View>
      )}

      {/* Reload Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleReload}>
          <Text style={styles.buttonText}>🔄 Reload & Remeasure</Text>
        </TouchableOpacity>
      </View>

      {/* Code Example */}
      <View style={styles.codeExample}>
        <Text style={styles.codeTitle}>Code Example</Text>
        <Text style={styles.codeText}>{`const { 
  reportInitialDisplay, 
  reportStage,
  getElapsedTime
} = useScreenLoading({
  screenName: 'MyScreen',
});

// Report TTID on mount
useEffect(() => {
  reportInitialDisplay();
}, []);

// Report stages during loading
useEffect(() => {
  fetchUser().then(() => reportStage('user_loaded'));
  fetchPosts().then(() => reportStage('posts_loaded'));
  // Report completion when all data loaded
  Promise.all([...]).then(() => 
    reportStage('all_data_loaded')
  );
}, []);`}</Text>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    margin: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  progressContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stageList: {
    gap: 8,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  stageItemComplete: {
    backgroundColor: '#E8F5E9',
  },
  stageItemCurrent: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  stageIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  stageName: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  stageNameComplete: {
    color: '#4CAF50',
  },
  stageNameCurrent: {
    color: '#007AFF',
    fontWeight: '600',
  },
  stageLoader: {
    marginLeft: 8,
  },
  measurementsContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
  },
  measurementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  measurementLabel: {
    fontSize: 14,
    color: '#333',
  },
  measurementValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'monospace',
  },
  measurementValueTTID: {
    color: '#007AFF',
  },
  measurementValueComplete: {
    color: '#34C759',
  },
  noMeasurements: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 20,
  },
  dataSection: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  dataSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  dataCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  dataText: {
    fontSize: 14,
    color: '#333',
  },
  dataSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  codeExample: {
    backgroundColor: '#1E1E1E',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CDCFE',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 12,
    color: '#D4D4D4',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default HookBasedScreenLoadingScreen;
