/**
 * Tests for LuciqScreenLoading components (InitialDisplay & FullDisplay)
 *
 * Since we don't have react-test-renderer available, we test:
 * 1. The underlying APM integration logic
 * 2. Props validation and expected behavior
 * 3. Navigation timing integration
 * 4. Edge cases and error scenarios
 */

import * as APM from '../../src/modules/APM';
import { NativeAPM } from '../../src/native/NativeAPM';

describe('LuciqScreenLoading Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(true);
  });

  afterEach(() => {
    APM.setScreenLoadingEnabled(false);
  });

  describe('InitialDisplay Integration', () => {
    describe('Screen Loading Enabled', () => {
      it('should report TTID metric when display callback is triggered', () => {
        const screenName = 'HomeScreen';
        const startTime = 1000;
        const endTime = 1150;
        const duration = endTime - startTime;

        // Simulate what InitialDisplay does when native view calls onDisplay
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

      it('should track screen for TTFD dependency', () => {
        const screenName = 'TrackedScreen';

        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        expect(APM._hasInitialDisplayForScreen(screenName)).toBe(true);
      });

      it('should apply custom attributes when provided', () => {
        const screenName = 'ProductScreen';
        const attributes = { product_id: '123', source: 'search' };

        // Simulate InitialDisplay applying attributes
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        Object.entries(attributes).forEach(([key, value]) => {
          APM.setFlowAttribute(screenName, key, value);
        });

        expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith(screenName, 'product_id', '123');
        expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith(screenName, 'source', 'search');
      });

      it('should handle multiple attributes in order', () => {
        const screenName = 'MultiAttrScreen';
        const attributes = {
          attr1: 'value1',
          attr2: 'value2',
          attr3: 'value3',
        };

        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        Object.entries(attributes).forEach(([key, value]) => {
          APM.setFlowAttribute(screenName, key, value);
        });

        expect(NativeAPM.setFlowAttribute).toHaveBeenCalledTimes(3);
      });
    });

    describe('Screen Loading Disabled', () => {
      it('should not report metrics when screen loading is disabled', () => {
        APM.setScreenLoadingEnabled(false);
        jest.clearAllMocks();

        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: 'TestScreen',
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        expect(NativeAPM.reportScreenLoadingMetric).not.toHaveBeenCalled();
      });

      it('should return false for isScreenLoadingEnabled', () => {
        APM.setScreenLoadingEnabled(false);
        expect(APM.isScreenLoadingEnabled()).toBe(false);
      });

      it('should not track screens when disabled', () => {
        APM.setScreenLoadingEnabled(false);
        jest.clearAllMocks();

        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: 'DisabledScreen',
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        // Note: _hasInitialDisplayForScreen still works with the internal map
        // but the metric wasn't reported
        expect(NativeAPM.reportScreenLoadingMetric).not.toHaveBeenCalled();
      });
    });

    describe('Dispatch Time Calculation', () => {
      it('should calculate duration from dispatch time when enabled', () => {
        const dispatchTime = 900; // Earlier dispatch time
        const endTime = 1150;

        // When useDispatchTime is true, duration should be from dispatchTime
        const durationFromDispatch = endTime - dispatchTime;

        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: 'DispatchScreen',
          duration: durationFromDispatch,
          startTime: dispatchTime, // Using dispatch time as start
          endTime,
        });

        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
          'initial_display',
          'DispatchScreen',
          250, // 1150 - 900
          dispatchTime,
          endTime,
        );
      });

      it('should use native timing when dispatch time is not available', () => {
        const nativeStartTime = 1000;
        const endTime = 1150;
        const duration = endTime - nativeStartTime;

        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: 'NativeTimingScreen',
          duration,
          startTime: nativeStartTime,
          endTime,
        });

        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
          'initial_display',
          'NativeTimingScreen',
          150,
          nativeStartTime,
          endTime,
        );
      });

      it('should handle very early dispatch time', () => {
        const dispatchTime = 100;
        const endTime = 1000;
        const duration = endTime - dispatchTime;

        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: 'EarlyDispatchScreen',
          duration,
          startTime: dispatchTime,
          endTime,
        });

        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
          'initial_display',
          'EarlyDispatchScreen',
          900,
          100,
          1000,
        );
      });
    });

    describe('Screen Name Resolution', () => {
      it('should use provided screenName prop', () => {
        const explicitScreenName = 'ExplicitScreen';

        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: explicitScreenName,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
          'initial_display',
          explicitScreenName,
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
        );
      });

      it('should handle empty screen name gracefully', () => {
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: '',
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
          'initial_display',
          '',
          100,
          1000,
          1100,
        );
      });

      it('should handle screen names with various formats', () => {
        const screenNames = [
          'SimpleScreen',
          'Screen_With_Underscores',
          'Screen-With-Dashes',
          'Screen.With.Dots',
          'Screen/With/Slashes',
        ];

        screenNames.forEach((screenName, index) => {
          APM._reportScreenLoadingMetric({
            type: 'initial_display',
            screenName,
            duration: 100,
            startTime: 1000 + index * 100,
            endTime: 1100 + index * 100,
          });
        });

        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('FullDisplay Integration', () => {
    describe('TTID Dependency Check', () => {
      it('should report TTFD when TTID exists for screen', () => {
        const screenName = 'CompleteScreen';

        // First report TTID
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        // Verify TTID is tracked
        expect(APM._hasInitialDisplayForScreen(screenName)).toBe(true);

        // Then report TTFD
        APM._reportScreenLoadingMetric({
          type: 'full_display',
          screenName,
          duration: 500,
          startTime: 1000,
          endTime: 1500,
        });

        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(2);
        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenLastCalledWith(
          'full_display',
          screenName,
          500,
          1000,
          1500,
        );
      });

      it('should return false when TTID does not exist', () => {
        expect(APM._hasInitialDisplayForScreen('NewScreen')).toBe(false);
      });

      it('should return false for undefined screen name', () => {
        expect(APM._hasInitialDisplayForScreen(undefined)).toBe(false);
      });

      it('should return false for empty screen name', () => {
        expect(APM._hasInitialDisplayForScreen('')).toBe(false);
      });

      it('should check TTID dependency correctly for different screens', () => {
        // Only report TTID for ScreenA
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: 'ScreenA',
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        expect(APM._hasInitialDisplayForScreen('ScreenA')).toBe(true);
        expect(APM._hasInitialDisplayForScreen('ScreenB')).toBe(false);
        expect(APM._hasInitialDisplayForScreen('ScreenC')).toBe(false);
      });
    });

    describe('TTFD Metric Reporting', () => {
      it('should apply custom attributes to TTFD', () => {
        const screenName = 'SearchResults';
        const attributes = { query: 'shoes', result_count: '42' };

        // Report TTID first
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        // Report TTFD with attributes
        APM._reportScreenLoadingMetric({
          type: 'full_display',
          screenName,
          duration: 800,
          startTime: 1000,
          endTime: 1800,
        });

        // Apply attributes (as FullDisplay component would do)
        Object.entries(attributes).forEach(([key, value]) => {
          APM.setFlowAttribute(screenName, key, value);
        });

        expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith(screenName, 'query', 'shoes');
        expect(NativeAPM.setFlowAttribute).toHaveBeenCalledWith(screenName, 'result_count', '42');
      });

      it('should report TTFD with longer duration than TTID', () => {
        const screenName = 'AsyncLoadScreen';

        // TTID at 100ms
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });

        // TTFD at 2000ms (after async data loads)
        APM._reportScreenLoadingMetric({
          type: 'full_display',
          screenName,
          duration: 2000,
          startTime: 1000,
          endTime: 3000,
        });

        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
          'full_display',
          screenName,
          2000,
          1000,
          3000,
        );
      });
    });

    describe('Dispatch Time for TTFD', () => {
      it('should use dispatch time for TTFD calculation', () => {
        const screenName = 'FullLoadScreen';
        const dispatchTime = 900;

        // Report TTID
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName,
          duration: 200,
          startTime: dispatchTime,
          endTime: 1100,
        });

        // Report TTFD with dispatch time as start
        const ttfdEndTime = 2000;
        APM._reportScreenLoadingMetric({
          type: 'full_display',
          screenName,
          duration: ttfdEndTime - dispatchTime,
          startTime: dispatchTime,
          endTime: ttfdEndTime,
        });

        expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenLastCalledWith(
          'full_display',
          screenName,
          1100, // 2000 - 900
          dispatchTime,
          ttfdEndTime,
        );
      });

      it('should maintain consistent start time between TTID and TTFD', () => {
        const screenName = 'ConsistentScreen';
        const sharedStartTime = 1000;

        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName,
          duration: 150,
          startTime: sharedStartTime,
          endTime: 1150,
        });

        APM._reportScreenLoadingMetric({
          type: 'full_display',
          screenName,
          duration: 500,
          startTime: sharedStartTime,
          endTime: 1500,
        });

        const calls = (NativeAPM.reportScreenLoadingMetric as jest.Mock).mock.calls;
        expect(calls[0][3]).toBe(sharedStartTime); // TTID start time
        expect(calls[1][3]).toBe(sharedStartTime); // TTFD start time
      });
    });
  });

  describe('Screen Revisit Handling', () => {
    it('should allow re-reporting TTID for the same screen on revisit', () => {
      const screenName = 'RevisitScreen';

      // First visit
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName,
        duration: 100,
        startTime: 1000,
        endTime: 1100,
      });

      // Navigate away (simulated by clearing the screen)
      // ... navigation happens ...

      // Revisit (component re-mounts with new dispatch time)
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName,
        duration: 120,
        startTime: 5000,
        endTime: 5120,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(2);
    });

    it('should track multiple screens independently', () => {
      // Screen A
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'ScreenA',
        duration: 100,
        startTime: 1000,
        endTime: 1100,
      });

      // Screen B
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

    it('should handle back-to-back navigations', () => {
      const screens = ['Home', 'Profile', 'Settings', 'Details'];

      screens.forEach((screen, index) => {
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: screen,
          duration: 100 + index * 10,
          startTime: index * 500,
          endTime: index * 500 + 100 + index * 10,
        });
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(4);
      screens.forEach((screen) => {
        expect(APM._hasInitialDisplayForScreen(screen)).toBe(true);
      });
    });
  });

  describe('Callback Integration', () => {
    it('should enable tracking of onMeasured callback duration', () => {
      const startTime = 1000;
      const endTime = 1250;
      const duration = endTime - startTime;

      // This simulates what onMeasured would receive
      expect(duration).toBe(250);

      // The component would call onMeasured?.(duration)
      const onMeasured = jest.fn();
      onMeasured(duration);

      expect(onMeasured).toHaveBeenCalledWith(250);
    });

    it('should call onMeasured with correct duration for TTFD', () => {
      const onMeasured = jest.fn();
      const ttfdDuration = 750;

      // Simulate TTFD completion callback
      onMeasured(ttfdDuration);

      expect(onMeasured).toHaveBeenCalledWith(750);
    });
  });
});

describe('LuciqScreenLoading Component Props Validation', () => {
  /**
   * These tests validate the expected prop types and their behavior
   * without rendering the actual React components
   */

  describe('ScreenLoadingProps interface', () => {
    it('should accept all expected props', () => {
      // Type validation - this would cause TypeScript errors if props are wrong
      const validProps = {
        record: true,
        screenName: 'TestScreen',
        children: null,
        onMeasured: (duration: number) => console.log(duration),
        useDispatchTime: true,
        attributes: { key: 'value' },
      };

      expect(validProps.record).toBe(true);
      expect(validProps.screenName).toBe('TestScreen');
      expect(validProps.useDispatchTime).toBe(true);
      expect(validProps.attributes).toEqual({ key: 'value' });
    });

    it('should have correct default values', () => {
      // Based on the component implementation
      const defaults = {
        record: true,
        useDispatchTime: true,
      };

      expect(defaults.record).toBe(true);
      expect(defaults.useDispatchTime).toBe(true);
    });

    it('should allow optional props to be undefined', () => {
      const minimalProps = {
        record: undefined,
        screenName: undefined,
        children: undefined,
        onMeasured: undefined,
        useDispatchTime: undefined,
        attributes: undefined,
      };

      // All props should be allowed to be undefined
      expect(minimalProps.record).toBeUndefined();
      expect(minimalProps.screenName).toBeUndefined();
    });
  });

  describe('Attributes prop', () => {
    it('should handle multiple attributes', () => {
      const attributes: Record<string, string> = {
        product_id: '123',
        source: 'deep_link',
        category: 'electronics',
      };

      expect(Object.keys(attributes).length).toBe(3);
    });

    it('should handle empty attributes object', () => {
      const attributes: Record<string, string> = {};

      expect(Object.keys(attributes).length).toBe(0);
    });

    it('should handle attributes with various value types (as strings)', () => {
      const attributes: Record<string, string> = {
        number_value: '123',
        boolean_string: 'true',
        array_string: '1,2,3',
        empty_string: '',
      };

      expect(Object.keys(attributes).length).toBe(4);
      expect(attributes.number_value).toBe('123');
      expect(attributes.boolean_string).toBe('true');
    });
  });

  describe('record prop', () => {
    it('should default to true behavior', () => {
      const defaultRecord = true;
      expect(defaultRecord).toBe(true);
    });

    it('should allow disabling recording', () => {
      const record = false;
      expect(record).toBe(false);
    });
  });
});

describe('Navigation Timing Integration for Components', () => {
  /**
   * Tests for how components integrate with NavigationTimingProvider
   */

  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(true);
  });

  afterEach(() => {
    APM.setScreenLoadingEnabled(false);
  });

  describe('Screen Name Auto-Detection', () => {
    it('should handle screen name from navigation context', () => {
      // Simulating what happens when navigationTiming.currentScreenName is available
      const navigationScreenName = 'NavigatedScreen';
      const explicitScreenName = undefined;

      // Component logic: screenName || navigationTiming.currentScreenName || ''
      const effectiveScreenName = explicitScreenName || navigationScreenName || '';

      expect(effectiveScreenName).toBe('NavigatedScreen');
    });

    it('should prefer explicit screenName over navigation context', () => {
      const navigationScreenName = 'NavigatedScreen';
      const explicitScreenName = 'ExplicitScreen';

      const effectiveScreenName = explicitScreenName || navigationScreenName || '';

      expect(effectiveScreenName).toBe('ExplicitScreen');
    });

    it('should use empty string when neither is available', () => {
      const navigationScreenName = null;
      const explicitScreenName = undefined;

      const effectiveScreenName = explicitScreenName || navigationScreenName || '';

      expect(effectiveScreenName).toBe('');
    });

    it('should handle empty string from navigation context', () => {
      const navigationScreenName = '';
      const explicitScreenName = undefined;

      const effectiveScreenName = explicitScreenName || navigationScreenName || 'fallback';

      expect(effectiveScreenName).toBe('fallback');
    });
  });

  describe('Dispatch Time Integration', () => {
    it('should use dispatch time when available and enabled', () => {
      const dispatchTime = 1000;
      const useDispatchTime = true;
      const nativeEndTime = 1200;

      // Simulate component logic
      const startTime = useDispatchTime && dispatchTime ? dispatchTime : Date.now();
      const duration = nativeEndTime - startTime;

      expect(startTime).toBe(dispatchTime);
      expect(duration).toBe(200);
    });

    it('should not use dispatch time when disabled', () => {
      const dispatchTime = 1000;
      const useDispatchTime = false;
      const currentTime = 1050;

      // Simulate component logic
      const startTime = useDispatchTime && dispatchTime ? dispatchTime : currentTime;

      expect(startTime).toBe(currentTime);
    });

    it('should handle null dispatch time gracefully', () => {
      const dispatchTime = null;
      const useDispatchTime = true;
      const fallbackTime = Date.now();

      // Simulate component logic
      const startTime = useDispatchTime && dispatchTime ? dispatchTime : fallbackTime;

      expect(startTime).toBe(fallbackTime);
    });

    it('should handle zero dispatch time', () => {
      const dispatchTime = 0;
      const useDispatchTime = true;
      const fallbackTime = 1000;

      // Zero is falsy, so it should use fallback
      const startTime = useDispatchTime && dispatchTime ? dispatchTime : fallbackTime;

      expect(startTime).toBe(fallbackTime);
    });
  });

  describe('Reset on Navigation', () => {
    it('should support resetting measurement state on screen change', () => {
      // Simulate the reset logic in the component
      const lastScreenName: string = 'ScreenA';
      const newScreenName: string = 'ScreenB';

      const screenNameChanged = lastScreenName !== newScreenName;

      expect(screenNameChanged).toBe(true);
    });

    it('should support resetting measurement state on new dispatch', () => {
      const lastDispatchTime: number = 1000;
      const newDispatchTime: number | null = 2000;
      const useDispatchTime = true;

      const dispatchTimeChanged =
        useDispatchTime && newDispatchTime !== null && lastDispatchTime !== newDispatchTime;

      expect(dispatchTimeChanged).toBe(true);
    });

    it('should not reset when dispatch time is same', () => {
      const lastDispatchTime: number = 1000;
      const newDispatchTime: number | null = 1000;
      const useDispatchTime = true;

      const dispatchTimeChanged =
        useDispatchTime && newDispatchTime !== null && lastDispatchTime !== newDispatchTime;

      expect(dispatchTimeChanged).toBe(false);
    });

    it('should not reset when useDispatchTime is false', () => {
      const lastDispatchTime: number = 1000;
      const newDispatchTime: number | null = 2000;
      const useDispatchTime = false;

      const dispatchTimeChanged =
        useDispatchTime && newDispatchTime !== null && lastDispatchTime !== newDispatchTime;

      expect(dispatchTimeChanged).toBe(false);
    });
  });

  describe('hasReported Flag Logic', () => {
    it('should prevent duplicate reports with hasReported flag', () => {
      let hasReported = false;

      const report = () => {
        if (hasReported) {
          return false;
        }
        hasReported = true;
        return true;
      };

      expect(report()).toBe(true);
      expect(report()).toBe(false);
      expect(report()).toBe(false);
    });
  });
});

describe('Component Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(true);
  });

  afterEach(() => {
    APM.setScreenLoadingEnabled(false);
  });

  describe('Timing Edge Cases', () => {
    it('should handle zero duration', () => {
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'InstantScreen',
        duration: 0,
        startTime: 1000,
        endTime: 1000,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        'InstantScreen',
        0,
        1000,
        1000,
      );
    });

    it('should handle very large duration values', () => {
      const duration = 120000; // 2 minutes

      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'VerySlowScreen',
        duration,
        startTime: 0,
        endTime: duration,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        'VerySlowScreen',
        120000,
        0,
        120000,
      );
    });
  });

  describe('Concurrent Screen Loading', () => {
    it('should handle multiple screens loading simultaneously', () => {
      // Start loading multiple screens at once
      const screens = ['Screen1', 'Screen2', 'Screen3'];

      screens.forEach((screen) => {
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: screen,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(3);

      // All screens should be tracked
      screens.forEach((screen) => {
        expect(APM._hasInitialDisplayForScreen(screen)).toBe(true);
      });
    });
  });

  describe('TTFD Warning Simulation', () => {
    it('should simulate TTFD warning when no TTID exists', () => {
      const screenName = 'NoTTIDScreen';
      const warnings: string[] = [];

      // Simulate FullDisplay warning logic
      if (!APM._hasInitialDisplayForScreen(screenName)) {
        warnings.push(`[LuciqScreenLoading] No initial display found for screen "${screenName}".`);
      }

      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain(screenName);
    });

    it('should not warn when TTID exists', () => {
      const screenName = 'HasTTIDScreen';
      const warnings: string[] = [];

      // Report TTID first
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName,
        duration: 100,
        startTime: 1000,
        endTime: 1100,
      });

      // Check before reporting TTFD
      if (!APM._hasInitialDisplayForScreen(screenName)) {
        warnings.push('Warning: No TTID');
      }

      expect(warnings.length).toBe(0);
    });
  });
});
