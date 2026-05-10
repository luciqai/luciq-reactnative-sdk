import { NativeAPM } from '../../src/native/NativeAPM';
import { NativeLuciq } from '../../src/native/NativeLuciq';
import {
  startCustomSpan,
  addCompletedCustomSpan,
  __resetCustomSpansForTests,
} from '../../src/utils/CustomSpansManager';
// @ts-ignore
import { CustomSpan } from '../../src';

describe('Custom Spans Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCustomSpansForTests();
  });

  describe('startCustomSpan', () => {
    it('should return a CustomSpan when all conditions are met', async () => {
      const span = await startCustomSpan('Test Span');

      expect(span).not.toBeNull();
      expect(span?.getName()).toBe('Test Span');
    });

    it('should return null for empty name', async () => {
      const span = await startCustomSpan('');

      expect(span).toBeNull();
    });

    it('should return null for whitespace-only name', async () => {
      const span = await startCustomSpan('   ');

      expect(span).toBeNull();
    });

    it('should trim whitespace from name', async () => {
      const span = await startCustomSpan('  Test Span  ');

      expect(span?.getName()).toBe('Test Span');
    });

    it('should truncate name to 150 characters', async () => {
      const longName = 'A'.repeat(200);
      const span = await startCustomSpan(longName);

      expect(span?.getName().length).toBe(150);
    });

    it('should enforce 100 span limit', async () => {
      // Create 100 spans
      const spans: CustomSpan[] = [];
      for (let i = 0; i < 100; i++) {
        const span = await startCustomSpan(`Span ${i}`);
        if (span) {
          spans.push(span);
        }
      }
      expect(spans.length).toBe(100);

      // 101st should fail
      const extraSpan = await startCustomSpan('Extra');
      expect(extraSpan).toBeNull();

      // Clean up
      for (const span of spans) {
        await span.end();
      }
    });

    it('should return null when SDK not initialized', async () => {
      (NativeLuciq.isBuilt as jest.Mock).mockResolvedValueOnce(false);

      const span = await startCustomSpan('Test');

      expect(span).toBeNull();
    });

    it('should return null when APM disabled', async () => {
      (NativeAPM.isAPMEnabled as jest.Mock).mockResolvedValueOnce(false);

      const span = await startCustomSpan('Test');

      expect(span).toBeNull();
    });

    it('should return null when custom spans disabled', async () => {
      (NativeAPM.isCustomSpanEnabled as jest.Mock).mockResolvedValueOnce(false);

      const span = await startCustomSpan('Test');

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

      await addCompletedCustomSpan('Test', start, end);

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

      await addCompletedCustomSpan('', start, end);

      expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
    });

    it('should reject end time before start time', async () => {
      const start = new Date();
      const end = new Date(start.getTime() - 1000);

      await addCompletedCustomSpan('Test', start, end);

      expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
    });

    it('should reject equal start and end times', async () => {
      const time = new Date();

      await addCompletedCustomSpan('Test', time, time);

      expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
    });

    it('should truncate long names', async () => {
      const longName = 'A'.repeat(200);
      const start = new Date(Date.now() - 1000);
      const end = new Date();

      await addCompletedCustomSpan(longName, start, end);

      const [name] = (NativeAPM.syncCustomSpan as jest.Mock).mock.calls[0];
      expect(name.length).toBe(150);
    });

    it('should reject whitespace-only name', async () => {
      const start = new Date(Date.now() - 1000);
      const end = new Date();

      await addCompletedCustomSpan('   ', start, end);

      expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
    });

    it('should not sync when SDK is not initialized', async () => {
      (NativeLuciq.isBuilt as jest.Mock).mockResolvedValueOnce(false);

      const start = new Date(Date.now() - 1000);
      const end = new Date();

      await addCompletedCustomSpan('Test', start, end);

      expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
    });

    it('should not sync when APM is disabled', async () => {
      (NativeAPM.isAPMEnabled as jest.Mock).mockResolvedValueOnce(false);

      const start = new Date(Date.now() - 1000);
      const end = new Date();

      await addCompletedCustomSpan('Test', start, end);

      expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
    });

    it('should not sync when custom spans are disabled', async () => {
      (NativeAPM.isCustomSpanEnabled as jest.Mock).mockResolvedValueOnce(false);

      const start = new Date(Date.now() - 1000);
      const end = new Date();

      await addCompletedCustomSpan('Test', start, end);

      expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully in addCompletedCustomSpan', async () => {
      (NativeLuciq.isBuilt as jest.Mock).mockRejectedValueOnce(new Error('native error'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const start = new Date(Date.now() - 1000);
      const end = new Date();

      await addCompletedCustomSpan('Test', start, end);

      expect(NativeAPM.syncCustomSpan).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('startCustomSpan error handling', () => {
    it('should handle errors gracefully in startCustomSpan', async () => {
      (NativeLuciq.isBuilt as jest.Mock).mockRejectedValueOnce(new Error('native error'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const span = await startCustomSpan('Test');

      expect(span).toBeNull();
      errorSpy.mockRestore();
    });
  });
});
