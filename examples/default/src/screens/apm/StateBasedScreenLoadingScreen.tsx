import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useScreenLoadingState } from '@luciq/react-native';

/**
 * StateBasedScreenLoadingScreen demonstrates the useScreenLoadingState hook.
 *
 * This is a simplified hook that:
 * - Automatically reports TTID on component mount
 * - Automatically reports TTFD when isReady becomes true
 *
 * Perfect for screens with simple loading patterns where you just need
 * to wait for data to be ready.
 */
const StateBasedScreenLoadingScreen: React.FC = () => {
  const [products, setProducts] = useState<any[] | null>(null);
  const [isError, setIsError] = useState(false);
  const [ttidTime, setTtidTime] = useState<number | null>(null);
  const [ttfdTime, setTtfdTime] = useState<number | null>(null);

  // The useScreenLoadingState hook handles measurement automatically
  // - TTID is reported when component mounts
  // - TTFD is reported when isReady becomes true
  useScreenLoadingState({
    screenName: 'StateBasedExample',
    isReady: products !== null && !isError,
    onTTID: (duration) => {
      console.log(`[StateBasedExample] TTID: ${duration}ms`);
      setTtidTime(duration);
    },
    onTTFD: (duration) => {
      console.log(`[StateBasedExample] TTFD: ${duration}ms`);
      setTtfdTime(duration);
    },
  });

  // Simulate fetching products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // Simulate product data
        const mockProducts = [
          {
            id: 1,
            name: 'Premium Headphones',
            price: 299.99,
            rating: 4.8,
            image: 'https://via.placeholder.com/100',
            description: 'High-quality wireless headphones with noise cancellation',
          },
          {
            id: 2,
            name: 'Smart Watch Pro',
            price: 449.99,
            rating: 4.6,
            image: 'https://via.placeholder.com/100',
            description: 'Advanced fitness tracking and health monitoring',
          },
          {
            id: 3,
            name: 'Portable Speaker',
            price: 149.99,
            rating: 4.5,
            image: 'https://via.placeholder.com/100',
            description: '360° sound with 20-hour battery life',
          },
          {
            id: 4,
            name: 'Wireless Earbuds',
            price: 199.99,
            rating: 4.7,
            image: 'https://via.placeholder.com/100',
            description: 'True wireless with active noise cancellation',
          },
        ];

        setProducts(mockProducts);
      } catch {
        setIsError(true);
      }
    };

    fetchProducts();
  }, []);

  const handleReload = () => {
    setProducts(null);
    setIsError(false);
    setTtidTime(null);
    setTtfdTime(null);

    // Reload products
    setTimeout(() => {
      setProducts([
        { id: 1, name: 'Reloaded Product', price: 99.99, rating: 4.9 },
        { id: 2, name: 'Another Product', price: 149.99, rating: 4.5 },
      ]);
    }, 800);
  };

  const renderProductCard = (product: any) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productImagePlaceholder}>
        <Text style={styles.productImageText}>📦</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        {product.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </Text>
        )}
        <View style={styles.productMeta}>
          <Text style={styles.productPrice}>${product.price}</Text>
          <Text style={styles.productRating}>⭐ {product.rating}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>State-Based Measurement</Text>
        <Text style={styles.subtitle}>Using useScreenLoadingState for simple loading patterns</Text>
      </View>

      {/* Measurement Display */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>TTID</Text>
          <Text style={[styles.metricValue, styles.metricValueTTID]}>
            {ttidTime !== null ? `${ttidTime}ms` : '...'}
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>TTFD</Text>
          <Text style={[styles.metricValue, styles.metricValueTTFD]}>
            {ttfdTime !== null ? `${ttfdTime}ms` : '...'}
          </Text>
        </View>
      </View>

      {/* Loading State */}
      {products === null && !isError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading products...</Text>
          <Text style={styles.loadingHint}>
            TTID has been reported. TTFD will be reported when data loads.
          </Text>
        </View>
      )}

      {/* Error State */}
      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>Failed to load products</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Products List */}
      {products && (
        <View style={styles.productsContainer}>
          <View style={styles.productsHeader}>
            <Text style={styles.productsTitle}>Products</Text>
            <Text style={styles.productsCount}>{products.length} items</Text>
          </View>

          {products.map(renderProductCard)}

          <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
            <Text style={styles.reloadButtonText}>🔄 Reload Products</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* How it Works Section */}
      <View style={styles.howItWorksContainer}>
        <Text style={styles.howItWorksTitle}>How It Works</Text>

        <View style={styles.stepItem}>
          <Text style={styles.stepNumber}>1</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Component Mounts</Text>
            <Text style={styles.stepDescription}>
              TTID is automatically reported when the component mounts
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <Text style={styles.stepNumber}>2</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Data Fetching</Text>
            <Text style={styles.stepDescription}>
              Products are fetched asynchronously while loading indicator shows
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <Text style={styles.stepNumber}>3</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>isReady Becomes True</Text>
            <Text style={styles.stepDescription}>
              When products !== null, TTFD is automatically reported
            </Text>
          </View>
        </View>
      </View>

      {/* Code Example */}
      <View style={styles.codeExample}>
        <Text style={styles.codeTitle}>Code Example</Text>
        <Text style={styles.codeText}>{`const [products, setProducts] = useState(null);

// Simple! Just pass isReady condition
useScreenLoadingState({
  screenName: 'ProductList',
  isReady: products !== null,
  onTTID: (duration) => {
    console.log(\`TTID: \${duration}ms\`);
  },
  onTTFD: (duration) => {
    console.log(\`TTFD: \${duration}ms\`);
  },
});

// Fetch data - TTFD auto-reports when done
useEffect(() => {
  fetchProducts().then(setProducts);
}, []);`}</Text>
      </View>

      {/* Benefits Section */}
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>✨ Benefits of State-Based Approach</Text>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🎯</Text>
          <Text style={styles.benefitText}>Minimal code - just provide isReady condition</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🔄</Text>
          <Text style={styles.benefitText}>Automatic TTID/TTFD measurement</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>📊</Text>
          <Text style={styles.benefitText}>Optional callbacks for custom handling</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🚀</Text>
          <Text style={styles.benefitText}>Perfect for simple loading patterns</Text>
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
  metricsRow: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 28,
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
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  loadingHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    padding: 50,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  productsContainer: {
    padding: 20,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  productsCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageText: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  productDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  productRating: {
    fontSize: 14,
    color: '#666',
  },
  reloadButton: {
    backgroundColor: '#E8F4FD',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  reloadButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  howItWorksContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  howItWorksTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
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
  benefitsContainer: {
    backgroundColor: '#E8F5E9',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default StateBasedScreenLoadingScreen;
