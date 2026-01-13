import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { LuciqScreenLoading, APM } from '@luciq/react-native';
import { Screen } from '../../components/Screen';
import { ListTile } from '../../components/ListTile';
import CustomGap from '../../components/CustomGap';
import { showNotification } from '../../utils/showNotification';

export const ScreenLoadingScreen: React.FC = () => {
  const [screenLoadingEnabled, setScreenLoadingEnabled] = useState(false);
  // @ts-ignore
  const [normalTtid, setNormalTtid] = useState<number | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetTtid, setBottomSheetTtid] = useState<number | null>(null);
  const [tapViewVisible, setTapViewVisible] = useState(false);
  const [tapViewTtid, setTapViewTtid] = useState<number | null>(null);
  const [nestedTestResult, setNestedTestResult] = useState<string>('');
  const [showHeavyComponent, setShowHeavyComponent] = useState(false);
  const [heavyTtid, setHeavyTtid] = useState<number | null>(null);

  useEffect(() => {
    APM.isScreenLoadingEnabled().then(setScreenLoadingEnabled);
  }, []);

  // Normal Scenario Component
  const NormalComponent = () => {
    const [componentTtid, setComponentTtid] = useState<number | null>(null);

    return (
      <LuciqScreenLoading
        screenName="NormalComponent"
        onMeasured={(ttid) => {
          console.log('[Test] Normal component TTID:', ttid, 'ms');
          setComponentTtid(ttid);
          setNormalTtid(ttid);
          showNotification('Normal Component', `TTID: ${ttid.toFixed(2)}ms`);
        }}
        style={styles.testContainer}>
        <Text style={styles.testTitle}>Normal Component Test</Text>
        <Text style={styles.testDescription}>
          This component measures its loading time normally.
        </Text>
        {componentTtid && <Text style={styles.ttidText}>TTID: {componentTtid.toFixed(2)}ms</Text>}
      </LuciqScreenLoading>
    );
  };

  // Bottom Sheet Component (Custom Navigation)
  const BottomSheet = () => {
    return (
      <Modal
        visible={bottomSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBottomSheetVisible(false)}>
        <View style={styles.modalOverlay}>
          <LuciqScreenLoading
            screenName="BottomSheet"
            onMeasured={(ttid) => {
              console.log('[Test] BottomSheet TTID:', ttid, 'ms');
              setBottomSheetTtid(ttid);
              showNotification('Bottom Sheet', `TTID: ${ttid.toFixed(2)}ms`);
            }}
            style={styles.bottomSheet}>
            <Text style={styles.testTitle}>Bottom Sheet</Text>
            <Text style={styles.testDescription}>This bottom sheet measures its loading time.</Text>
            {bottomSheetTtid && (
              <Text style={styles.ttidText}>TTID: {bottomSheetTtid.toFixed(2)}ms</Text>
            )}
            {CustomGap.smallV}
            <ListTile title="Close" onPress={() => setBottomSheetVisible(false)} />
          </LuciqScreenLoading>
        </View>
      </Modal>
    );
  };

  // Tap View Component (Custom Navigation)
  const TapView = () => {
    if (!tapViewVisible) {
      return null;
    }

    return (
      <LuciqScreenLoading
        screenName="TapView"
        onMeasured={(ttid) => {
          console.log('[Test] TapView TTID:', ttid, 'ms');
          setTapViewTtid(ttid);
          showNotification('Tap View', `TTID: ${ttid.toFixed(2)}ms`);
        }}
        style={styles.testContainer}>
        <Text style={styles.testTitle}>Tap View Component</Text>
        <Text style={styles.testDescription}>
          This component appears on tap and measures loading time.
        </Text>
        {tapViewTtid && <Text style={styles.ttidText}>TTID: {tapViewTtid.toFixed(2)}ms</Text>}
        {CustomGap.smallV}
        <ListTile title="Hide" onPress={() => setTapViewVisible(false)} />
      </LuciqScreenLoading>
    );
  };

  // Nested Component Test
  const NestedComponentTest = () => {
    const [parentMeasured, setParentMeasured] = useState(false);
    const [childMeasured, setChildMeasured] = useState(false);

    const updateNestedTestResult = (parent: boolean, child: boolean) => {
      if (parent && !child) {
        setNestedTestResult('✓ Correct: Only parent measured');
        showNotification('Nested Test', 'Passed: Only parent measured');
      } else if (parent && child) {
        setNestedTestResult('✗ Error: Both parent and child measured');
        showNotification('Nested Test', 'Failed: Both measured');
      } else if (!parent && child) {
        setNestedTestResult('✗ Error: Only child measured');
        showNotification('Nested Test', 'Failed: Only child measured');
      }
    };

    return (
      <LuciqScreenLoading
        screenName="ParentComponent"
        onMeasured={(ttid) => {
          console.log('[Test] Parent component TTID:', ttid, 'ms');
          setParentMeasured(true);
          updateNestedTestResult(true, childMeasured);
        }}
        style={styles.testContainer}>
        <Text style={styles.testTitle}>Nested Component Test</Text>
        <Text style={styles.testDescription}>Testing nested LuciqScreenLoading components</Text>

        <LuciqScreenLoading
          screenName="ChildComponent"
          onMeasured={(ttid) => {
            console.log('[Test] UNEXPECTED: Child component TTID:', ttid, 'ms');
            setChildMeasured(true);
            updateNestedTestResult(parentMeasured, true);
          }}
          style={styles.nestedChild}>
          <Text style={styles.smallText}>Nested Child (should not measure)</Text>
          <Text style={styles.smallText}>Only parent should measure TTID</Text>
        </LuciqScreenLoading>

        {parentMeasured && !childMeasured && (
          <Text style={styles.successText}>✓ Nested test passed</Text>
        )}
        {nestedTestResult && (
          <Text style={nestedTestResult.includes('✓') ? styles.successText : styles.errorText}>
            {nestedTestResult}
          </Text>
        )}
      </LuciqScreenLoading>
    );
  };

  // Heavy Computation Test
  const HeavyComponent = () => {
    const [computed, setComputed] = useState(false);

    useEffect(() => {
      // Simulate heavy computation
      // @ts-ignore
      let sum = 0;
      for (let i = 0; i < 10000000; i++) {
        // @ts-ignore
        sum += Math.sqrt(i);
      }
      setComputed(true);
    }, []);

    return (
      <LuciqScreenLoading
        screenName="HeavyComponent"
        onMeasured={(ttid) => {
          console.log('[Test] Heavy component TTID:', ttid, 'ms');
          setHeavyTtid(ttid);
          showNotification('Heavy Component', `TTID: ${ttid.toFixed(2)}ms`);
        }}
        style={styles.testContainer}>
        <Text style={styles.testTitle}>Heavy Computation Test</Text>
        <Text style={styles.testDescription}>Component with expensive computation</Text>
        {!computed && <ActivityIndicator size="small" color="#007AFF" />}
        {computed && <Text style={styles.smallText}>Computation complete</Text>}
        {heavyTtid && <Text style={styles.ttidText}>TTID: {heavyTtid.toFixed(2)}ms</Text>}
      </LuciqScreenLoading>
    );
  };

  const handleExcludeRoutes = () => {
    APM.excludeScreenLoadingRoutes(['TestRoute', 'SettingsScreen']);
    console.log('[Test] Excluded TestRoute and SettingsScreen');
    showNotification('Route Exclusion', 'TestRoute and SettingsScreen excluded');
  };

  const handleIncludeAllRoutes = () => {
    APM.includeScreenLoadingRoutes();
    console.log('[Test] Included all routes');
    showNotification('Route Inclusion', 'All routes included');
  };

  return (
    <Screen>
      <Text style={styles.header}>Screen Loading Test Suite</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Feature Status: {screenLoadingEnabled ? '✓ Enabled' : '✗ Disabled'}
        </Text>
      </View>
      {CustomGap.smallV}

      <Text style={styles.sectionTitle}>1. Normal Scenario</Text>
      <NormalComponent />
      {CustomGap.mediumV}

      <Text style={styles.sectionTitle}>2. Custom Navigation - Bottom Sheet</Text>
      <ListTile title="Open Bottom Sheet" onPress={() => setBottomSheetVisible(true)} />
      <BottomSheet />
      {CustomGap.mediumV}

      <Text style={styles.sectionTitle}>3. Custom Navigation - Tap View</Text>
      <TouchableOpacity style={styles.tapButton} onPress={() => setTapViewVisible(true)}>
        <Text style={styles.tapButtonText}>Tap to Show Component</Text>
      </TouchableOpacity>
      <TapView />
      {CustomGap.mediumV}

      <Text style={styles.sectionTitle}>4. Nested Components Test</Text>
      <NestedComponentTest />
      {CustomGap.mediumV}

      <Text style={styles.sectionTitle}>5. Heavy Computation Test</Text>
      {showHeavyComponent ? (
        <HeavyComponent />
      ) : (
        <ListTile title="Start Heavy Component Test" onPress={() => setShowHeavyComponent(true)} />
      )}
      {CustomGap.mediumV}

      <Text style={styles.sectionTitle}>6. Route Exclusion Test</Text>
      <ListTile title="Exclude TestRoute" onPress={handleExcludeRoutes} />
      <ListTile title="Include All Routes" onPress={handleIncludeAllRoutes} />
      {CustomGap.largeV}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    color: '#333',
  },
  testContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ttidText: {
    marginTop: 10,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
  },
  tapButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  tapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  nestedChild: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  smallText: {
    fontSize: 12,
    color: '#666',
  },
  successText: {
    color: '#4CAF50',
    marginTop: 10,
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#F44336',
    marginTop: 10,
    fontWeight: '600',
    fontSize: 14,
  },
});
