import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LuciqScreenLoading } from '@luciq/react-native';
import { Screen } from '../../components/Screen';
import { ScreenLoadingManager } from '../../../../../src/modules/apm/ScreenLoadingManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

// Test Result Component
interface TestResultProps {
  name: string;
  description: string;
  ttid: number | null;
  status: 'pending' | 'passed' | 'failed' | 'running';
  expectedBehavior?: string;
}

const TestResult: React.FC<TestResultProps> = ({
  name,
  description,
  ttid,
  status,
  expectedBehavior,
}) => {
  const statusColors = {
    pending: '#9E9E9E',
    running: '#2196F3',
    passed: '#4CAF50',
    failed: '#F44336',
  };

  const statusIcons = {
    pending: '○',
    running: '◐',
    passed: '✓',
    failed: '✗',
  };

  return (
    <View style={styles.testResult}>
      <View style={styles.testHeader}>
        <Text style={[styles.statusIcon, { color: statusColors[status] }]}>
          {statusIcons[status]}
        </Text>
        <Text style={styles.testName}>{name}</Text>
      </View>
      <Text style={styles.testDescription}>{description}</Text>
      {expectedBehavior && (
        <Text style={styles.expectedBehavior}>Expected: {expectedBehavior}</Text>
      )}
      {ttid !== null && <Text style={styles.ttidValue}>TTID: {ttid.toFixed(2)}ms</Text>}
    </View>
  );
};

// Segmented Control Component
interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedIndex,
  onChange,
}) => {
  return (
    <View style={styles.segmentedControl}>
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={segment}
          style={[styles.segment, selectedIndex === index && styles.segmentSelected]}
          onPress={() => onChange(index)}>
          <Text style={[styles.segmentText, selectedIndex === index && styles.segmentTextSelected]}>
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Action Button Component
interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, onPress, variant = 'primary' }) => {
  return (
    <TouchableOpacity
      style={[styles.actionButton, variant === 'secondary' && styles.actionButtonSecondary]}
      onPress={onPress}>
      <Text
        style={[
          styles.actionButtonText,
          variant === 'secondary' && styles.actionButtonTextSecondary,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// TEST SECTIONS
// ============================================================================

// 1. Basic Tests Section
const BasicTestsSection: React.FC = () => {
  const [simpleTestTtid, setSimpleTestTtid] = useState<number | null>(null);
  const [simpleTestStatus, setSimpleTestStatus] = useState<
    'pending' | 'passed' | 'failed' | 'running'
  >('pending');
  const [showSimpleTest, setShowSimpleTest] = useState(false);

  const [recordFalseStatus, setRecordFalseStatus] = useState<
    'pending' | 'passed' | 'failed' | 'running'
  >('pending');
  const [recordFalseCalled, setRecordFalseCalled] = useState(false);
  const [showRecordFalse, setShowRecordFalse] = useState(false);

  const [propsTestTtid, setPropsTestTtid] = useState<number | null>(null);
  const [propsTestStatus, setPropsTestStatus] = useState<
    'pending' | 'passed' | 'failed' | 'running'
  >('pending');
  const [onLayoutCalled, setOnLayoutCalled] = useState(false);
  const [showPropsTest, setShowPropsTest] = useState(false);

  const resetTests = () => {
    setSimpleTestTtid(null);
    setSimpleTestStatus('pending');
    setShowSimpleTest(false);
    setRecordFalseStatus('pending');
    setRecordFalseCalled(false);
    setShowRecordFalse(false);
    setPropsTestTtid(null);
    setPropsTestStatus('pending');
    setOnLayoutCalled(false);
    setShowPropsTest(false);
  };

  return (
    <ScrollView style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Basic Tests</Text>
      <Text style={styles.sectionDescription}>
        Test fundamental LuciqScreenLoading functionality
      </Text>

      {/* Test 1: Simple Measurement */}
      <TestResult
        name="Simple Measurement"
        description="Basic screen loading measurement"
        ttid={simpleTestTtid}
        status={simpleTestStatus}
        expectedBehavior="TTID callback should fire"
      />
      {!showSimpleTest ? (
        <ActionButton
          title="Run Simple Test"
          onPress={() => {
            setSimpleTestStatus('running');
            setShowSimpleTest(true);
          }}
        />
      ) : (
        <LuciqScreenLoading
          screenName="SimpleTest"
          onMeasured={(ttid) => {
            console.log('[BasicTest] Simple measurement TTID:', ttid);
            setSimpleTestTtid(ttid);
            setSimpleTestStatus('passed');
          }}
          style={styles.testComponent}>
          <Text style={styles.componentText}>Simple Test Component</Text>
          <Text style={styles.componentSubtext}>This component measures its load time</Text>
        </LuciqScreenLoading>
      )}

      {/* Test 2: Record=false */}
      <View style={styles.testSpacer} />
      <TestResult
        name="Record Disabled"
        description="Test record={false} prop"
        ttid={null}
        status={recordFalseStatus}
        expectedBehavior="onMeasured should NOT be called"
      />
      {!showRecordFalse ? (
        <ActionButton
          title="Run Record=false Test"
          onPress={() => {
            setRecordFalseStatus('running');
            setShowRecordFalse(true);
            // Set a timeout to check if callback was NOT called
            setTimeout(() => {
              if (!recordFalseCalled) {
                setRecordFalseStatus('passed');
              }
            }, 1000);
          }}
        />
      ) : (
        <LuciqScreenLoading
          screenName="RecordFalseTest"
          record={false}
          onMeasured={(ttid) => {
            console.log('[BasicTest] UNEXPECTED: Record=false callback fired:', ttid);
            setRecordFalseCalled(true);
            setRecordFalseStatus('failed');
          }}
          style={styles.testComponent}>
          <Text style={styles.componentText}>Record=false Component</Text>
          <Text style={styles.componentSubtext}>
            {recordFalseStatus === 'passed'
              ? '✓ onMeasured was not called (correct)'
              : recordFalseStatus === 'failed'
                ? '✗ onMeasured was called (incorrect)'
                : 'Waiting...'}
          </Text>
        </LuciqScreenLoading>
      )}

      {/* Test 3: Props Passthrough */}
      <View style={styles.testSpacer} />
      <TestResult
        name="Props Passthrough"
        description="Test style, testID, onLayout props"
        ttid={propsTestTtid}
        status={propsTestStatus}
        expectedBehavior="onLayout should be called, custom styles applied"
      />
      {!showPropsTest ? (
        <ActionButton
          title="Run Props Test"
          onPress={() => {
            setPropsTestStatus('running');
            setShowPropsTest(true);
          }}
        />
      ) : (
        <LuciqScreenLoading
          screenName="PropsTest"
          testID="props-test-component"
          style={[styles.testComponent, styles.customStyle]}
          onLayout={() => {
            console.log('[BasicTest] onLayout called');
            setOnLayoutCalled(true);
          }}
          onMeasured={(ttid) => {
            console.log('[BasicTest] Props test TTID:', ttid);
            setPropsTestTtid(ttid);
            setPropsTestStatus(onLayoutCalled ? 'passed' : 'pending');
          }}>
          <Text style={styles.componentText}>Props Passthrough Test</Text>
          <Text style={styles.componentSubtext}>testID: props-test-component</Text>
          <Text style={styles.componentSubtext}>
            onLayout: {onLayoutCalled ? '✓ Called' : 'Waiting...'}
          </Text>
          <Text style={styles.componentSubtext}>Custom border style applied</Text>
        </LuciqScreenLoading>
      )}

      <View style={styles.testSpacer} />
      <ActionButton title="Reset All Tests" onPress={resetTests} variant="secondary" />
    </ScrollView>
  );
};

// 2. Modal/Overlay Tests Section
const ModalTestsSection: React.FC = () => {
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetTtid, setBottomSheetTtid] = useState<number | null>(null);
  const [bottomSheetStatus, setBottomSheetStatus] = useState<
    'pending' | 'passed' | 'failed' | 'running'
  >('pending');

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerTtid, setDrawerTtid] = useState<number | null>(null);
  const [drawerStatus, setDrawerStatus] = useState<'pending' | 'passed' | 'failed' | 'running'>(
    'pending',
  );
  const drawerAnimation = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const [fullModalVisible, setFullModalVisible] = useState(false);
  const [fullModalTtid, setFullModalTtid] = useState<number | null>(null);
  const [fullModalStatus, setFullModalStatus] = useState<
    'pending' | 'passed' | 'failed' | 'running'
  >('pending');

  const openDrawer = () => {
    setDrawerStatus('running');
    setDrawerVisible(true);
    Animated.spring(drawerAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnimation, {
      toValue: -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDrawerVisible(false);
    });
  };

  const resetTests = () => {
    setBottomSheetTtid(null);
    setBottomSheetStatus('pending');
    setDrawerTtid(null);
    setDrawerStatus('pending');
    setFullModalTtid(null);
    setFullModalStatus('pending');
  };

  return (
    <ScrollView style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Modal & Overlay Tests</Text>
      <Text style={styles.sectionDescription}>Test LuciqScreenLoading in modal contexts</Text>

      {/* Bottom Sheet Test */}
      <TestResult
        name="Bottom Sheet"
        description="Slide-up modal overlay"
        ttid={bottomSheetTtid}
        status={bottomSheetStatus}
        expectedBehavior="TTID measured when sheet appears"
      />
      <ActionButton
        title="Open Bottom Sheet"
        onPress={() => {
          setBottomSheetStatus('running');
          setBottomSheetVisible(true);
        }}
      />

      {/* Drawer Test */}
      <View style={styles.testSpacer} />
      <TestResult
        name="Drawer Panel"
        description="Slide-in drawer from left"
        ttid={drawerTtid}
        status={drawerStatus}
        expectedBehavior="TTID measured when drawer opens"
      />
      <ActionButton title="Open Drawer" onPress={openDrawer} />

      {/* Full Screen Modal Test */}
      <View style={styles.testSpacer} />
      <TestResult
        name="Full Screen Modal"
        description="Full-screen modal overlay"
        ttid={fullModalTtid}
        status={fullModalStatus}
        expectedBehavior="TTID measured in modal context"
      />
      <ActionButton
        title="Open Full Modal"
        onPress={() => {
          setFullModalStatus('running');
          setFullModalVisible(true);
        }}
      />

      <View style={styles.testSpacer} />
      <ActionButton title="Reset All Tests" onPress={resetTests} variant="secondary" />

      {/* Bottom Sheet Modal */}
      <Modal
        visible={bottomSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBottomSheetVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setBottomSheetVisible(false)}
          />
          <LuciqScreenLoading
            screenName="BottomSheet"
            onMeasured={(ttid) => {
              console.log('[ModalTest] Bottom Sheet TTID:', ttid);
              setBottomSheetTtid(ttid);
              setBottomSheetStatus('passed');
            }}
            style={styles.bottomSheet}>
            <Text style={styles.modalTitle}>Bottom Sheet</Text>
            <Text style={styles.modalDescription}>
              This bottom sheet measures its loading time when it appears.
            </Text>
            {bottomSheetTtid && (
              <Text style={styles.ttidDisplay}>TTID: {bottomSheetTtid.toFixed(2)}ms</Text>
            )}
            <View style={styles.modalSpacer} />
            <ActionButton
              title="Close"
              onPress={() => setBottomSheetVisible(false)}
              variant="secondary"
            />
          </LuciqScreenLoading>
        </View>
      </Modal>

      {/* Drawer */}
      {drawerVisible && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.drawerBackdrop} onPress={closeDrawer} activeOpacity={1} />
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnimation }] }]}>
            <LuciqScreenLoading
              screenName="DrawerPanel"
              onMeasured={(ttid) => {
                console.log('[ModalTest] Drawer TTID:', ttid);
                setDrawerTtid(ttid);
                setDrawerStatus('passed');
              }}
              style={styles.drawerContent}>
              <Text style={styles.modalTitle}>Drawer Panel</Text>
              <Text style={styles.modalDescription}>
                This drawer measures its loading time when it slides in.
              </Text>
              {drawerTtid && (
                <Text style={styles.ttidDisplay}>TTID: {drawerTtid.toFixed(2)}ms</Text>
              )}
              <View style={styles.modalSpacer} />
              <ActionButton title="Close Drawer" onPress={closeDrawer} variant="secondary" />
            </LuciqScreenLoading>
          </Animated.View>
        </View>
      )}

      {/* Full Screen Modal */}
      <Modal
        visible={fullModalVisible}
        animationType="fade"
        onRequestClose={() => setFullModalVisible(false)}>
        <LuciqScreenLoading
          screenName="FullScreenModal"
          onMeasured={(ttid) => {
            console.log('[ModalTest] Full Modal TTID:', ttid);
            setFullModalTtid(ttid);
            setFullModalStatus('passed');
          }}
          style={styles.fullModal}>
          <Text style={styles.modalTitle}>Full Screen Modal</Text>
          <Text style={styles.modalDescription}>
            This full-screen modal measures its loading time.
          </Text>
          {fullModalTtid && (
            <Text style={styles.ttidDisplay}>TTID: {fullModalTtid.toFixed(2)}ms</Text>
          )}
          <View style={styles.modalSpacer} />
          <ActionButton
            title="Close Modal"
            onPress={() => setFullModalVisible(false)}
            variant="secondary"
          />
        </LuciqScreenLoading>
      </Modal>
    </ScrollView>
  );
};

// 3. Tab Navigation Tests Section
const TabTestsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tab1Ttid, setTab1Ttid] = useState<number | null>(null);
  const [tab2Ttid, setTab2Ttid] = useState<number | null>(null);
  const [tab3Ttid, setTab3Ttid] = useState<number | null>(null);
  const [tab1Measured, setTab1Measured] = useState(false);
  const [tab2Measured, setTab2Measured] = useState(false);
  const [tab3Measured, setTab3Measured] = useState(false);

  const resetTests = () => {
    setActiveTab(0);
    setTab1Ttid(null);
    setTab2Ttid(null);
    setTab3Ttid(null);
    setTab1Measured(false);
    setTab2Measured(false);
    setTab3Measured(false);
  };

  return (
    <ScrollView style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Tab Navigation Tests</Text>
      <Text style={styles.sectionDescription}>Test LuciqScreenLoading with tab switching</Text>

      <TestResult
        name="Tab Bar Navigation"
        description="Each tab measures independently on first render"
        ttid={null}
        status={tab1Measured && tab2Measured && tab3Measured ? 'passed' : 'pending'}
        expectedBehavior="Each tab's TTID measured once when first shown"
      />

      <View style={styles.tabStatusContainer}>
        <Text style={styles.tabStatusText}>
          Tab 1: {tab1Measured ? `✓ ${tab1Ttid?.toFixed(2)}ms` : '○ Not visited'}
        </Text>
        <Text style={styles.tabStatusText}>
          Tab 2: {tab2Measured ? `✓ ${tab2Ttid?.toFixed(2)}ms` : '○ Not visited'}
        </Text>
        <Text style={styles.tabStatusText}>
          Tab 3: {tab3Measured ? `✓ ${tab3Ttid?.toFixed(2)}ms` : '○ Not visited'}
        </Text>
      </View>

      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        {['Home', 'Profile', 'Settings'].map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}>
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 0 && (
          <LuciqScreenLoading
            screenName="TabHome"
            onMeasured={(ttid) => {
              if (!tab1Measured) {
                console.log('[TabTest] Tab 1 (Home) TTID:', ttid);
                setTab1Ttid(ttid);
                setTab1Measured(true);
              }
            }}
            style={styles.tabPanel}>
            <Text style={styles.tabPanelTitle}>Home Tab</Text>
            <Text style={styles.tabPanelText}>
              This is the Home tab content. Navigate to other tabs to measure their load times.
            </Text>
            {tab1Ttid && <Text style={styles.ttidDisplay}>TTID: {tab1Ttid.toFixed(2)}ms</Text>}
          </LuciqScreenLoading>
        )}

        {activeTab === 1 && (
          <LuciqScreenLoading
            screenName="TabProfile"
            onMeasured={(ttid) => {
              if (!tab2Measured) {
                console.log('[TabTest] Tab 2 (Profile) TTID:', ttid);
                setTab2Ttid(ttid);
                setTab2Measured(true);
              }
            }}
            style={styles.tabPanel}>
            <Text style={styles.tabPanelTitle}>Profile Tab</Text>
            <Text style={styles.tabPanelText}>
              This is the Profile tab content with user information.
            </Text>
            {tab2Ttid && <Text style={styles.ttidDisplay}>TTID: {tab2Ttid.toFixed(2)}ms</Text>}
          </LuciqScreenLoading>
        )}

        {activeTab === 2 && (
          <LuciqScreenLoading
            screenName="TabSettings"
            onMeasured={(ttid) => {
              if (!tab3Measured) {
                console.log('[TabTest] Tab 3 (Settings) TTID:', ttid);
                setTab3Ttid(ttid);
                setTab3Measured(true);
              }
            }}
            style={styles.tabPanel}>
            <Text style={styles.tabPanelTitle}>Settings Tab</Text>
            <Text style={styles.tabPanelText}>
              This is the Settings tab with configuration options.
            </Text>
            {tab3Ttid && <Text style={styles.ttidDisplay}>TTID: {tab3Ttid.toFixed(2)}ms</Text>}
          </LuciqScreenLoading>
        )}
      </View>

      <View style={styles.testSpacer} />
      <ActionButton title="Reset Tab Tests" onPress={resetTests} variant="secondary" />
    </ScrollView>
  );
};

// 4. Edge Cases Tests Section
const EdgeCasesSection: React.FC = () => {
  // Nested Components Test
  const [nestedParentTtid, setNestedParentTtid] = useState<number | null>(null);
  const [nestedChildCalled, setNestedChildCalled] = useState(false);
  const [nestedStatus, setNestedStatus] = useState<'pending' | 'passed' | 'failed' | 'running'>(
    'pending',
  );
  const [showNestedTest, setShowNestedTest] = useState(false);

  // Heavy Computation Test
  const [heavyTtid, setHeavyTtid] = useState<number | null>(null);
  const [heavyStatus, setHeavyStatus] = useState<'pending' | 'passed' | 'failed' | 'running'>(
    'pending',
  );
  const [showHeavyTest, setShowHeavyTest] = useState(false);
  const [heavyComputed, setHeavyComputed] = useState(false);

  // Quick Unmount Test
  const [unmountStatus, setUnmountStatus] = useState<'pending' | 'passed' | 'failed' | 'running'>(
    'pending',
  );
  const [unmountCalled, setUnmountCalled] = useState(false);
  const [showUnmountTest, setShowUnmountTest] = useState(false);

  // Multiple Simultaneous Test
  const [multiTtids, setMultiTtids] = useState<(number | null)[]>([null, null, null]);
  const [multiStatus, setMultiStatus] = useState<'pending' | 'passed' | 'failed' | 'running'>(
    'pending',
  );
  const [showMultiTest, setShowMultiTest] = useState(false);

  const resetTests = () => {
    setNestedParentTtid(null);
    setNestedChildCalled(false);
    setNestedStatus('pending');
    setShowNestedTest(false);
    setHeavyTtid(null);
    setHeavyStatus('pending');
    setShowHeavyTest(false);
    setHeavyComputed(false);
    setUnmountStatus('pending');
    setUnmountCalled(false);
    setShowUnmountTest(false);
    setMultiTtids([null, null, null]);
    setMultiStatus('pending');
    setShowMultiTest(false);
  };

  // Heavy computation effect
  useEffect(() => {
    if (showHeavyTest && !heavyComputed) {
      let sum = 0;
      for (let i = 0; i < 5000000; i++) {
        sum += Math.sqrt(i);
      }
      console.log('[EdgeCase] Heavy computation result:', sum);
      setHeavyComputed(true);
    }
  }, [showHeavyTest, heavyComputed]);

  // Quick unmount effect
  useEffect(() => {
    if (!showUnmountTest) {
      return;
    }
    const timer = setTimeout(() => {
      setShowUnmountTest(false);
      // If callback wasn't called, that's expected behavior for quick unmount
      setTimeout(() => {
        if (!unmountCalled) {
          setUnmountStatus('passed');
        }
      }, 100);
    }, 50); // Unmount after 50ms
    return () => clearTimeout(timer);
  }, [showUnmountTest, unmountCalled]);

  const updateMultiTtid = useCallback((index: number, ttid: number) => {
    setMultiTtids((prev) => {
      const newTtids = [...prev];
      newTtids[index] = ttid;
      // Check if all are measured
      if (newTtids.every((t) => t !== null)) {
        setMultiStatus('passed');
      }
      return newTtids;
    });
  }, []);

  return (
    <ScrollView style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Edge Cases</Text>
      <Text style={styles.sectionDescription}>Test boundary conditions and special scenarios</Text>

      {/* Nested Components Test */}
      <TestResult
        name="Nested Components"
        description="Parent wraps child LuciqScreenLoading"
        ttid={nestedParentTtid}
        status={nestedStatus}
        expectedBehavior="Only parent should measure, child ignored"
      />
      {!showNestedTest ? (
        <ActionButton
          title="Run Nested Test"
          onPress={() => {
            setNestedStatus('running');
            setShowNestedTest(true);
          }}
        />
      ) : (
        <LuciqScreenLoading
          screenName="NestedParent"
          onMeasured={(ttid) => {
            console.log('[EdgeCase] Nested Parent TTID:', ttid);
            setNestedParentTtid(ttid);
            // Give child a chance to fire, then check result
            setTimeout(() => {
              setNestedStatus(nestedChildCalled ? 'failed' : 'passed');
            }, 500);
          }}
          style={styles.testComponent}>
          <Text style={styles.componentText}>Parent Component</Text>
          <Text style={styles.componentSubtext}>Contains nested LuciqScreenLoading</Text>

          <LuciqScreenLoading
            screenName="NestedChild"
            onMeasured={(ttid) => {
              console.log('[EdgeCase] UNEXPECTED: Nested Child TTID:', ttid);
              setNestedChildCalled(true);
              setNestedStatus('failed');
            }}
            style={styles.nestedChild}>
            <Text style={styles.nestedChildText}>Nested Child</Text>
            <Text style={styles.nestedChildSubtext}>Should NOT measure</Text>
          </LuciqScreenLoading>

          <Text style={styles.nestedResult}>
            {nestedStatus === 'passed'
              ? '✓ Only parent measured (correct)'
              : nestedStatus === 'failed'
                ? '✗ Child also measured (incorrect)'
                : 'Testing...'}
          </Text>
        </LuciqScreenLoading>
      )}

      {/* Heavy Computation Test */}
      <View style={styles.testSpacer} />
      <TestResult
        name="Heavy Computation"
        description="Component with expensive calculation"
        ttid={heavyTtid}
        status={heavyStatus}
        expectedBehavior="TTID includes computation time"
      />
      {!showHeavyTest ? (
        <ActionButton
          title="Run Heavy Test"
          onPress={() => {
            setHeavyStatus('running');
            setShowHeavyTest(true);
          }}
        />
      ) : (
        <LuciqScreenLoading
          screenName="HeavyComputation"
          onMeasured={(ttid) => {
            console.log('[EdgeCase] Heavy Computation TTID:', ttid);
            setHeavyTtid(ttid);
            setHeavyStatus('passed');
          }}
          style={styles.testComponent}>
          <Text style={styles.componentText}>Heavy Computation Test</Text>
          {!heavyComputed ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.componentSubtext}>Computing...</Text>
            </View>
          ) : (
            <Text style={styles.componentSubtext}>✓ Computation complete</Text>
          )}
        </LuciqScreenLoading>
      )}

      {/* Quick Unmount Test */}
      <View style={styles.testSpacer} />
      <TestResult
        name="Quick Unmount"
        description="Component unmounts before measurement"
        ttid={null}
        status={unmountStatus}
        expectedBehavior="Graceful cleanup, no errors"
      />
      {!showUnmountTest && unmountStatus === 'pending' ? (
        <ActionButton
          title="Run Unmount Test"
          onPress={() => {
            setUnmountStatus('running');
            setShowUnmountTest(true);
          }}
        />
      ) : showUnmountTest ? (
        <LuciqScreenLoading
          screenName="QuickUnmount"
          onMeasured={(ttid) => {
            console.log('[EdgeCase] Quick Unmount TTID:', ttid);
            setUnmountCalled(true);
          }}
          style={styles.testComponent}>
          <Text style={styles.componentText}>Quick Unmount Test</Text>
          <Text style={styles.componentSubtext}>Unmounting in 50ms...</Text>
        </LuciqScreenLoading>
      ) : (
        <View style={styles.testComponent}>
          <Text style={styles.componentText}>
            {unmountStatus === 'passed' ? '✓ Unmounted cleanly' : '✗ Error occurred'}
          </Text>
        </View>
      )}

      {/* Multiple Simultaneous Test */}
      <View style={styles.testSpacer} />
      <TestResult
        name="Multiple Simultaneous"
        description="3 components measuring at once"
        ttid={null}
        status={multiStatus}
        expectedBehavior="All 3 should measure independently"
      />
      {!showMultiTest ? (
        <ActionButton
          title="Run Multi Test"
          onPress={() => {
            setMultiStatus('running');
            setShowMultiTest(true);
          }}
        />
      ) : (
        <View style={styles.multiContainer}>
          <LuciqScreenLoading
            screenName="Multi1"
            onMeasured={(ttid) => {
              console.log('[EdgeCase] Multi 1 TTID:', ttid);
              updateMultiTtid(0, ttid);
            }}
            style={styles.multiComponent}>
            <Text style={styles.multiText}>Component 1</Text>
            {multiTtids[0] && <Text style={styles.multiTtid}>{multiTtids[0].toFixed(1)}ms</Text>}
          </LuciqScreenLoading>

          <LuciqScreenLoading
            screenName="Multi2"
            onMeasured={(ttid) => {
              console.log('[EdgeCase] Multi 2 TTID:', ttid);
              updateMultiTtid(1, ttid);
            }}
            style={styles.multiComponent}>
            <Text style={styles.multiText}>Component 2</Text>
            {multiTtids[1] && <Text style={styles.multiTtid}>{multiTtids[1].toFixed(1)}ms</Text>}
          </LuciqScreenLoading>

          <LuciqScreenLoading
            screenName="Multi3"
            onMeasured={(ttid) => {
              console.log('[EdgeCase] Multi 3 TTID:', ttid);
              updateMultiTtid(2, ttid);
            }}
            style={styles.multiComponent}>
            <Text style={styles.multiText}>Component 3</Text>
            {multiTtids[2] && <Text style={styles.multiTtid}>{multiTtids[2].toFixed(1)}ms</Text>}
          </LuciqScreenLoading>
        </View>
      )}

      <View style={styles.testSpacer} />
      <ActionButton title="Reset All Tests" onPress={resetTests} variant="secondary" />
    </ScrollView>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================

export const ScreenLoadingScreen: React.FC = () => {
  const [screenLoadingEnabled, setScreenLoadingEnabled] = useState(false);
  const [selectedSection, setSelectedSection] = useState(0);

  useEffect(() => {
    setScreenLoadingEnabled(ScreenLoadingManager.isFeatureEnabled());
  }, []);

  const sections = ['Basic', 'Modals', 'Tabs', 'Edge Cases'];

  const renderSection = (): React.ReactNode => {
    switch (selectedSection) {
      case 0:
        return <BasicTestsSection />;
      case 1:
        return <ModalTestsSection />;
      case 2:
        return <TabTestsSection />;
      case 3:
        return <EdgeCasesSection />;
      default:
        return <BasicTestsSection />;
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Screen Loading Tests</Text>
        <View
          style={[
            styles.statusBadge,
            screenLoadingEnabled ? styles.statusEnabled : styles.statusDisabled,
          ]}>
          <Text style={styles.statusText}>{screenLoadingEnabled ? 'Enabled' : 'Disabled'}</Text>
        </View>
      </View>

      <SegmentedControl
        segments={sections}
        selectedIndex={selectedSection}
        onChange={setSelectedSection}
      />

      <View style={styles.contentContainer}>{renderSection()}</View>
    </Screen>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusEnabled: {
    backgroundColor: '#E8F5E9',
  },
  statusDisabled: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentSelected: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  segmentTextSelected: {
    color: '#007AFF',
  },
  contentContainer: {
    flex: 1,
  },
  sectionContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  testResult: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  testName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  testDescription: {
    fontSize: 13,
    color: '#666',
    marginLeft: 24,
  },
  expectedBehavior: {
    fontSize: 12,
    color: '#999',
    marginLeft: 24,
    marginTop: 2,
    fontStyle: 'italic',
  },
  ttidValue: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 24,
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#007AFF',
  },
  testSpacer: {
    height: 20,
  },
  testComponent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  customStyle: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  componentText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  componentSubtext: {
    fontSize: 13,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 250,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  ttidDisplay: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  modalSpacer: {
    flex: 1,
    minHeight: 20,
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerContent: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  fullModal: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    marginTop: 12,
  },
  tabPanel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 150,
  },
  tabPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tabPanelText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  tabStatusContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  tabStatusText: {
    fontSize: 13,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  nestedChild: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  nestedChildText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  nestedChildSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  nestedResult: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  multiContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  multiComponent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  multiText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  multiTtid: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
});
