import '../mocks/mockNativeModules';

import * as CrashReporting from '../../src/modules/CrashReporting';
import { NativeCrashReporting } from '../../src/native/NativeCrashReporting';
import { Platform } from 'react-native';
import { NonFatalErrorLevel } from '../../src';
import { getCrashDataFromError } from '../../src/utils/LuciqUtils';

describe('CrashReporting Module', () => {
  it('should call the native method setEnabled', () => {
    CrashReporting.setEnabled(true);

    expect(NativeCrashReporting.setEnabled).toBeCalledTimes(1);
    expect(NativeCrashReporting.setEnabled).toBeCalledWith(true);
  });

  it('should call the native method sendHandledJSCrash with error, fingerprint and level', async () => {
    const error = new TypeError('Invalid type');
    const fingerprint = 'fingerprint';
    const level = NonFatalErrorLevel.critical;

    await CrashReporting.reportError(error, { fingerprint, level });
    const crashData = getCrashDataFromError(error);
    expect(NativeCrashReporting.sendHandledJSCrash).toBeCalledWith(
      crashData,
      undefined,
      fingerprint,
      level,
    );
  });

  it('should call the native method setNDKCrashesEnabled for Android platform', () => {
    Platform.OS = 'android';
    CrashReporting.setNDKCrashesEnabled(true);

    expect(NativeCrashReporting.setNDKCrashesEnabled).toBeCalledTimes(1);
    expect(NativeCrashReporting.setNDKCrashesEnabled).toBeCalledWith(true);
  });

  it('should not call the native method setNDKCrashesEnabled for ios platform', () => {
    Platform.OS = 'ios';
    CrashReporting.setNDKCrashesEnabled(true);

    expect(NativeCrashReporting.setNDKCrashesEnabled).not.toBeCalled();
  });

  it('should warn and return when reportError is called with a non-Error object', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // @ts-ignore - intentionally passing non-Error
    const result = CrashReporting.reportError('not an error');

    expect(result).toBeUndefined();
    expect(NativeCrashReporting.sendHandledJSCrash).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should use default NonFatalErrorLevel.error when no level is provided', async () => {
    const error = new TypeError('Invalid type');

    await CrashReporting.reportError(error);
    const crashData = getCrashDataFromError(error);
    expect(NativeCrashReporting.sendHandledJSCrash).toBeCalledWith(
      crashData,
      undefined,
      undefined,
      NonFatalErrorLevel.error,
    );
  });
});
