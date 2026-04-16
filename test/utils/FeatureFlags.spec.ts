import '../mocks/mockNativeModules';

import { NativeLuciq } from '../../src/native/NativeLuciq';
import { FeatureFlags, registerFeatureFlagsListener } from '../../src/utils/FeatureFlags';
import { _registerFeatureFlagsChangeListener } from '../../src/modules/Luciq';

jest.mock('../../src/modules/Luciq', () => ({
  _registerFeatureFlagsChangeListener: jest.fn(),
}));

describe('FeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isW3ExternalTraceID should call NativeLuciq.isW3ExternalTraceIDEnabled', () => {
    FeatureFlags.isW3ExternalTraceID();
    expect(NativeLuciq.isW3ExternalTraceIDEnabled).toHaveBeenCalled();
  });

  it('isW3ExternalGeneratedHeader should call NativeLuciq.isW3ExternalGeneratedHeaderEnabled', () => {
    FeatureFlags.isW3ExternalGeneratedHeader();
    expect(NativeLuciq.isW3ExternalGeneratedHeaderEnabled).toHaveBeenCalled();
  });

  it('isW3CaughtHeader should call NativeLuciq.isW3CaughtHeaderEnabled', () => {
    FeatureFlags.isW3CaughtHeader();
    expect(NativeLuciq.isW3CaughtHeaderEnabled).toHaveBeenCalled();
  });

  it('networkLogLimit should call NativeLuciq.getNetworkBodyMaxSize', () => {
    FeatureFlags.networkLogLimit();
    expect(NativeLuciq.getNetworkBodyMaxSize).toHaveBeenCalled();
  });

  describe('registerFeatureFlagsListener', () => {
    it('should call _registerFeatureFlagsChangeListener and update FeatureFlags on callback', async () => {
      const mockRegister = _registerFeatureFlagsChangeListener as jest.Mock;

      registerFeatureFlagsListener();

      expect(mockRegister).toHaveBeenCalledTimes(1);
      const callback = mockRegister.mock.calls[0][0];

      // Simulate a feature flags change event
      callback({
        isW3ExternalTraceIDEnabled: true,
        isW3ExternalGeneratedHeaderEnabled: false,
        isW3CaughtHeaderEnabled: true,
        networkBodyLimit: 2048,
      });

      // After the callback, FeatureFlags methods should return the updated values
      expect(await FeatureFlags.isW3ExternalTraceID()).toBe(true);
      expect(await FeatureFlags.isW3ExternalGeneratedHeader()).toBe(false);
      expect(await FeatureFlags.isW3CaughtHeader()).toBe(true);
      expect(await FeatureFlags.networkLogLimit()).toBe(2048);
    });
  });
});
