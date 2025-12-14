/**
 * Performance benchmark tests for Screen Loading feature
 *
 * These tests verify that the screen loading measurement has minimal overhead
 * and handles various performance scenarios correctly.
 */

import * as APM from '../../src/modules/APM';
import { NativeAPM } from '../../src/native/NativeAPM';

// Mock native module
jest.mock('../../src/native/NativeAPM', () => ({
  NativeAPM: {
    setEnabled: jest.fn(),
    setScreenLoadingEnabled: jest.fn(),
    startScreenLoading: jest.fn(),
    endScreenLoading: jest.fn(),
    reportScreenLoadingMetric: jest.fn(),
    setFlowAttribute: jest.fn(),
  },
}));

describe('Screen Loading Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(true);
  });

  afterEach(() => {
    APM.setScreenLoadingEnabled(false);
  });

  describe('Operation Overhead', () => {
    it('should have minimal overhead for start/end operations', () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        APM.startScreenLoading(`Screen${i}`);
        APM.endScreenLoading(`Screen${i}`);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / iterations;

      // Each start/end pair should take less than 1ms on average
      expect(avgTimePerOperation).toBeLessThan(1);

      // Log for debugging
      // console.log(`Average time per screen loading cycle: ${avgTimePerOperation.toFixed(3)}ms`);
    });

    it('should handle metric reporting efficiently', () => {
      const iterations = 500;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: `Screen${i}`,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      // Metric reporting should be fast
      expect(avgTime).toBeLessThan(0.5);
    });

    it('should efficiently check screen loading enabled state', () => {
      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        APM.isScreenLoadingEnabled();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      // State check should be nearly instant
      expect(avgTime).toBeLessThan(0.01);
    });
  });

  describe('Rapid Navigation Handling', () => {
    it('should handle rapid navigation efficiently', () => {
      const screens = ['Home', 'Profile', 'Settings', 'Home', 'Profile', 'Details', 'Home'];
      const startTime = performance.now();

      screens.forEach((screen) => {
        APM.startScreenLoading(screen);
      });

      screens.forEach((screen) => {
        APM.endScreenLoading(screen);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid operations efficiently (under 50ms for all)
      expect(totalTime).toBeLessThan(50);
    });

    it('should handle interleaved start/end operations', () => {
      const startTime = performance.now();

      // Interleave operations like real rapid navigation
      APM.startScreenLoading('ScreenA');
      APM.startScreenLoading('ScreenB');
      APM.endScreenLoading('ScreenA');
      APM.startScreenLoading('ScreenC');
      APM.endScreenLoading('ScreenB');
      APM.startScreenLoading('ScreenD');
      APM.endScreenLoading('ScreenC');
      APM.endScreenLoading('ScreenD');

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(10);
    });

    it('should handle back-to-back navigations to same screen', () => {
      const startTime = performance.now();

      // Simulate rapid back-and-forth navigation
      for (let i = 0; i < 100; i++) {
        APM.startScreenLoading('HomeScreen');
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: 'HomeScreen',
          duration: 50 + Math.random() * 100,
          startTime: Date.now() - 100,
          endTime: Date.now(),
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle same-screen rapid navigation
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Memory Efficiency', () => {
    it('should clean up completed screens from tracking', () => {
      // Start many screens
      for (let i = 0; i < 100; i++) {
        APM.startScreenLoading(`TempScreen${i}`);
      }

      // End all screens
      for (let i = 0; i < 100; i++) {
        APM.endScreenLoading(`TempScreen${i}`);
      }

      // Verify screens are cleaned up by checking _hasInitialDisplayForScreen
      // (which checks the activeScreens Map)
      expect(APM._hasInitialDisplayForScreen('TempScreen0')).toBe(false);
      expect(APM._hasInitialDisplayForScreen('TempScreen99')).toBe(false);
    });

    it('should handle large number of screens without issues', () => {
      const screenCount = 1000;

      // Report metrics for many screens
      for (let i = 0; i < screenCount; i++) {
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: `LargeScreen${i}`,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });
      }

      // Verify metrics were reported
      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(screenCount);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent metric reports', async () => {
      const concurrentCount = 50;
      const promises: Promise<void>[] = [];

      const startTime = performance.now();

      for (let i = 0; i < concurrentCount; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            APM._reportScreenLoadingMetric({
              type: 'initial_display',
              screenName: `ConcurrentScreen${i}`,
              duration: 100,
              startTime: 1000,
              endTime: 1100,
            });
            resolve();
          }),
        );
      }

      await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(50);
      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(concurrentCount);
    });

    it('should maintain consistency under concurrent load', async () => {
      const concurrentCount = 20;

      // Simulate concurrent TTID and TTFD reports
      for (let i = 0; i < concurrentCount; i++) {
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: `ConsistencyScreen${i}`,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });
      }

      // Verify all TTID screens are tracked
      for (let i = 0; i < concurrentCount; i++) {
        expect(APM._hasInitialDisplayForScreen(`ConsistencyScreen${i}`)).toBe(true);
      }
    });
  });

  describe('State Toggle Performance', () => {
    it('should handle rapid enable/disable toggles', () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        APM.setScreenLoadingEnabled(i % 2 === 0);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      expect(avgTime).toBeLessThan(0.5);
    });

    it('should correctly handle operations after rapid state changes', () => {
      // Rapidly toggle state
      for (let i = 0; i < 10; i++) {
        APM.setScreenLoadingEnabled(i % 2 === 0);
      }

      // Final state should be disabled (10 is even, so last call was setEnabled(true))
      APM.setScreenLoadingEnabled(true);
      expect(APM.isScreenLoadingEnabled()).toBe(true);

      // Operations should work correctly
      APM.startScreenLoading('TestScreen');
      expect(NativeAPM.startScreenLoading).toHaveBeenCalledWith('TestScreen');
    });
  });

  describe('Flow Attribute Performance', () => {
    it('should efficiently set flow attributes', () => {
      const attributeCount = 100;
      const startTime = performance.now();

      for (let i = 0; i < attributeCount; i++) {
        APM.setFlowAttribute('TestScreen', `key${i}`, `value${i}`);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(50);
      expect(NativeAPM.setFlowAttribute).toHaveBeenCalledTimes(attributeCount);
    });

    it('should handle batch attribute setting', () => {
      const attributes = {
        product_id: '123',
        source: 'search',
        category: 'electronics',
        user_id: 'user_456',
        session_id: 'session_789',
      };

      const startTime = performance.now();

      Object.entries(attributes).forEach(([key, value]) => {
        APM.setFlowAttribute('ProductScreen', key, value);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(10);
    });
  });

  describe('Timing Accuracy', () => {
    it('should accurately track timing for short durations', () => {
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(1050);

      APM.startScreenLoading('ShortScreen');
      APM.endScreenLoading('ShortScreen');

      expect(NativeAPM.endScreenLoading).toHaveBeenCalledWith('ShortScreen', 50);

      mockNow.mockRestore();
    });

    it('should accurately track timing for long durations', () => {
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(11000);

      APM.startScreenLoading('LongScreen');
      APM.endScreenLoading('LongScreen');

      expect(NativeAPM.endScreenLoading).toHaveBeenCalledWith('LongScreen', 10000);

      mockNow.mockRestore();
    });

    it('should handle edge case of zero duration', () => {
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(1000);

      APM.startScreenLoading('InstantScreen');
      APM.endScreenLoading('InstantScreen');

      expect(NativeAPM.endScreenLoading).toHaveBeenCalledWith('InstantScreen', 0);

      mockNow.mockRestore();
    });
  });
});

describe('Screen Loading Stress Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(true);
  });

  afterEach(() => {
    APM.setScreenLoadingEnabled(false);
  });

  it('should handle stress test with many sequential operations', () => {
    const operationCount = 5000;
    const startTime = performance.now();

    for (let i = 0; i < operationCount; i++) {
      APM._reportScreenLoadingMetric({
        type: i % 2 === 0 ? 'initial_display' : 'full_display',
        screenName: `StressScreen${Math.floor(i / 2)}`,
        duration: 100 + (i % 100),
        startTime: 1000,
        endTime: 1100 + (i % 100),
      });
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const opsPerSecond = operationCount / (totalTime / 1000);

    // Should handle at least 10000 ops/sec
    expect(opsPerSecond).toBeGreaterThan(10000);
  });

  it('should maintain stable performance over extended operation', () => {
    const batchSize = 100;
    const batchCount = 10;
    const timings: number[] = [];

    for (let batch = 0; batch < batchCount; batch++) {
      const batchStart = performance.now();

      for (let i = 0; i < batchSize; i++) {
        APM._reportScreenLoadingMetric({
          type: 'initial_display',
          screenName: `ExtendedScreen${batch}_${i}`,
          duration: 100,
          startTime: 1000,
          endTime: 1100,
        });
      }

      const batchEnd = performance.now();
      timings.push(batchEnd - batchStart);
    }

    // Calculate variance - should be low indicating stable performance
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    const variance = timings.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / timings.length;
    const stdDev = Math.sqrt(variance);

    // Standard deviation should be less than 50% of average (stable performance)
    expect(stdDev / avg).toBeLessThan(0.5);
  });
});
