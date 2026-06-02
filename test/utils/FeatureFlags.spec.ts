import { FeatureFlags, registerFeatureFlagsListener } from '../../src/utils/FeatureFlags';
import * as Luciq from '../../src/modules/Luciq';
import { NativeLuciq } from '../../src/native/NativeLuciq';

describe('FeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('default getters delegate to native', () => {
    it('isW3ExternalTraceID calls NativeLuciq.isW3ExternalTraceIDEnabled', () => {
      const spy = jest
        .spyOn(NativeLuciq, 'isW3ExternalTraceIDEnabled')
        .mockReturnValue(true as any);
      FeatureFlags.isW3ExternalTraceID();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('isW3ExternalGeneratedHeader calls NativeLuciq.isW3ExternalGeneratedHeaderEnabled', () => {
      const spy = jest
        .spyOn(NativeLuciq, 'isW3ExternalGeneratedHeaderEnabled')
        .mockReturnValue(false as any);
      FeatureFlags.isW3ExternalGeneratedHeader();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('isW3CaughtHeader calls NativeLuciq.isW3CaughtHeaderEnabled', () => {
      const spy = jest.spyOn(NativeLuciq, 'isW3CaughtHeaderEnabled').mockReturnValue(true as any);
      FeatureFlags.isW3CaughtHeader();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('networkLogLimit calls NativeLuciq.getNetworkBodyMaxSize', () => {
      const spy = jest.spyOn(NativeLuciq, 'getNetworkBodyMaxSize').mockReturnValue(1024 as any);
      FeatureFlags.networkLogLimit();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerFeatureFlagsListener', () => {
    it('registers a listener and replaces getters with payload-backed values', async () => {
      let capturedHandler:
        | ((payload: {
            isW3ExternalTraceIDEnabled: boolean;
            isW3ExternalGeneratedHeaderEnabled: boolean;
            isW3CaughtHeaderEnabled: boolean;
            networkBodyLimit: number;
          }) => void)
        | undefined;

      const registerSpy = jest
        .spyOn(Luciq, '_registerFeatureFlagsChangeListener')
        .mockImplementation((handler) => {
          capturedHandler = handler;
        });

      registerFeatureFlagsListener();

      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(capturedHandler).toBeDefined();

      capturedHandler!({
        isW3ExternalTraceIDEnabled: true,
        isW3ExternalGeneratedHeaderEnabled: false,
        isW3CaughtHeaderEnabled: true,
        networkBodyLimit: 2048,
      });

      await expect(FeatureFlags.isW3ExternalTraceID()).resolves.toBe(true);
      await expect(FeatureFlags.isW3ExternalGeneratedHeader()).resolves.toBe(false);
      await expect(FeatureFlags.isW3CaughtHeader()).resolves.toBe(true);
      await expect(FeatureFlags.networkLogLimit()).resolves.toBe(2048);

      registerSpy.mockRestore();
    });

    it('subsequent payloads update the cached values', async () => {
      let capturedHandler: any;
      const registerSpy = jest
        .spyOn(Luciq, '_registerFeatureFlagsChangeListener')
        .mockImplementation((handler) => {
          capturedHandler = handler;
        });

      registerFeatureFlagsListener();

      capturedHandler({
        isW3ExternalTraceIDEnabled: false,
        isW3ExternalGeneratedHeaderEnabled: true,
        isW3CaughtHeaderEnabled: false,
        networkBodyLimit: 100,
      });

      await expect(FeatureFlags.isW3ExternalTraceID()).resolves.toBe(false);
      await expect(FeatureFlags.networkLogLimit()).resolves.toBe(100);

      capturedHandler({
        isW3ExternalTraceIDEnabled: true,
        isW3ExternalGeneratedHeaderEnabled: false,
        isW3CaughtHeaderEnabled: true,
        networkBodyLimit: 9999,
      });

      await expect(FeatureFlags.isW3ExternalTraceID()).resolves.toBe(true);
      await expect(FeatureFlags.isW3ExternalGeneratedHeader()).resolves.toBe(false);
      await expect(FeatureFlags.isW3CaughtHeader()).resolves.toBe(true);
      await expect(FeatureFlags.networkLogLimit()).resolves.toBe(9999);

      registerSpy.mockRestore();
    });
  });
});
