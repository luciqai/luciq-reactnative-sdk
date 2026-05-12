import { ScreenLoadingManager } from '../../../src/modules/apm/ScreenLoadingManager';
import { NativeAPM } from '../../../src/native/NativeAPM';
import { Logger } from '../../../src/utils/logger';

// Mock LuciqUtils so toEpochMicros/fromEpochMicros/nowMicros are predictable
jest.mock('../../../src/utils/LuciqUtils', () => ({
  nowMicros: jest.fn(() => 5000),
  toEpochMicros: jest.fn((v: number) => v + 1000000),
  fromEpochMicros: jest.fn((v: number) => v),
}));

// Mock NativeAPM
jest.mock('../../../src/native/NativeAPM', () => ({
  NativeAPM: {
    initScreenFrameTracking: jest.fn().mockResolvedValue(undefined),
    setActiveScreenSpanId: jest.fn(),
    getScreenTimeToDisplay: jest.fn().mockResolvedValue(null),
    isScreenLoadingEnabled: jest.fn().mockResolvedValue(true),
    isEndScreenLoadingEnabled: jest.fn().mockResolvedValue(false),
    syncScreenLoading: jest.fn(),
    syncManualScreenLoading: jest.fn(),
    endScreenLoading: jest.fn(),
  },
}));

// Mock Logger
jest.mock('../../../src/utils/logger', () => ({
  Logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ScreenLoadingManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton state so each test starts fresh
    (ScreenLoadingManager as any).isInitialized = false;
    (ScreenLoadingManager as any).isEnabled = false;
    (ScreenLoadingManager as any).isEndScreenLoadingEnabled = false;
    (ScreenLoadingManager as any).isFrameTrackingInitialized = false;
    (ScreenLoadingManager as any).activeSpans = new Map();
    (ScreenLoadingManager as any).excludedRoutes = new Set();
    (ScreenLoadingManager as any).activeSpanId = null;
  });

  describe('Initialization', () => {
    it('should initialize when feature is enabled', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();

      expect(ScreenLoadingManager.isFeatureEnabled()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);

      await ScreenLoadingManager.initialize();
      const firstCallCount = (NativeAPM.initScreenFrameTracking as jest.Mock).mock.calls.length;

      await ScreenLoadingManager.initialize();
      const secondCallCount = (NativeAPM.initScreenFrameTracking as jest.Mock).mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should set isInitialized but not enable when feature flag is off', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(false);
      (NativeAPM.isEndScreenLoadingEnabled as jest.Mock).mockResolvedValue(false);

      await ScreenLoadingManager.initialize();

      expect(ScreenLoadingManager.isFeatureEnabled()).toBe(false);
      expect(NativeAPM.initScreenFrameTracking).not.toHaveBeenCalled();
    });

    it('should handle initialization error gracefully', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockRejectedValue(new Error('init failed'));

      await ScreenLoadingManager.initialize();

      expect(ScreenLoadingManager.isFeatureEnabled()).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith(
        '[ScreenLoading] Failed to initialize:',
        expect.any(Error),
      );
    });
  });

  describe('refreshFlags', () => {
    it('should update feature flags from native', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      (NativeAPM.isEndScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);

      await ScreenLoadingManager.refreshFlags();

      expect(ScreenLoadingManager.isFeatureEnabled()).toBe(true);
      expect(ScreenLoadingManager.isEndScreenLoadingFeatureEnabled()).toBe(true);
    });

    it('should initialize frame tracking if enabled after refresh and not yet initialized', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      (NativeAPM.isEndScreenLoadingEnabled as jest.Mock).mockResolvedValue(false);

      await ScreenLoadingManager.refreshFlags();

      expect(NativeAPM.initScreenFrameTracking).toHaveBeenCalled();
    });

    it('should not reinitialize frame tracking if already initialized', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      (NativeAPM.isEndScreenLoadingEnabled as jest.Mock).mockResolvedValue(false);
      await ScreenLoadingManager.initialize();
      jest.clearAllMocks();

      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      (NativeAPM.isEndScreenLoadingEnabled as jest.Mock).mockResolvedValue(false);
      await ScreenLoadingManager.refreshFlags();

      expect(NativeAPM.initScreenFrameTracking).not.toHaveBeenCalled();
    });

    it('should handle refreshFlags error gracefully', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockRejectedValue(
        new Error('refresh failed'),
      );

      await ScreenLoadingManager.refreshFlags();

      expect(Logger.error).toHaveBeenCalledWith(
        '[ScreenLoading] Failed to refresh flags:',
        expect.any(Error),
      );
    });
  });

  describe('Span Creation', () => {
    beforeEach(async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();
    });

    it('should create span with unique ID using Date.now()', () => {
      let dateNowCounter = 1000;
      const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => dateNowCounter++);

      const span1 = ScreenLoadingManager.createSpan('Screen1');
      const span2 = ScreenLoadingManager.createSpan('Screen2');

      expect(span1?.spanId).toBeTruthy();
      expect(span2?.spanId).toBeTruthy();
      expect(span1?.spanId).not.toBe(span2?.spanId);

      dateNowSpy.mockRestore();
    });

    it('should create span with correct initial properties', () => {
      const screenName = 'TestScreen';
      const span = ScreenLoadingManager.createSpan(screenName);

      expect(span).toBeTruthy();
      expect(span?.screenName).toBe(screenName);
      expect(span?.status).toBe('measuring');
      expect(span?.isManual).toBe(false);
      expect(span?.startTimestamp).toBeGreaterThan(0);
      expect(span?.attributes).toEqual(new Map());
    });

    it('should distinguish manual from automatic spans', () => {
      const autoSpan = ScreenLoadingManager.createSpan('AutoScreen', false);
      const manualSpan = ScreenLoadingManager.createSpan('ManualScreen', true);

      expect(autoSpan?.isManual).toBe(false);
      expect(manualSpan?.isManual).toBe(true);
    });

    it('should register span with native frame tracking', () => {
      const span = ScreenLoadingManager.createSpan('TestScreen');

      expect(NativeAPM.setActiveScreenSpanId).toHaveBeenCalledWith(span?.spanId);
    });

    it('should not create span when feature is disabled', () => {
      (ScreenLoadingManager as any).isEnabled = false;

      const span = ScreenLoadingManager.createSpan('TestScreen');
      expect(span).toBeNull();
    });

    it('should use custom startTimestamp when provided', () => {
      const customTimestamp = 9999;
      const span = ScreenLoadingManager.createSpan('CustomStartScreen', true, customTimestamp);

      expect(span).toBeTruthy();
      expect(span?.startTimestamp).toBe(customTimestamp);
    });

    it('should use nowMicros when startTimestamp is not provided', () => {
      const span = ScreenLoadingManager.createSpan('DefaultStartScreen');

      expect(span).toBeTruthy();
      // nowMicros is mocked to return 5000
      expect(span?.startTimestamp).toBe(5000);
    });

    it('should set activeSpanId for automatic spans but not for manual spans', () => {
      ScreenLoadingManager.createSpan('AutoScreen', false);
      expect((ScreenLoadingManager as any).activeSpanId).toBeTruthy();

      const prevActiveId = (ScreenLoadingManager as any).activeSpanId;
      ScreenLoadingManager.createSpan('ManualScreen', true);
      expect((ScreenLoadingManager as any).activeSpanId).toBe(prevActiveId);
    });
  });

  describe('Route Exclusion', () => {
    beforeEach(async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();
    });

    it('should exclude routes from automatic tracking', () => {
      ScreenLoadingManager.excludeRoutes(['ExcludedScreen']);

      const excludedSpan = ScreenLoadingManager.createSpan('ExcludedScreen', false);
      const normalSpan = ScreenLoadingManager.createSpan('NormalScreen', false);

      expect(excludedSpan).toBeNull();
      expect(normalSpan).toBeTruthy();
    });

    it('should allow manual tracking of excluded routes', () => {
      ScreenLoadingManager.excludeRoutes(['ExcludedScreen']);

      const manualSpan = ScreenLoadingManager.createSpan('ExcludedScreen', true);

      expect(manualSpan).toBeTruthy();
    });

    it('should check if route is excluded', () => {
      ScreenLoadingManager.excludeRoutes(['TestRoute']);

      expect(ScreenLoadingManager.isRouteExcluded('TestRoute')).toBe(true);
      expect(ScreenLoadingManager.isRouteExcluded('OtherRoute')).toBe(false);
    });

    it('should include previously excluded routes', () => {
      ScreenLoadingManager.excludeRoutes(['Route1', 'Route2']);
      ScreenLoadingManager.includeRoutes(['Route1']);

      expect(ScreenLoadingManager.isRouteExcluded('Route1')).toBe(false);
      expect(ScreenLoadingManager.isRouteExcluded('Route2')).toBe(true);
    });

    it('should clear all exclusions when includeRoutes called with empty array', () => {
      ScreenLoadingManager.excludeRoutes(['Route1', 'Route2', 'Route3']);
      ScreenLoadingManager.includeRoutes([]);

      expect(ScreenLoadingManager.isRouteExcluded('Route1')).toBe(false);
      expect(ScreenLoadingManager.isRouteExcluded('Route2')).toBe(false);
      expect(ScreenLoadingManager.isRouteExcluded('Route3')).toBe(false);
    });

    it('should clear all exclusions when includeRoutes called without arguments', () => {
      ScreenLoadingManager.excludeRoutes(['Route1', 'Route2']);
      ScreenLoadingManager.includeRoutes();

      expect(ScreenLoadingManager.isRouteExcluded('Route1')).toBe(false);
      expect(ScreenLoadingManager.isRouteExcluded('Route2')).toBe(false);
    });
  });

  describe('Span Management', () => {
    beforeEach(async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();
    });

    it('should add attributes to spans', () => {
      const span = ScreenLoadingManager.createSpan('TestScreen');

      if (span) {
        ScreenLoadingManager.addSpanAttribute(span.spanId, 'test_key', 12345);
        const updatedSpan = ScreenLoadingManager.getActiveSpan(span.spanId);

        expect(updatedSpan?.attributes.get('test_key')).toBe(12345);
      }
    });

    it('should add lifecycle duration attributes correctly', () => {
      const span = ScreenLoadingManager.createSpan('TestScreen');

      if (span) {
        // Add multiple numeric attributes for lifecycle durations
        ScreenLoadingManager.addSpanAttribute(span.spanId, 'constructor_ms', 5200);
        ScreenLoadingManager.addSpanAttribute(
          span.spanId,
          'componentDidMount_timestamp_us',
          1234567890,
        );
        ScreenLoadingManager.addSpanAttribute(span.spanId, 'render_ms', 2100);

        const updatedSpan = ScreenLoadingManager.getActiveSpan(span.spanId);
        expect(updatedSpan?.attributes.get('constructor_ms')).toBe(5200);
        expect(updatedSpan?.attributes.get('componentDidMount_timestamp_us')).toBe(1234567890);
        expect(updatedSpan?.attributes.get('render_ms')).toBe(2100);
      }
    });

    it('should not add attribute to non-existent span', () => {
      ScreenLoadingManager.addSpanAttribute('non-existent-id', 'key', 42);

      expect(ScreenLoadingManager.getActiveSpan('non-existent-id')).toBeUndefined();
    });

    it('should retrieve active span by ID', () => {
      const span = ScreenLoadingManager.createSpan('TestScreen');
      const retrieved = ScreenLoadingManager.getActiveSpan(span!.spanId);

      expect(retrieved).toBe(span);
    });

    it('should get all active spans', () => {
      const span1 = ScreenLoadingManager.createSpan('UniqueScreen1');
      const span2 = ScreenLoadingManager.createSpan('UniqueScreen2');
      const activeSpans = ScreenLoadingManager.getAllActiveSpans();

      // Just verify that both spans exist in the active spans list
      const hasSpan1 = activeSpans.some((s) => s.spanId === span1?.spanId);
      const hasSpan2 = activeSpans.some((s) => s.spanId === span2?.spanId);
      expect(hasSpan1).toBe(true);
      expect(hasSpan2).toBe(true);

      // Verify we can retrieve them via getAllActiveSpans
      expect(activeSpans.length).toBeGreaterThan(0);
    });
  });

  describe('Span Completion', () => {
    beforeEach(async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();
      jest.clearAllMocks();
    });

    it('should do nothing when feature is disabled', async () => {
      (ScreenLoadingManager as any).isEnabled = false;

      await ScreenLoadingManager.endSpan('any-id');

      expect(NativeAPM.getScreenTimeToDisplay).not.toHaveBeenCalled();
    });

    it('should do nothing for non-existent span', async () => {
      await ScreenLoadingManager.endSpan('non-existent-id');

      expect(NativeAPM.getScreenTimeToDisplay).not.toHaveBeenCalled();
    });

    it('should retry fetching frame timestamp up to 3 times', async () => {
      jest.useFakeTimers();
      (NativeAPM.getScreenTimeToDisplay as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(9999999);

      const span = ScreenLoadingManager.createSpan('RetryScreen');
      if (span) {
        const endSpanPromise = ScreenLoadingManager.endSpan(span.spanId);
        await jest.advanceTimersByTimeAsync(20);
        await jest.advanceTimersByTimeAsync(20);
        await endSpanPromise;

        expect(NativeAPM.getScreenTimeToDisplay).toHaveBeenCalledTimes(3);
        const updatedSpan = ScreenLoadingManager.getActiveSpan(span.spanId);
        expect(updatedSpan?.status).toBe('completed');
      }
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('should set error status after all retries fail', async () => {
      jest.useFakeTimers();
      (NativeAPM.getScreenTimeToDisplay as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const span = ScreenLoadingManager.createSpan('FailScreen');
      if (span) {
        const endSpanPromise = ScreenLoadingManager.endSpan(span.spanId);
        await jest.advanceTimersByTimeAsync(20);
        await jest.advanceTimersByTimeAsync(20);
        await endSpanPromise;

        const updatedSpan = ScreenLoadingManager.getActiveSpan(span.spanId);
        expect(updatedSpan?.status).toBe('error');
      }
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('should complete span with frame timestamp', async () => {
      const frameTimestamp = 1234567890;
      (NativeAPM.getScreenTimeToDisplay as jest.Mock).mockResolvedValueOnce(frameTimestamp);

      const span = ScreenLoadingManager.createSpan('TestScreen');
      if (span) {
        await ScreenLoadingManager.endSpan(span.spanId);

        const updatedSpan = ScreenLoadingManager.getActiveSpan(span.spanId);
        expect(updatedSpan?.status).toBe('completed');
        expect(updatedSpan?.endTimestamp).toBe(frameTimestamp);
        expect(updatedSpan?.ttid).toBe(frameTimestamp - span.startTimestamp);
      }
    });

    it('should handle missing frame timestamp', async () => {
      (NativeAPM.getScreenTimeToDisplay as jest.Mock).mockResolvedValueOnce(null);

      const span = ScreenLoadingManager.createSpan('TestScreen');
      if (span) {
        await ScreenLoadingManager.endSpan(span.spanId);

        const updatedSpan = ScreenLoadingManager.getActiveSpan(span.spanId);
        expect(updatedSpan?.status).toBe('error');
        expect(Logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('No frame timestamp available'),
        );
      }
    });

    it('should handle errors when getting frame timestamp', async () => {
      (NativeAPM.getScreenTimeToDisplay as jest.Mock).mockRejectedValueOnce(
        new Error('Native error'),
      );

      const span = ScreenLoadingManager.createSpan('TestScreen');
      if (span) {
        await ScreenLoadingManager.endSpan(span.spanId);

        const updatedSpan = ScreenLoadingManager.getActiveSpan(span.spanId);
        expect(updatedSpan?.status).toBe('error');
        expect(Logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to get timestamp'),
          expect.any(Error),
        );
      }
    });

    it('should not end already completed span', async () => {
      const frameTimestamp = 1234567890;
      (NativeAPM.getScreenTimeToDisplay as jest.Mock).mockResolvedValue(frameTimestamp);

      const span = ScreenLoadingManager.createSpan('TestScreen');
      if (span) {
        await ScreenLoadingManager.endSpan(span.spanId);
        const firstCallCount = (NativeAPM.getScreenTimeToDisplay as jest.Mock).mock.calls.length;

        await ScreenLoadingManager.endSpan(span.spanId);
        const secondCallCount = (NativeAPM.getScreenTimeToDisplay as jest.Mock).mock.calls.length;

        expect(secondCallCount).toBe(firstCallCount);
      }
    });

    it('should cleanup span after delay', async () => {
      jest.useFakeTimers();
      const frameTimestamp = 1234567890;
      (NativeAPM.getScreenTimeToDisplay as jest.Mock).mockResolvedValue(frameTimestamp);

      const span = ScreenLoadingManager.createSpan('TestScreen');
      if (span) {
        await ScreenLoadingManager.endSpan(span.spanId);

        // Span should still exist immediately
        expect(ScreenLoadingManager.getActiveSpan(span.spanId)).toBeDefined();

        // Fast-forward time
        jest.advanceTimersByTime(5000);

        // Span should be cleaned up
        expect(ScreenLoadingManager.getActiveSpan(span.spanId)).toBeUndefined();
      }

      jest.useRealTimers();
    });
  });

  describe('Discard Span', () => {
    beforeEach(async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();
    });

    it('should remove span from active spans', () => {
      const span = ScreenLoadingManager.createSpan('DiscardScreen');
      expect(span).toBeTruthy();
      expect(ScreenLoadingManager.getActiveSpan(span!.spanId)).toBeDefined();

      ScreenLoadingManager.discardSpan(span!.spanId);

      expect(ScreenLoadingManager.getActiveSpan(span!.spanId)).toBeUndefined();
    });

    it('should do nothing for non-existent span ID', () => {
      ScreenLoadingManager.discardSpan('non-existent-id');

      expect(Logger.log).not.toHaveBeenCalledWith(expect.stringContaining('Discarded span'));
    });
  });

  describe('endScreenLoading', () => {
    beforeEach(async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      (NativeAPM.isEndScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();
      jest.clearAllMocks();
    });

    it('should call native endScreenLoading with timestamp and ui trace id', () => {
      ScreenLoadingManager.createSpan('TestScreen', false);
      ScreenLoadingManager.endScreenLoading();

      expect(NativeAPM.endScreenLoading).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should not end screen loading when feature is disabled', () => {
      (ScreenLoadingManager as any).isEnabled = false;

      ScreenLoadingManager.endScreenLoading();

      expect(NativeAPM.endScreenLoading).not.toHaveBeenCalled();
      expect(Logger.error).toHaveBeenCalledWith(
        '[ScreenLoading] End screen loading feature is not enabled',
      );
    });

    it('should not end screen loading when isEndScreenLoadingEnabled is false', () => {
      (ScreenLoadingManager as any).isEndScreenLoadingEnabled = false;

      ScreenLoadingManager.endScreenLoading();

      expect(NativeAPM.endScreenLoading).not.toHaveBeenCalled();
    });

    it('should warn when no active span exists', () => {
      (ScreenLoadingManager as any).isEndScreenLoadingEnabled = true;
      (ScreenLoadingManager as any).activeSpanId = null;

      ScreenLoadingManager.endScreenLoading();

      expect(Logger.warn).toHaveBeenCalledWith(
        '[ScreenLoading] No active span to end screen loading',
      );
      expect(NativeAPM.endScreenLoading).not.toHaveBeenCalled();
    });

    it('should handle error during endScreenLoading gracefully', () => {
      ScreenLoadingManager.createSpan('TestScreen', false);
      (NativeAPM.endScreenLoading as jest.Mock).mockImplementationOnce(() => {
        throw new Error('native error');
      });

      ScreenLoadingManager.endScreenLoading();

      expect(Logger.error).toHaveBeenCalledWith(
        '[ScreenLoading] Failed to end screen loading:',
        expect.any(Error),
      );
    });
  });

  describe('Concurrent Span Limits', () => {
    beforeEach(async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();
    });

    it('should trigger cleanup when reaching maxConcurrentSpans', () => {
      // Mock Date.now to return unique values so each span gets a unique ID in the Map
      let counter = 1000;
      const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => counter++);

      // Create exactly maxConcurrentSpans (50) spans to fill the map
      for (let i = 0; i < 50; i++) {
        ScreenLoadingManager.createSpan(`Screen${i}`);
      }
      expect(ScreenLoadingManager.getAllActiveSpans().length).toBe(50);

      // Creating one more should trigger cleanupOldestSpans, which trims down to 30
      ScreenLoadingManager.createSpan('TriggerCleanup');

      // After cleanup: 30 kept + 1 new = 31
      const activeSpans = ScreenLoadingManager.getAllActiveSpans();
      expect(activeSpans.length).toBe(31);

      dateNowSpy.mockRestore();
    });

    it('should remove oldest spans during cleanup', () => {
      let counter = 1000;
      const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => counter++);

      // Create 50 spans
      const firstSpan = ScreenLoadingManager.createSpan('OldestScreen');
      for (let i = 1; i < 50; i++) {
        ScreenLoadingManager.createSpan(`Screen${i}`);
      }

      // Trigger cleanup by creating one more
      ScreenLoadingManager.createSpan('NewScreen');

      // The oldest span should have been removed
      expect(ScreenLoadingManager.getActiveSpan(firstSpan!.spanId)).toBeUndefined();

      dateNowSpy.mockRestore();
    });
  });

  describe('Logging', () => {
    beforeEach(async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();
      jest.clearAllMocks();
    });

    it('should log completed measurements', async () => {
      const frameTimestamp = 1234567890;
      (NativeAPM.getScreenTimeToDisplay as jest.Mock).mockResolvedValueOnce(frameTimestamp);

      const span = ScreenLoadingManager.createSpan('TestScreen');
      if (span) {
        ScreenLoadingManager.addSpanAttribute(span.spanId, 'test_attr', 12345);
        await ScreenLoadingManager.endSpan(span.spanId);

        expect(Logger.log).toHaveBeenCalledWith(
          '[ScreenLoading] Measurement:',
          expect.stringContaining('screen_name'),
        );
      }
    });

    it('should call syncScreenLoading for automatic spans', async () => {
      const frameTimestamp = 1234567890;
      (NativeAPM.getScreenTimeToDisplay as jest.Mock).mockResolvedValueOnce(frameTimestamp);

      const span = ScreenLoadingManager.createSpan('AutoScreen', false);
      if (span) {
        await ScreenLoadingManager.endSpan(span.spanId);

        expect(NativeAPM.syncScreenLoading).toHaveBeenCalledWith(
          Number(span.spanId),
          'AutoScreen',
          expect.any(Number),
          expect.any(Number),
          expect.any(Object),
        );
      }
    });

    it('should call syncManualScreenLoading for manual spans', async () => {
      const frameTimestamp = 1234567890;
      (NativeAPM.getScreenTimeToDisplay as jest.Mock).mockResolvedValueOnce(frameTimestamp);

      const span = ScreenLoadingManager.createSpan('ManualScreen', true);
      if (span) {
        await ScreenLoadingManager.endSpan(span.spanId);

        expect(NativeAPM.syncManualScreenLoading).toHaveBeenCalledWith(
          'ManualScreen',
          expect.any(Number),
          expect.any(Number),
          expect.any(Object),
        );
      }
    });
  });

  describe('Feature Flag', () => {
    it('should return correct feature flag state', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValueOnce(true);
      await ScreenLoadingManager.initialize();

      expect(ScreenLoadingManager.isFeatureEnabled()).toBe(true);
    });

    it('should return false for isFeatureEnabled when disabled', () => {
      expect(ScreenLoadingManager.isFeatureEnabled()).toBe(false);
    });

    it('should return true for isEndScreenLoadingFeatureEnabled when both flags are on', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      (NativeAPM.isEndScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();

      expect(ScreenLoadingManager.isEndScreenLoadingFeatureEnabled()).toBe(true);
    });

    it('should return false for isEndScreenLoadingFeatureEnabled when screen loading is off', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(false);
      (NativeAPM.isEndScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      await ScreenLoadingManager.initialize();

      expect(ScreenLoadingManager.isEndScreenLoadingFeatureEnabled()).toBe(false);
    });

    it('should return false for isEndScreenLoadingFeatureEnabled when endScreenLoading flag is off', async () => {
      (NativeAPM.isScreenLoadingEnabled as jest.Mock).mockResolvedValue(true);
      (NativeAPM.isEndScreenLoadingEnabled as jest.Mock).mockResolvedValue(false);
      await ScreenLoadingManager.initialize();

      expect(ScreenLoadingManager.isEndScreenLoadingFeatureEnabled()).toBe(false);
    });
  });
});
