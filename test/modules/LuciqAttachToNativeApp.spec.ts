import '../mocks/mockLuciqUtils';
import '../mocks/mockNetworkLogger';

import { Platform } from 'react-native';

import type * as LuciqModule from '../../src/modules/Luciq';
import type * as NativeLuciqModule from '../../src/native/NativeLuciq';
import type * as LuciqUtilsModule from '../../src/utils/LuciqUtils';
import type * as UnhandledRejectionModule from '../../src/utils/UnhandledRejectionTracking';
import {
  AutoMaskingType,
  InvocationEvent,
  LogLevel,
  NetworkInterceptionMode,
} from '../../src/utils/Enums';

jest.mock('../../src/modules/NetworkLogger');
jest.mock('../../src/utils/UnhandledRejectionTracking');

/**
 * `init` and `attachToNativeApp` record which one started the SDK in module state, so every case
 * loads a fresh copy of the module (and of the mocks it talks to).
 */
function loadFresh() {
  let modules!: {
    Luciq: typeof LuciqModule;
    NativeLuciq: typeof NativeLuciqModule.NativeLuciq;
    LuciqUtils: typeof LuciqUtilsModule;
    captureUnhandledRejections: typeof UnhandledRejectionModule.captureUnhandledRejections;
  };
  jest.isolateModules(() => {
    modules = {
      Luciq: require('../../src/modules/Luciq'),
      NativeLuciq: require('../../src/native/NativeLuciq').NativeLuciq,
      // The shared mock has no __esModule flag, so Luciq.ts's default import is the mock module itself.
      LuciqUtils: require('../../src/utils/LuciqUtils'),
      captureUnhandledRejections: require('../../src/utils/UnhandledRejectionTracking')
        .captureUnhandledRejections,
    };
  });
  return modules;
}

const initConfig = { token: 'some-token', invocationEvents: [InvocationEvent.none] };

describe('Luciq.attachToNativeApp', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Platform.OS = 'android';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('attaches through the native bridge without starting the SDK again', () => {
    const { Luciq, NativeLuciq } = loadFresh();

    Luciq.attachToNativeApp({ debugLogsLevel: LogLevel.debug });

    expect(NativeLuciq.attachToNativeApp).toBeCalledTimes(1);
    expect(NativeLuciq.attachToNativeApp).toBeCalledWith(LogLevel.debug);
    expect(NativeLuciq.init).not.toBeCalled();
  });

  it('defaults the React Native log level to error', () => {
    const { Luciq, NativeLuciq } = loadFresh();

    Luciq.attachToNativeApp();

    expect(NativeLuciq.attachToNativeApp).toBeCalledWith(LogLevel.error);
  });

  it('captures JavaScript errors and unhandled rejections', () => {
    const { Luciq, LuciqUtils, captureUnhandledRejections } = loadFresh();

    Luciq.attachToNativeApp();

    expect(LuciqUtils.captureJsErrors).toBeCalledTimes(1);
    expect(captureUnhandledRejections).toBeCalledTimes(1);
  });

  it('never reports a placeholder "Initial Screen"', () => {
    const { Luciq, NativeLuciq } = loadFresh();

    Luciq.attachToNativeApp({ networkInterceptionMode: NetworkInterceptionMode.native });
    jest.runAllTimers();

    expect(NativeLuciq.reportScreenChange).not.toBeCalledWith('Initial Screen', null);
    expect(NativeLuciq.reportCurrentViewChange).not.toBeCalledWith('Initial Screen');
  });

  it('ignores init after attachToNativeApp, so the native app is never started twice', () => {
    const { Luciq, NativeLuciq } = loadFresh();
    Luciq.attachToNativeApp();

    Luciq.init(initConfig);

    expect(NativeLuciq.init).not.toBeCalled();
  });

  it('ignores attachToNativeApp after init', () => {
    const { Luciq, NativeLuciq } = loadFresh();
    Luciq.init(initConfig);

    Luciq.attachToNativeApp();

    expect(NativeLuciq.attachToNativeApp).not.toBeCalled();
    expect(NativeLuciq.init).toBeCalledTimes(1);
  });

  it('still allows init to be called more than once, as before', () => {
    const { Luciq, NativeLuciq } = loadFresh();

    Luciq.init(initConfig);
    Luciq.init(initConfig);

    expect(NativeLuciq.init).toBeCalledTimes(2);
  });

  it('ignores enableAutoMasking, which the native app owns in a hybrid app', () => {
    const { Luciq, NativeLuciq } = loadFresh();

    Luciq.attachToNativeApp();
    Luciq.enableAutoMasking([AutoMaskingType.labels]);

    expect(NativeLuciq.enableAutoMasking).not.toBeCalled();
  });

  it('still forwards enableAutoMasking after init', () => {
    const { Luciq, NativeLuciq } = loadFresh();

    Luciq.init(initConfig);
    Luciq.enableAutoMasking([AutoMaskingType.labels]);

    expect(NativeLuciq.enableAutoMasking).toBeCalledWith([AutoMaskingType.labels]);
  });

  describe('Android network interception', () => {
    /** Loads a fresh module graph with the native flags stubbed, and spies on what attach decides. */
    function loadWithNativeFlags(cpNativeInterceptionEnabled: boolean, hasAPMPlugin: boolean) {
      let deps!: {
        Luciq: typeof LuciqModule;
        LuciqUtils: typeof LuciqUtilsModule;
        NetworkLogger: typeof import('../../src/modules/NetworkLogger');
        NativeNetworkLogger: typeof import('../../src/native/NativeNetworkLogger').NativeNetworkLogger;
        Logger: typeof import('../../src/utils/logger').Logger;
        LuciqConstants: typeof import('../../src/utils/LuciqConstants').default;
      };
      jest.isolateModules(() => {
        deps = {
          Luciq: require('../../src/modules/Luciq'),
          LuciqUtils: require('../../src/utils/LuciqUtils'),
          NetworkLogger: require('../../src/modules/NetworkLogger'),
          NativeNetworkLogger: require('../../src/native/NativeNetworkLogger').NativeNetworkLogger,
          Logger: require('../../src/utils/logger').Logger,
          LuciqConstants: require('../../src/utils/LuciqConstants').default,
        };
      });
      jest
        .mocked(deps.NativeNetworkLogger.isNativeInterceptionEnabled)
        .mockReturnValue(cpNativeInterceptionEnabled);
      jest.mocked(deps.NativeNetworkLogger.hasAPMNetworkPlugin).mockResolvedValue(hasAPMPlugin);
      const flagsSpy = jest.spyOn(deps.LuciqUtils, 'setApmNetworkFlagsIfChanged');
      const errorSpy = jest.spyOn(deps.Logger, 'error');
      return { ...deps, flagsSpy, errorSpy };
    }

    /** Lets the awaited native hasAPMNetworkPlugin read resolve. */
    const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate);

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('given the native flag and plugin are on when attaching in native mode then native interception is used without a disabled error', async () => {
      const { Luciq, flagsSpy, errorSpy, LuciqConstants } = loadWithNativeFlags(true, true);

      Luciq.attachToNativeApp({ networkInterceptionMode: NetworkInterceptionMode.native });
      await flushPromises();

      expect(flagsSpy).toHaveBeenLastCalledWith({
        isNativeInterceptionFeatureEnabled: true,
        hasAPMNetworkPlugin: true,
        shouldEnableNativeInterception: true,
      });
      expect(errorSpy).not.toBeCalledWith(
        expect.anything(),
        LuciqConstants.NATIVE_INTERCEPTION_DISABLED_MESSAGE,
      );
    });

    it('given the native flag and plugin are on when attaching in javascript mode then it switches to native interception', async () => {
      const { Luciq, flagsSpy } = loadWithNativeFlags(true, true);

      Luciq.attachToNativeApp({ networkInterceptionMode: NetworkInterceptionMode.javascript });
      await flushPromises();

      expect(flagsSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ shouldEnableNativeInterception: true }),
      );
    });

    it('given the native flag is off when attaching in native mode then it keeps JavaScript interception and reports it disabled', async () => {
      const { Luciq, flagsSpy, errorSpy, NetworkLogger, LuciqConstants } = loadWithNativeFlags(
        false,
        true,
      );

      Luciq.attachToNativeApp({ networkInterceptionMode: NetworkInterceptionMode.native });
      await flushPromises();

      expect(NetworkLogger.setEnabled).toBeCalledWith(true);
      expect(flagsSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ shouldEnableNativeInterception: false }),
      );
      expect(errorSpy).toBeCalledWith(
        expect.anything(),
        LuciqConstants.NATIVE_INTERCEPTION_DISABLED_MESSAGE,
      );
    });

    it('given the native read fails when attaching then the JavaScript interceptor stays on', async () => {
      const { Luciq, NativeNetworkLogger, NetworkLogger, flagsSpy } = loadWithNativeFlags(
        true,
        true,
      );
      jest.mocked(NativeNetworkLogger.hasAPMNetworkPlugin).mockRejectedValue(new Error('boom'));

      Luciq.attachToNativeApp({ networkInterceptionMode: NetworkInterceptionMode.native });
      await flushPromises();

      expect(NetworkLogger.setEnabled).toBeCalledWith(true);
      expect(flagsSpy).not.toBeCalledWith(
        expect.objectContaining({ shouldEnableNativeInterception: true }),
      );
    });
  });

  it('attaches on iOS too', () => {
    Platform.OS = 'ios';
    const { Luciq, NativeLuciq } = loadFresh();

    Luciq.attachToNativeApp();

    expect(NativeLuciq.attachToNativeApp).toBeCalledTimes(1);
    expect(NativeLuciq.init).not.toBeCalled();
  });
});
