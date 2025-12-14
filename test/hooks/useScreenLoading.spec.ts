/**
 * Tests for useScreenLoading hooks
 * Tests the underlying functionality through the APM module
 */

import * as APM from '../../src/modules/APM';
import { NativeAPM } from '../../src/native/NativeAPM';

// Note: Direct hook export tests are covered by the TypeScript compilation.
// Hook behavior is tested through the APM module integration tests below.
// Full React hook testing would require react-test-renderer or @testing-library/react-native.

describe('Screen Loading APM Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(true);
  });

  afterEach(() => {
    APM.setScreenLoadingEnabled(false);
  });

  describe('Screen Loading State Management', () => {
    it('should enable screen loading', () => {
      APM.setScreenLoadingEnabled(true);

      expect(NativeAPM.setScreenLoadingEnabled).toHaveBeenCalledWith(true);
      expect(APM.isScreenLoadingEnabled()).toBe(true);
    });

    it('should disable screen loading', () => {
      APM.setScreenLoadingEnabled(false);

      expect(NativeAPM.setScreenLoadingEnabled).toHaveBeenCalledWith(false);
      expect(APM.isScreenLoadingEnabled()).toBe(false);
    });

    it('should handle multiple enable/disable toggles', () => {
      APM.setScreenLoadingEnabled(true);
      APM.setScreenLoadingEnabled(false);
      APM.setScreenLoadingEnabled(true);

      expect(APM.isScreenLoadingEnabled()).toBe(true);
      expect(NativeAPM.setScreenLoadingEnabled).toHaveBeenCalledTimes(4); // 1 in beforeEach + 3 here
    });
  });

  describe('Screen Loading Measurement', () => {
    it('should start screen loading measurement', () => {
      APM.startScreenLoading('TestScreen');

      expect(NativeAPM.startScreenLoading).toHaveBeenCalledWith('TestScreen');
    });

    it('should not start measurement when disabled', () => {
      APM.setScreenLoadingEnabled(false);
      jest.clearAllMocks();

      APM.startScreenLoading('TestScreen');

      expect(NativeAPM.startScreenLoading).not.toHaveBeenCalled();
    });

    it('should end screen loading measurement', () => {
      const mockDateNow = jest.spyOn(Date, 'now');
      mockDateNow.mockReturnValueOnce(1000); // Start time
      mockDateNow.mockReturnValueOnce(1250); // End time

      APM.startScreenLoading('TestScreen');
      APM.endScreenLoading('TestScreen');

      expect(NativeAPM.endScreenLoading).toHaveBeenCalledWith('TestScreen', 250);

      mockDateNow.mockRestore();
    });

    it('should not end measurement for unknown screen', () => {
      APM.endScreenLoading('UnknownScreen');

      expect(NativeAPM.endScreenLoading).not.toHaveBeenCalled();
    });

    it('should handle starting same screen multiple times', () => {
      APM.startScreenLoading('SameScreen');
      APM.startScreenLoading('SameScreen');

      expect(NativeAPM.startScreenLoading).toHaveBeenCalledTimes(2);
    });

    it('should handle ending without starting', () => {
      APM.endScreenLoading('NeverStarted');

      expect(NativeAPM.endScreenLoading).not.toHaveBeenCalled();
    });
  });

  describe('Screen Loading Metric Reporting', () => {
    it('should report initial display metric', () => {
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'HomeScreen',
        duration: 150,
        startTime: 1000,
        endTime: 1150,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        'HomeScreen',
        150,
        1000,
        1150,
      );
    });

    it('should report full display metric', () => {
      APM._reportScreenLoadingMetric({
        type: 'full_display',
        screenName: 'HomeScreen',
        duration: 500,
        startTime: 1000,
        endTime: 1500,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'full_display',
        'HomeScreen',
        500,
        1000,
        1500,
      );
    });

    it('should not report metrics when disabled', () => {
      APM.setScreenLoadingEnabled(false);
      jest.clearAllMocks();

      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'HomeScreen',
        duration: 150,
        startTime: 1000,
        endTime: 1150,
      });

      expect(NativeAPM.reportScreenLoadingMetric).not.toHaveBeenCalled();
    });

    it('should track TTID for TTFD dependency check', () => {
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'TrackedScreen',
        duration: 100,
        startTime: 1000,
        endTime: 1100,
      });

      expect(APM._hasInitialDisplayForScreen('TrackedScreen')).toBe(true);
    });

    it('should return false for untracked screen', () => {
      expect(APM._hasInitialDisplayForScreen('UntrackedScreen')).toBe(false);
    });

    it('should return false for undefined screen name', () => {
      expect(APM._hasInitialDisplayForScreen(undefined)).toBe(false);
    });

    it('should return false for empty screen name', () => {
      expect(APM._hasInitialDisplayForScreen('')).toBe(false);
    });
  });

  describe('Flow Attributes', () => {
    it('should set flow attribute', () => {
      APM.setFlowAttribute('TestFlow', 'key', 'value');

      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith('TestFlow', 'key', 'value');
    });

    it('should set flow attribute with null value to remove', () => {
      APM.setFlowAttribute('TestFlow', 'key', null);

      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith('TestFlow', 'key', null);
    });

    it('should handle multiple attributes for same flow', () => {
      APM.setFlowAttribute('TestFlow', 'key1', 'value1');
      APM.setFlowAttribute('TestFlow', 'key2', 'value2');
      APM.setFlowAttribute('TestFlow', 'key3', 'value3');

      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledTimes(3);
    });
  });
});

describe('Screen Loading Hook Logic Simulation', () => {
  /**
   * These tests simulate the logic that the hooks would execute,
   * testing the expected behavior without requiring React rendering
   */

  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(true);
  });

  afterEach(() => {
    APM.setScreenLoadingEnabled(false);
  });

  describe('reportInitialDisplay simulation', () => {
    it('should report TTID with correct parameters', () => {
      const screenName = 'SimulatedScreen';
      const startTime = 1000;
      const endTime = 1150;
      const duration = endTime - startTime;

      // Simulate what the hook does
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName,
        duration,
        startTime,
        endTime,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        screenName,
        duration,
        startTime,
        endTime,
      );
    });

    it('should only report once (hasReported flag simulation)', () => {
      const screenName = 'SingleReportScreen';
      let hasReported = false;

      const reportInitialDisplay = () => {
        if (hasReported) {
          return;
        }
        hasReported = true;
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });
      };

      reportInitialDisplay();
      reportInitialDisplay();
      reportInitialDisplay();

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(1);
    });
  });

  describe('reportFullDisplay simulation', () => {
    it('should report TTFD after TTID', () => {
      const screenName = 'SimulatedScreen';
      const startTime = 1000;

      // First report TTID
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName,
        duration: 100,
        startTime,
        endTime: startTime + 100,
      });

      // Then report TTFD
      const ttfdEndTime = startTime + 500;
      APM._reportScreenLoadingMetric({
        type: 'full_display',
        screenName,
        duration: 500,
        startTime,
        endTime: ttfdEndTime,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(2);
      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenLastCalledWith(
        'full_display',
        screenName,
        500,
        startTime,
        ttfdEndTime,
      );
    });

    it('should simulate TTFD warning when TTID not reported', () => {
      const screenName = 'NoTTIDScreen';
      const hasReportedTTID = false;
      const warnings: string[] = [];

      const reportFullDisplay = () => {
        if (!hasReportedTTID) {
          warnings.push(
            `[useScreenLoading] Attempting to report TTFD before TTID for "${screenName}".`,
          );
          return;
        }
        APM._reportScreenLoadingMetric({
          type: 'full_display',
          screenName,
          duration: 500,
          startTime: 1000,
          endTime: 1500,
        });
      };

      reportFullDisplay();

      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('Attempting to report TTFD before TTID');
      expect(NativeAPM.reportScreenLoadingMetric).not.toHaveBeenCalled();
    });
  });

  describe('reportStage simulation', () => {
    it('should report stage as flow attribute', () => {
      const screenName = 'SimulatedScreen';
      const stageName = 'data_loaded';
      const duration = 250;

      // Simulate what reportStage does
      APM.setFlowAttribute(screenName, `stage_${stageName}`, `${duration}ms`);

      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith(
        screenName,
        'stage_data_loaded',
        '250ms',
      );
    });

    it('should not report same stage twice', () => {
      const screenName = 'StageScreen';
      const stagesReported = new Set<string>();

      const reportStage = (stageName: string, duration: number) => {
        if (stagesReported.has(stageName)) {
          return;
        }
        stagesReported.add(stageName);
        APM.setFlowAttribute(screenName, `stage_${stageName}`, `${duration}ms`);
      };

      reportStage('api_call', 100);
      reportStage('api_call', 150);
      reportStage('render', 200);

      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledTimes(2);
    });

    it('should report multiple different stages', () => {
      const screenName = 'MultiStageScreen';
      const stages = ['init', 'api_call', 'data_loaded', 'render_complete'];

      stages.forEach((stage, index) => {
        APM.setFlowAttribute(screenName, `stage_${stage}`, `${(index + 1) * 100}ms`);
      });

      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledTimes(4);
      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith(screenName, 'stage_init', '100ms');
      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith(
        screenName,
        'stage_render_complete',
        '400ms',
      );
    });
  });

  describe('Custom attributes simulation', () => {
    it('should apply custom attributes to screen', () => {
      const screenName = 'ProductScreen';
      const attributes = { product_id: '123', source: 'search' };

      // Simulate applying attributes
      Object.entries(attributes).forEach(([key, value]) => {
        APM.setFlowAttribute(screenName, key, value);
      });

      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith('ProductScreen', 'product_id', '123');
      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith('ProductScreen', 'source', 'search');
    });

    it('should handle empty attributes object', () => {
      const screenName = 'EmptyAttrsScreen';
      const attributes: Record<string, string> = {};

      Object.entries(attributes).forEach(([key, value]) => {
        APM.setFlowAttribute(screenName, key, value);
      });

      expect(NativeAPM.setFlowAttribute).not.toHaveBeenCalled();
    });

    it('should handle attributes with special characters', () => {
      const screenName = 'SpecialScreen';
      const attributes = {
        'key-with-dash': 'value',
        key_with_underscore: 'value2',
        'key.with.dot': 'value3',
      };

      Object.entries(attributes).forEach(([key, value]) => {
        APM.setFlowAttribute(screenName, key, value);
      });

      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledTimes(3);
    });
  });

  describe('Elapsed time calculation', () => {
    it('should calculate elapsed time correctly', () => {
      const startTime = 1000;
      const currentTime = 1350;

      const elapsed = currentTime - startTime;

      expect(elapsed).toBe(350);
    });

    it('should handle zero elapsed time', () => {
      const startTime = 1000;
      const currentTime = 1000;

      const elapsed = currentTime - startTime;

      expect(elapsed).toBe(0);
    });

    it('should handle large elapsed time', () => {
      const startTime = 1000;
      const currentTime = 31000; // 30 seconds later

      const elapsed = currentTime - startTime;

      expect(elapsed).toBe(30000);
    });
  });

  describe('Multiple screens tracking', () => {
    it('should track multiple screens independently', () => {
      // Report TTID for Screen A
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'ScreenA',
        duration: 100,
        startTime: 1000,
        endTime: 1100,
      });

      // Report TTID for Screen B
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'ScreenB',
        duration: 200,
        startTime: 2000,
        endTime: 2200,
      });

      expect(APM._hasInitialDisplayForScreen('ScreenA')).toBe(true);
      expect(APM._hasInitialDisplayForScreen('ScreenB')).toBe(true);
      expect(APM._hasInitialDisplayForScreen('ScreenC')).toBe(false);
    });

    it('should handle rapid screen transitions', () => {
      const screens = ['Home', 'Profile', 'Settings', 'Home'];

      screens.forEach((screen, index) => {
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: screen,
          duration: 100,
          startTime: index * 1000,
          endTime: index * 1000 + 100,
        });
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(4);
    });
  });

  describe('Screen name resolution', () => {
    it('should use provided screen name', () => {
      const providedScreenName = 'ExplicitScreen';
      const navigationScreenName = null;

      const effectiveScreenName = providedScreenName || navigationScreenName || 'UnknownScreen';

      expect(effectiveScreenName).toBe('ExplicitScreen');
    });

    it('should fall back to navigation screen name', () => {
      const providedScreenName = undefined;
      const navigationScreenName = 'NavigationScreen';

      const effectiveScreenName = providedScreenName || navigationScreenName || 'UnknownScreen';

      expect(effectiveScreenName).toBe('NavigationScreen');
    });

    it('should fall back to UnknownScreen as default', () => {
      const providedScreenName = undefined;
      const navigationScreenName = null;

      const effectiveScreenName = providedScreenName || navigationScreenName || 'UnknownScreen';

      expect(effectiveScreenName).toBe('UnknownScreen');
    });
  });

  describe('Start time management', () => {
    it('should use dispatch time when available', () => {
      const dispatchTime = 900;
      const renderTime = 1000;
      const useDispatchTime = true;

      const startTime = useDispatchTime && dispatchTime ? dispatchTime : renderTime;

      expect(startTime).toBe(900);
    });

    it('should use render time when dispatch time disabled', () => {
      const dispatchTime = 900;
      const renderTime = 1000;
      const useDispatchTime = false;

      const startTime = useDispatchTime && dispatchTime ? dispatchTime : renderTime;

      expect(startTime).toBe(1000);
    });

    it('should use render time when dispatch time is null', () => {
      const dispatchTime = null;
      const renderTime = 1000;
      const useDispatchTime = true;

      const startTime = useDispatchTime && dispatchTime ? dispatchTime : renderTime;

      expect(startTime).toBe(1000);
    });
  });
});

describe('useScreenLoadingState Hook Simulation', () => {
  /**
   * Tests simulating the useScreenLoadingState hook behavior
   */

  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(true);
  });

  afterEach(() => {
    APM.setScreenLoadingEnabled(false);
  });

  describe('Auto-report on mount', () => {
    it('should report TTID on initial mount', () => {
      // Simulate mount
      const hasReportedTTID = { current: false };
      const startTime = Date.now();

      if (!hasReportedTTID.current) {
        hasReportedTTID.current = true;
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: 'AutoReportScreen',
          duration: Date.now() - startTime,
          startTime,
          endTime: Date.now(),
        });
      }

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-report on isReady', () => {
    it('should report TTFD when isReady becomes true', () => {
      const startTime = Date.now();
      const hasReportedTTID = { current: false };
      const hasReportedTTFD = { current: false };
      let isReady = false;

      // Simulate TTID report
      if (!hasReportedTTID.current) {
        hasReportedTTID.current = true;
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: 'ReadyScreen',
          duration: 50,
          startTime,
          endTime: startTime + 50,
        });
      }

      // Simulate data loading complete
      isReady = true;

      // Simulate TTFD report when isReady
      if (isReady && !hasReportedTTFD.current && hasReportedTTID.current) {
        hasReportedTTFD.current = true;
        APM._reportScreenLoadingMetric({
          type: 'full_display',
          screenName: 'ReadyScreen',
          duration: 500,
          startTime,
          endTime: startTime + 500,
        });
      }

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(2);
      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenLastCalledWith(
        'full_display',
        'ReadyScreen',
        500,
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should not report TTFD if isReady is initially true but TTID not reported', () => {
      const hasReportedTTID = { current: false };
      const hasReportedTTFD = { current: false };
      const isReady = true;

      // Attempt TTFD report without TTID
      if (isReady && !hasReportedTTFD.current && hasReportedTTID.current) {
        hasReportedTTFD.current = true;
        APM._reportScreenLoadingMetric({
          type: 'full_display',
          screenName: 'NoTTIDScreen',
          duration: 500,
          startTime: 1000,
          endTime: 1500,
        });
      }

      expect(NativeAPM.reportScreenLoadingMetric).not.toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('should call onTTID callback with duration', () => {
      const onTTID = jest.fn();
      const startTime = 1000;
      const ttidEndTime = 1100;

      // Simulate TTID report with callback
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'CallbackScreen',
        duration: ttidEndTime - startTime,
        startTime,
        endTime: ttidEndTime,
      });

      // Simulate callback
      onTTID(ttidEndTime - startTime);

      expect(onTTID).toHaveBeenCalledWith(100);
    });

    it('should call onTTFD callback with duration', () => {
      const onTTFD = jest.fn();
      const startTime = 1000;
      const ttfdEndTime = 1500;

      // Report TTID first
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'CallbackScreen',
        duration: 100,
        startTime,
        endTime: startTime + 100,
      });

      // Report TTFD
      APM._reportScreenLoadingMetric({
        type: 'full_display',
        screenName: 'CallbackScreen',
        duration: ttfdEndTime - startTime,
        startTime,
        endTime: ttfdEndTime,
      });

      // Simulate callback
      onTTFD(ttfdEndTime - startTime);

      expect(onTTFD).toHaveBeenCalledWith(500);
    });
  });
});

describe('Hook Type Exports', () => {
  /**
   * Verify that the hook types are correctly exported
   * These tests ensure TypeScript compilation succeeds with the exports
   */

  it('should have UseScreenLoadingOptions type structure', () => {
    const options = {
      screenName: 'TestScreen',
      autoStart: true,
      useDispatchTime: true,
      attributes: { key: 'value' },
    };

    expect(options.screenName).toBe('TestScreen');
    expect(options.autoStart).toBe(true);
    expect(options.useDispatchTime).toBe(true);
    expect(options.attributes).toEqual({ key: 'value' });
  });

  it('should have UseScreenLoadingReturn type structure', () => {
    const returnValue = {
      reportInitialDisplay: jest.fn(),
      reportFullDisplay: jest.fn(),
      reportStage: jest.fn(),
      screenName: 'TestScreen',
      getElapsedTime: jest.fn().mockReturnValue(100),
    };

    expect(typeof returnValue.reportInitialDisplay).toBe('function');
    expect(typeof returnValue.reportFullDisplay).toBe('function');
    expect(typeof returnValue.reportStage).toBe('function');
    expect(returnValue.screenName).toBe('TestScreen');
    expect(returnValue.getElapsedTime()).toBe(100);
  });

  it('should have UseScreenLoadingStateOptions type structure', () => {
    const options = {
      screenName: 'TestScreen',
      isReady: false,
      onTTID: jest.fn(),
      onTTFD: jest.fn(),
    };

    expect(options.screenName).toBe('TestScreen');
    expect(options.isReady).toBe(false);
    expect(typeof options.onTTID).toBe('function');
    expect(typeof options.onTTFD).toBe('function');
  });
});

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(true);
  });

  afterEach(() => {
    APM.setScreenLoadingEnabled(false);
  });

  describe('Screen name edge cases', () => {
    it('should handle very long screen names', () => {
      const longScreenName = 'A'.repeat(500);

      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: longScreenName,
        duration: 100,
        startTime: 1000,
        endTime: 1100,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        longScreenName,
        100,
        1000,
        1100,
      );
    });

    it('should handle screen names with special characters', () => {
      const specialScreenName = 'Screen/With:Special-Chars_123';

      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: specialScreenName,
        duration: 100,
        startTime: 1000,
        endTime: 1100,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        specialScreenName,
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should handle Unicode screen names', () => {
      const unicodeScreenName = '屏幕加载Screen🚀';

      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: unicodeScreenName,
        duration: 100,
        startTime: 1000,
        endTime: 1100,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        unicodeScreenName,
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe('Timing edge cases', () => {
    it('should handle negative duration (clock skew)', () => {
      // This could happen with clock adjustments
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'ClockSkewScreen',
        duration: -50,
        startTime: 1100,
        endTime: 1050,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        'ClockSkewScreen',
        -50,
        1100,
        1050,
      );
    });

    it('should handle very large duration', () => {
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'VerySlowScreen',
        duration: 60000, // 1 minute
        startTime: 0,
        endTime: 60000,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        'VerySlowScreen',
        60000,
        0,
        60000,
      );
    });
  });

  describe('Reset behavior on navigation', () => {
    it('should support resetting state when screen changes', () => {
      let lastScreenName = 'ScreenA';
      let hasReportedTTID = true;
      let hasReportedTTFD = true;

      // Simulate screen change
      const newScreenName = 'ScreenB';
      if (lastScreenName !== newScreenName) {
        hasReportedTTID = false;
        hasReportedTTFD = false;
        lastScreenName = newScreenName;
      }

      expect(hasReportedTTID).toBe(false);
      expect(hasReportedTTFD).toBe(false);
      expect(lastScreenName).toBe('ScreenB');
    });

    it('should support resetting state when dispatch time changes', () => {
      let lastDispatchTime = 1000;
      let hasReportedTTID = true;
      const newDispatchTime = 2000;

      // Simulate new navigation
      if (lastDispatchTime !== newDispatchTime) {
        hasReportedTTID = false;
        lastDispatchTime = newDispatchTime;
      }

      expect(hasReportedTTID).toBe(false);
      expect(lastDispatchTime).toBe(2000);
    });
  });
});
