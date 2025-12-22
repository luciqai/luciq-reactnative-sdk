import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { withScreenLoading, type WithScreenLoadingInjectedProps } from '@luciq/react-native';

/**
 * Props for the base screen component (without injected props)
 */
interface ProfileScreenBaseProps {
  userId?: string;
}

/**
 * Full props including injected screen loading props
 */
type ProfileScreenProps = ProfileScreenBaseProps & Partial<WithScreenLoadingInjectedProps>;

/**
 * ProfileScreenComponent - The base screen component before HOC wrapping.
 *
 * This component receives screen loading utilities via props:
 * - reportStage: Function to report custom stages
 * - screenLoadingScreenName: The tracked screen name
 * - getElapsedTime: Function to get elapsed time
 */
const ProfileScreenComponent: React.FC<ProfileScreenProps> = ({
  userId = '123',
  reportStage,
  screenLoadingScreenName,
  getElapsedTime,
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingStages, setLoadingStages] = useState<Record<string, number>>({});

  // Simulate loading profile data in stages
  useEffect(() => {
    const loadProfile = async () => {
      // Stage 1: Load basic profile info
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProfile({
        id: userId,
        name: 'Sarah Johnson',
        username: '@sarahjohnson',
        bio: 'Product Designer | Coffee enthusiast | Building great experiences',
        avatar: '👩‍💼',
        verified: true,
      });
      reportStage?.('profile_loaded');
      setLoadingStages((prev) => ({
        ...prev,
        profile_loaded: getElapsedTime?.() || 0,
      }));

      // Stage 2: Load stats
      await new Promise((resolve) => setTimeout(resolve, 400));
      setStats({
        posts: 234,
        followers: '12.5K',
        following: 892,
      });
      reportStage?.('stats_loaded');
      setLoadingStages((prev) => ({
        ...prev,
        stats_loaded: getElapsedTime?.() || 0,
      }));

      // Stage 3: Load recent posts
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPosts([
        { id: 1, title: 'Designing for Accessibility', likes: 128, comments: 23 },
        { id: 2, title: 'My Design Process', likes: 256, comments: 45 },
        { id: 3, title: 'Top 10 Design Tools', likes: 512, comments: 67 },
      ]);
      reportStage?.('posts_loaded');
      setLoadingStages((prev) => ({
        ...prev,
        posts_loaded: getElapsedTime?.() || 0,
      }));

      // All data loaded - report complete stage
      reportStage?.('all_data_loaded');
      setLoadingStages((prev) => ({
        ...prev,
        all_data_loaded: getElapsedTime?.() || 0,
      }));
    };

    loadProfile();
  }, [userId, reportStage, getElapsedTime]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HOC-Based Measurement</Text>
        <Text style={styles.subtitle}>Using withScreenLoading higher-order component</Text>
      </View>

      {/* Screen Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Tracking Screen:</Text>
        <Text style={styles.infoValue}>{screenLoadingScreenName || 'N/A'}</Text>
      </View>

      {/* Loading Stages Timeline */}
      <View style={styles.timelineContainer}>
        <Text style={styles.timelineTitle}>📊 Loading Timeline</Text>
        {Object.entries(loadingStages).map(([stage, time], index) => (
          <View key={stage} style={styles.timelineItem}>
            <View
              style={[styles.timelineDot, stage === 'all_data_loaded' && styles.timelineDotSuccess]}
            />
            {index < Object.entries(loadingStages).length - 1 && (
              <View style={styles.timelineLine} />
            )}
            <View style={styles.timelineContent}>
              <Text style={styles.timelineStage}>
                {stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
              <Text
                style={[
                  styles.timelineTime,
                  stage === 'all_data_loaded' && styles.timelineTimeSuccess,
                ]}>
                {time}ms
              </Text>
            </View>
          </View>
        ))}
        {Object.keys(loadingStages).length === 0 && (
          <View style={styles.loadingTimeline}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingTimelineText}>Loading stages...</Text>
          </View>
        )}
      </View>

      {/* Profile Card */}
      {profile ? (
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.avatar}>{profile.avatar}</Text>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{profile.name}</Text>
                {profile.verified && <Text style={styles.verifiedBadge}>✓</Text>}
              </View>
              <Text style={styles.profileUsername}>{profile.username}</Text>
            </View>
          </View>
          <Text style={styles.profileBio}>{profile.bio}</Text>
        </View>
      ) : (
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          </View>
        </View>
      )}

      {/* Stats */}
      {stats ? (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      ) : (
        <View style={styles.statsContainerSkeleton}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      {/* Posts */}
      {posts.length > 0 ? (
        <View style={styles.postsContainer}>
          <Text style={styles.postsTitle}>Recent Posts</Text>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <View style={styles.postMeta}>
                <Text style={styles.postStat}>❤️ {post.likes}</Text>
                <Text style={styles.postStat}>💬 {post.comments}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.postsLoading}>
          <Text style={styles.postsLoadingText}>Loading posts...</Text>
        </View>
      )}

      {/* Code Example */}
      <View style={styles.codeExample}>
        <Text style={styles.codeTitle}>Code Example</Text>
        <Text style={styles.codeText}>{`// Define your component
const ProfileScreen = ({
  userId,
  reportStage,       // Injected by HOC
}) => {
  useEffect(() => {
    fetchProfile().then(() => {
      reportStage('profile_loaded');
    });
    
    fetchAllData().then(() => {
      reportStage('all_data_loaded');
    });
  }, []);
  
  return <Profile />;
};

// Wrap with HOC
export default withScreenLoading(
  ProfileScreen,
  {
    screenName: 'ProfileScreen',
    autoReportTTID: true,
  }
);`}</Text>
      </View>

      {/* When to Use HOC */}
      <View style={styles.useCaseContainer}>
        <Text style={styles.useCaseTitle}>When to Use withScreenLoading HOC</Text>
        <View style={styles.useCaseItem}>
          <Text style={styles.useCaseIcon}>✅</Text>
          <Text style={styles.useCaseText}>Class components that can't use hooks</Text>
        </View>
        <View style={styles.useCaseItem}>
          <Text style={styles.useCaseIcon}>✅</Text>
          <Text style={styles.useCaseText}>When you need injected props for screen loading</Text>
        </View>
        <View style={styles.useCaseItem}>
          <Text style={styles.useCaseIcon}>✅</Text>
          <Text style={styles.useCaseText}>Quick setup with automatic TTID on mount</Text>
        </View>
        <View style={styles.useCaseItem}>
          <Text style={styles.useCaseIcon}>✅</Text>
          <Text style={styles.useCaseText}>Track custom loading stages with reportStage()</Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

/**
 * Wrap the component with withScreenLoading HOC.
 *
 * Options:
 * - screenName: The name for tracking (defaults to component name)
 * - autoReportTTID: Automatically report TTID on mount (default: true)
 */
const HOCBasedScreenLoadingScreen = withScreenLoading(ProfileScreenComponent, {
  screenName: 'HOCBasedExample',
  autoReportTTID: true,
});

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
  timelineContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginRight: 12,
    marginTop: 4,
    zIndex: 1,
  },
  timelineDotSuccess: {
    backgroundColor: '#34C759',
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    width: 2,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStage: {
    fontSize: 14,
    color: '#333',
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  timelineTimeSuccess: {
    color: '#34C759',
  },
  loadingTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingTimelineText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 48,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
  },
  verifiedBadge: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  profileUsername: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  profileBio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  skeletonCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    marginRight: 16,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 7,
    marginBottom: 8,
  },
  skeletonLineShort: {
    width: '60%',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'space-around',
  },
  statsContainerSkeleton: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
  postsContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  postsTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  postCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  postMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  postStat: {
    fontSize: 13,
    color: '#8E8E93',
  },
  postsLoading: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
  },
  postsLoadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  codeExample: {
    backgroundColor: '#1E1E1E',
    margin: 20,
    marginTop: 10,
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
    fontSize: 11,
    color: '#D4D4D4',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  useCaseContainer: {
    backgroundColor: '#FFF3E0',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  useCaseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
  },
  useCaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  useCaseIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  useCaseText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default HOCBasedScreenLoadingScreen;
