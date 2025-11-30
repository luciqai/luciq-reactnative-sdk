import { Platform } from 'react-native';

import { NativeAPM } from '../../src/native/NativeAPM';
import { NativeLuciq } from '../../src/native/NativeLuciq';
import * as APM from '../../src/modules/APM';
import { CustomSpan } from '../../src';

describe('APM Module', () => {
  it('should call the native method setEnabled', () => {
    APM.setEnabled(true);

    expect(NativeAPM.setEnabled).toBeCalledTimes(1);
    expect(NativeAPM.setEnabled).toBeCalledWith(true);
  });

  it('should call the native method setAppLaunchEnabled', () => {
    APM.setAppLaunchEnabled(true);

    expect(NativeAPM.setAppLaunchEnabled).toBeCalledTimes(1);
    expect(NativeAPM.setAppLaunchEnabled).toBeCalledWith(true);
  });

  it('should call the native method setNetworkEnabledIOS', () => {
    Platform.OS = 'ios';
    APM.setNetworkEnabledIOS(true);

    expect(NativeLuciq.setNetworkLoggingEnabled).toBeCalledTimes(1);
    expect(NativeLuciq.setNetworkLoggingEnabled).toBeCalledWith(true);
  });

  it('should not call the native method setNetworkEnabledIOS if platform is android', () => {
    Platform.OS = 'android';
    APM.setNetworkEnabledIOS(true);

    expect(NativeLuciq.setNetworkLoggingEnabled).not.toBeCalled();
  });

  it('should call the native method endAppLaunch', () => {
    APM.endAppLaunch();

    expect(NativeAPM.endAppLaunch).toBeCalledTimes(1);
    expect(NativeAPM.endAppLaunch).toBeCalledWith();
  });

  it('should call the native method setAutoUITraceEnabled', () => {
    APM.setAutoUITraceEnabled(true);

    expect(NativeAPM.setAutoUITraceEnabled).toBeCalledTimes(1);
    expect(NativeAPM.setAutoUITraceEnabled).toBeCalledWith(true);
  });

  it('should call the native method startFlow', () => {
    const appFlowName = 'flowName';

    APM.startFlow(appFlowName);

    expect(NativeAPM.startFlow).toBeCalledTimes(1);
    expect(NativeAPM.startFlow).toBeCalledWith(appFlowName);
  });

  it('should call the native method setFlowAttributes', () => {
    const appFlowName = 'flowName';
    const flowAttributeKey = 'attributeKey';
    const flowAttributeValue = 'attributeValue';

    APM.setFlowAttribute(appFlowName, flowAttributeKey, flowAttributeValue);

    expect(NativeAPM.setFlowAttribute).toBeCalledTimes(1);
    expect(NativeAPM.setFlowAttribute).toBeCalledWith(
      appFlowName,
      flowAttributeKey,
      flowAttributeValue,
    );
  });

  it('should call the native method endFlow', () => {
    const appFlowName = 'flowName';

    APM.endFlow(appFlowName);

    expect(NativeAPM.endFlow).toBeCalledTimes(1);
    expect(NativeAPM.endFlow).toBeCalledWith(appFlowName);
  });

  it('should call the native method startUITrace', () => {
    APM.startUITrace('uiTrace');

    expect(NativeAPM.startUITrace).toBeCalledTimes(1);
    expect(NativeAPM.startUITrace).toBeCalledWith('uiTrace');
  });

  it('should call the native method endUITrace', () => {
    APM.endUITrace();

    expect(NativeAPM.endUITrace).toBeCalledTimes(1);
    expect(NativeAPM.endUITrace).toBeCalledWith();
  });

  it('should call the native method _lcqSleep', () => {
    APM._lcqSleep();

    expect(NativeAPM.lcqSleep).toBeCalledTimes(1);
    expect(NativeAPM.lcqSleep).toBeCalledWith();
  });

  it('should call the native method setScreenRenderEnabled', () => {
    APM.setScreenRenderingEnabled(true);

    expect(NativeAPM.setScreenRenderingEnabled).toBeCalledTimes(1);
    expect(NativeAPM.setScreenRenderingEnabled).toBeCalledWith(true);
  });

  describe('Custom Spans', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Clear active spans before each test
      (APM as any)._activeSpans = new Set();
    });

    describe('startCustomSpan', () => {
      it('should return a CustomSpan when all conditions are met', async () => {
        const span = await APM.startCustomSpan('Test Span');

        expect(span).not.toBeNull();
        expect(span?.getName()).toBe('Test Span');
      });

      it('should return null for empty name', async () => {
        const span = await APM.startCustomSpan('');

        expect(span).toBeNull();
      });

      it('should return null for whitespace-only name', async () => {
        const span = await APM.startCustomSpan('   ');

        expect(span).toBeNull();
      });

      it('should trim whitespace from name', async () => {
        const span = await APM.startCustomSpan('  Test Span  ');

        expect(span?.getName()).toBe('Test Span');
      });

      it('should truncate name to 150 characters', async () => {
        const longName = 'A'.repeat(200);
        const span = await APM.startCustomSpan(longName);

        expect(span?.getName().length).toBe(150);
      });

      it('should enforce 100 span limit', async () => {
        // Create 100 spans
        const spans: CustomSpan[] = [];
        for (let i = 0; i < 100; i++) {
          const span = await APM.startCustomSpan(`Span ${i}`);
          if (span) {
            spans.push(span);
          }
        }
        expect(spans.length).toBe(100);

        // 101st should fail
        const extraSpan = await APM.startCustomSpan('Extra');
        expect(extraSpan).toBeNull();

        // Clean up
        for (const span of spans) {
          await span.end();
        }
      });

      it('should return null when SDK not initialized', async () => {
        (NativeLuciq.isBuilt as jest.Mock).mockResolvedValueOnce(false);

        const span = await APM.startCustomSpan('Test');

        expect(span).toBeNull();
      });

      it('should return null when APM disabled', async () => {
        (NativeAPM.isAPMEnabled as jest.Mock).mockResolvedValueOnce(false);

        const span = await APM.startCustomSpan('Test');

        expect(span).toBeNull();
      });

      it('should return null when custom spans disabled', async () => {
        (NativeAPM.isCustomSpanEnabled as jest.Mock).mockResolvedValueOnce(false);

        const span = await APM.startCustomSpan('Test');

        expect(span).toBeNull();
      });
    });

    describe('addCompletedCustomSpan', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should sync a completed span with valid inputs', async () => {
        const start = new Date(Date.now() - 1000);
        const end = new Date();

        await APM.addCompletedCustomSpan('Test', start, end);

        expect(NativeAPM.syncCustomSpan).toHaveBeenCalledTimes(1);
        const [name, startTimestamp, endTimestamp] = (NativeAPM.syncCustomSpan as jest.Mock).mock
          .calls[0];
        expect(name).toBe('Test');
        expect(startTimestamp).toBe(start.getTime() * 1000);
        expect(endTimestamp).toBe(end.getTime() * 1000);
      });

      it('should reject empty name', async () => {
        const start = new Date(Date.now() - 1000);
        const end = new Date();

        await APM.addCompletedCustomSpan('', start, end);

        expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
      });

      it('should reject end time before start time', async () => {
        const start = new Date();
        const end = new Date(start.getTime() - 1000);

        await APM.addCompletedCustomSpan('Test', start, end);

        expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
      });

      it('should reject equal start and end times', async () => {
        const time = new Date();

        await APM.addCompletedCustomSpan('Test', time, time);

        expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
      });

      it('should truncate long names', async () => {
        const longName = 'A'.repeat(200);
        const start = new Date(Date.now() - 1000);
        const end = new Date();

        await APM.addCompletedCustomSpan(longName, start, end);

        const [name] = (NativeAPM.syncCustomSpan as jest.Mock).mock.calls[0];
        expect(name.length).toBe(150);
      });
    });

    describe('CustomSpan', () => {
      // Mock callbacks for testing
      const mockUnregister = jest.fn();
      const mockSync = jest.fn().mockResolvedValue(undefined);

      beforeEach(() => {
        jest.clearAllMocks();
        mockUnregister.mockClear();
        mockSync.mockClear();
      });

      it('should create a span with the given name', () => {
        const span = new CustomSpan('Test Span', mockUnregister, mockSync);

        expect(span.getName()).toBe('Test Span');
        expect(span.isEnded()).toBe(false);
      });

      it('should capture start time on creation', () => {
        const before = Date.now();
        const span = new CustomSpan('Test', mockUnregister, mockSync);
        const after = Date.now();

        // Start time should be between before and after
        expect((span as any).startTime).toBeGreaterThanOrEqual(before);
        expect((span as any).startTime).toBeLessThanOrEqual(after);
      });

      it('should mark span as ended', async () => {
        const span = new CustomSpan('Test Span', mockUnregister, mockSync);
        await span.end();

        expect(span.isEnded()).toBe(true);
      });

      it('should calculate duration', async () => {
        const span = new CustomSpan('Test Span', mockUnregister, mockSync);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await span.end();

        const duration = span.getDuration();
        expect(duration).toBeGreaterThan(90);
        expect(duration).toBeLessThan(200);
      });

      it('should be idempotent (multiple calls are safe)', async () => {
        const span = new CustomSpan('Test Span', mockUnregister, mockSync);
        await span.end();
        await span.end(); // Second call should not throw
        await span.end(); // Third call should not throw

        expect(span.isEnded()).toBe(true);
        // Should only call sync once
        expect(mockSync).toHaveBeenCalledTimes(1);
      });

      it('should call syncCustomSpan with correct arguments', async () => {
        const span = new CustomSpan('Test Span', mockUnregister, mockSync);
        // Add small delay to ensure end time is after start time
        await new Promise((resolve) => setTimeout(resolve, 10));
        await span.end();

        expect(mockUnregister).toHaveBeenCalledWith(span);
        expect(mockSync).toHaveBeenCalledTimes(1);
        const [name, start, end] = mockSync.mock.calls[0];
        expect(name).toBe('Test Span');
        expect(start).toBeGreaterThan(0);
        expect(end).toBeGreaterThan(start);
      });
    });
  });
});
