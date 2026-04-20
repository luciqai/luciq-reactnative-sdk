import '../mocks/mockLuciqUtils';
import '../mocks/mockNetworkLogger';

import { findNodeHandle, Platform } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native'; // Import the hook
import { mocked } from 'jest-mock';
import waitForExpect from 'wait-for-expect';

import Report from '../../src/models/Report';
import * as Luciq from '../../src/modules/Luciq';
import * as NetworkLogger from '../../src/modules/NetworkLogger';
import { emitter, NativeEvents, NativeLuciq } from '../../src/native/NativeLuciq';
import {
  AutoMaskingType,
  ColorTheme,
  type LuciqConfig,
  InvocationEvent,
  Locale,
  LogLevel,
  NetworkInterceptionMode,
  OverAirUpdateServices,
  ReproStepsMode,
  StringKey,
  WelcomeMessageMode,
} from '../../src';
import LuciqUtils from '../../src/utils/LuciqUtils';
import type { FeatureFlag } from '../../src/models/FeatureFlag';
import { Logger } from '../../src/utils/logger';
import { NativeNetworkLogger } from '../../src/native/NativeNetworkLogger';
import LuciqConstants from '../../src/utils/LuciqConstants';

jest.mock('../../src/modules/NetworkLogger');

function fakeTimer(callback: () => void) {
  setTimeout(callback, 100);
}

describe('Luciq Module', () => {
  beforeEach(() => {
    const events = Object.values(NativeEvents);
    events.forEach((event) => {
      emitter.removeAllListeners(event);
    });
  });

  it('should call the native method setEnabled', () => {
    Luciq.setEnabled(true);

    expect(NativeLuciq.setEnabled).toBeCalledTimes(1);
    expect(NativeLuciq.setEnabled).toBeCalledWith(true);
  });

  it('should call the native method setWebViewMonitoringEnabled', () => {
    Luciq.setWebViewMonitoringEnabled(true);

    expect(NativeLuciq.setWebViewMonitoringEnabled).toBeCalledTimes(1);
    expect(NativeLuciq.setWebViewMonitoringEnabled).toBeCalledWith(true);
  });

  it('should call the native method setWebViewNetworkTrackingEnabled', () => {
    Luciq.setWebViewNetworkTrackingEnabled(true);

    expect(NativeLuciq.setWebViewNetworkTrackingEnabled).toBeCalledTimes(1);
    expect(NativeLuciq.setWebViewNetworkTrackingEnabled).toBeCalledWith(true);
  });

  it('should call the native method setWebViewUserInteractionsTrackingEnabled', () => {
    Luciq.setWebViewUserInteractionsTrackingEnabled(true);

    expect(NativeLuciq.setWebViewUserInteractionsTrackingEnabled).toBeCalledTimes(1);
    expect(NativeLuciq.setWebViewUserInteractionsTrackingEnabled).toBeCalledWith(true);
  });

  it('reportScreenChange should call the native method reportScreenChange', () => {
    const screenName = 'some-screen';
    Luciq.reportScreenChange(screenName);
    expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
    expect(NativeLuciq.reportScreenChange).toBeCalledWith(screenName);
  });

  it('componentDidAppearListener should call the native method reportScreenChange', () => {
    const screenName = 'some-screen';

    Luciq.componentDidAppearListener({
      componentId: '1',
      componentName: screenName,
      componentType: 'Component',
    });

    expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
    expect(NativeLuciq.reportScreenChange).toBeCalledWith(screenName);
  });

  it("componentDidAppearListener shouldn't call the native method reportScreenChange if first screen", () => {
    Luciq.init({
      token: 'some-token',
      invocationEvents: [InvocationEvent.none],
    });

    Luciq.componentDidAppearListener({
      componentId: '1',
      componentName: 'screen',
      componentType: 'Component',
    });

    waitForExpect(() => {
      // Only first screen should be reported
      expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
      expect(NativeLuciq.reportScreenChange).toBeCalledWith('Initial Screen');
    });
  });

  it("componentDidAppearListener shouldn't call the native method reportScreenChange twice if same screen", (done) => {
    Luciq.init({
      token: 'some-token',
      invocationEvents: [InvocationEvent.none],
    });

    Array(5).forEach(() => {
      Luciq.componentDidAppearListener({
        componentId: '1',
        componentName: 'screen',
        componentType: 'Component',
      });
    });

    setTimeout(() => {
      // It won't report any screen change, here's why:
      // 1. First call:
      //    It's the first screen so:
      //      1. It doesn't report a screen change
      //      2. It sets _isFirstScreen to false
      //      3. It sets _lastScreen to "screen"
      // 2. Second+ calls:
      //    The screen name is the same as _lastScreen (stored in 1st call)
      //    so it doesn't report a screen change
      expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
      done();
    }, 1500);
  });

  it('onNavigationStateChange should call the native method reportScreenChange', async () => {
    LuciqUtils.getActiveRouteName = jest.fn().mockImplementation((screenName) => screenName);

    // @ts-ignore
    Luciq.onNavigationStateChange('home', 'settings');

    await waitForExpect(() => {
      expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
      expect(NativeLuciq.reportScreenChange).toBeCalledWith('settings');
    });
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('onNavigationStateChange should call the native method reportCurrentViewChange on Android Platform', async () => {
    Platform.OS = 'android';
    LuciqUtils.getActiveRouteName = jest.fn().mockImplementation((screenName) => screenName);

    // @ts-ignore
    Luciq.onNavigationStateChange('home', 'settings');

    await waitForExpect(() => {
      expect(NativeLuciq.reportCurrentViewChange).toBeCalledTimes(1);
      expect(NativeLuciq.reportCurrentViewChange).toBeCalledWith('settings');
    });
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('onNavigationStateChange should not call the native method reportCurrentViewChange on iOS Platform', async () => {
    Platform.OS = 'ios';
    LuciqUtils.getActiveRouteName = jest.fn().mockImplementation((screenName) => screenName);

    // @ts-ignore
    Luciq.onNavigationStateChange('home', 'settings');

    await waitForExpect(() => {
      expect(NativeLuciq.reportCurrentViewChange).not.toBeCalled();
    });
  });

  it('onNavigationStateChange should not call the native method reportScreenChange if screen is the same', (done) => {
    LuciqUtils.getActiveRouteName = jest.fn().mockImplementation((screenName) => screenName);

    // @ts-ignore
    Luciq.onNavigationStateChange('home', 'home');

    // Wait for 1.5s as reportScreenChange is delayed by 1s
    setTimeout(() => {
      expect(NativeLuciq.reportScreenChange).not.toBeCalled();
      done();
    }, 1500);
  });

  it('onNavigationStateChange should not call the native method reportCurrentViewChange if screen is the same', (done) => {
    LuciqUtils.getActiveRouteName = jest.fn().mockImplementation((screenName) => screenName);

    // @ts-ignore
    Luciq.onNavigationStateChange('home', 'home');

    // Wait for 1.5s as reportScreenChange is delayed by 1s
    setTimeout(() => {
      expect(NativeLuciq.reportCurrentViewChange).not.toBeCalled();
      done();
    }, 1500);
  });

  it('onNavigationStateChange should call the native method reportScreenChange immediately if _currentScreen is set', async () => {
    LuciqUtils.getActiveRouteName = jest.fn().mockImplementation((screenName) => screenName);

    // sets _currentScreen and waits for 1s as _currentScreen is null
    // @ts-ignore
    Luciq.onNavigationStateChange('home', 'settings');

    // _currentScreen already set in prev call so it reports a screen change immediately
    // @ts-ignore
    Luciq.onNavigationStateChange('home', 'settings');

    expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
    expect(NativeLuciq.reportScreenChange).toBeCalledWith('settings');

    await waitForExpect(() => expect(NativeLuciq.reportScreenChange).toBeCalledTimes(2));
  });

  it('onStateChange should call the native method reportScreenChange', async () => {
    const state = { routes: [{ name: 'ScreenName' }], index: 0 };
    // @ts-ignore
    Luciq.onStateChange(state);

    await waitForExpect(() => {
      expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
      expect(NativeLuciq.reportScreenChange).toBeCalledWith('ScreenName');
    });
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('onStateChange should call the native method reportCurrentViewChange on Android Platform', async () => {
    Platform.OS = 'android';
    const state = { routes: [{ name: 'ScreenName' }], index: 0 };
    // @ts-ignore
    Luciq.onStateChange(state);

    await waitForExpect(() => {
      expect(NativeLuciq.reportCurrentViewChange).toBeCalledTimes(1);
      expect(NativeLuciq.reportCurrentViewChange).toBeCalledWith('ScreenName');
    });
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('onStateChange should not call the native method reportCurrentViewChange on iOS Platform', async () => {
    Platform.OS = 'ios';
    const state = { routes: [{ name: 'ScreenName' }], index: 0 };
    // @ts-ignore
    Luciq.onStateChange(state);

    await waitForExpect(() => {
      expect(NativeLuciq.reportCurrentViewChange).not.toBeCalled();
    });
  });

  it('onStateChange should call the native method reportScreenChange immediately if _currentScreen is set', async () => {
    // sets _currentScreen and waits for 1s as _currentScreen is null
    const state = { routes: [{ name: 'ScreenName' }], index: 0 };

    // @ts-ignore
    Luciq.onStateChange(state);

    // _currentScreen already set in prev call so it reports a screen change immediately
    // @ts-ignore
    Luciq.onStateChange(state);

    expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
    expect(NativeLuciq.reportScreenChange).toBeCalledWith('ScreenName');

    await waitForExpect(() => expect(NativeLuciq.reportScreenChange).toBeCalledTimes(2));
  });

  it('setNavigationListener should call the onStateChange on a screen change', async () => {
    const mockedState = { routes: [{ name: 'ScreenName' }], index: 0 };

    const mockNavigationContainerRef = {
      current: null,
      navigate: jest.fn(),
      reset: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      getRootState: () => mockedState,
      canGoBack: jest.fn(),

      addListener: jest.fn((event, callback) => {
        expect(event).toBe('state');
        callback(mockedState);
        return jest.fn();
      }),
      removeListener: jest.fn(),
    } as unknown as NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;

    const onStateChangeMock = jest.fn();

    jest.spyOn(Luciq, 'onStateChange').mockImplementation(onStateChangeMock);

    Luciq.setNavigationListener(mockNavigationContainerRef);

    expect(mockNavigationContainerRef.addListener).toBeCalledTimes(1);
    expect(mockNavigationContainerRef.addListener).toHaveBeenCalledWith(
      'state',
      expect.any(Function),
    );

    expect(onStateChangeMock).toBeCalledTimes(1);
    expect(onStateChangeMock).toHaveBeenCalledWith(mockNavigationContainerRef.getRootState());
  });

  it('should call the native method init', () => {
    const luciqConfig = {
      token: 'some-token',
      invocationEvents: [InvocationEvent.floatingButton, InvocationEvent.shake],
      debugLogsLevel: LogLevel.debug,
      codePushVersion: '1.1.0',
      ignoreAndroidSecureFlag: true,
      overAirVersion: {
        service: OverAirUpdateServices.expo,
        version: 'D0A12345-6789-4B3C-A123-4567ABCDEF01',
      },
    };
    const usesNativeNetworkInterception = false;

    Luciq.init(luciqConfig);

    expect(NetworkLogger.setEnabled).toBeCalledWith(true);
    expect(NativeLuciq.init).toBeCalledTimes(1);
    expect(NativeLuciq.init).toBeCalledWith(
      luciqConfig.token,
      luciqConfig.invocationEvents,
      luciqConfig.debugLogsLevel,
      usesNativeNetworkInterception,
      luciqConfig.codePushVersion,
      undefined,
      { ignoreAndroidSecureFlag: luciqConfig.ignoreAndroidSecureFlag },
      luciqConfig.overAirVersion,
    );
  });

  it('setCodePushVersion should call native method setCodePushVersion', () => {
    const codePushVersion = '123';

    Luciq.setCodePushVersion(codePushVersion);

    expect(NativeLuciq.setCodePushVersion).toBeCalledTimes(1);
    expect(NativeLuciq.setCodePushVersion).toBeCalledWith(codePushVersion);
  });

  it('setOverAirVersion should call native method setOverAirVersion', () => {
    const OTAversion = {
      service: OverAirUpdateServices.expo,
      version: 'D0A12345-6789-4B3C-A123-4567ABCDEF01',
    };

    Luciq.setOverAirVersion(OTAversion);

    expect(NativeLuciq.setOverAirVersion).toBeCalledTimes(1);
    expect(NativeLuciq.setOverAirVersion).toBeCalledWith(OTAversion);
  });

  it('init should disable JavaScript interceptor when using native interception mode', () => {
    const luciqConfig = {
      token: 'some-token',
      invocationEvents: [InvocationEvent.floatingButton, InvocationEvent.shake],
      debugLogsLevel: LogLevel.debug,
      networkInterceptionMode: NetworkInterceptionMode.native,
      codePushVersion: '1.1.0',
      ignoreAndroidSecureFlag: true,
      overAirVersion: {
        service: OverAirUpdateServices.expo,
        version: 'D0A12345-6789-4B3C-A123-4567ABCDEF01',
      },
    };

    // Stubbing Network feature flags
    jest.spyOn(NativeNetworkLogger, 'isNativeInterceptionEnabled').mockReturnValue(true);
    jest.spyOn(NativeNetworkLogger, 'hasAPMNetworkPlugin').mockReturnValue(Promise.resolve(true));

    Luciq.init(luciqConfig);

    if (Platform.OS === 'android') {
      expect(NetworkLogger.setEnabled).not.toBeCalled();
      expect(NativeLuciq.init).toBeCalledTimes(1);

      expect(NativeLuciq.init).toBeCalledWith(
        luciqConfig.token,
        luciqConfig.invocationEvents,
        luciqConfig.debugLogsLevel,
        // usesNativeNetworkInterception should be false when using native interception mode with Android
        false,
        luciqConfig.codePushVersion,
        luciqConfig.overAirVersion,
      );
    } else {
      expect(NativeLuciq.init).toBeCalledTimes(1);

      expect(NativeLuciq.init).toBeCalledWith(
        luciqConfig.token,
        luciqConfig.invocationEvents,
        luciqConfig.debugLogsLevel,
        // usesNativeNetworkInterception should be true when using native interception mode with iOS
        true,
        luciqConfig.codePushVersion,
        undefined,
        { ignoreAndroidSecureFlag: luciqConfig.ignoreAndroidSecureFlag },
        luciqConfig.overAirVersion,
      );
    }
  });

  it('should report the first screen on SDK initialization', async () => {
    Luciq.init({
      token: 'some-token',
      invocationEvents: [InvocationEvent.none],
    });

    await waitForExpect(() => {
      expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
      expect(NativeLuciq.reportScreenChange).toBeCalledWith('Initial Screen');
    });
  });

  it('init should call reportCurrentViewChange on Android Platform', async () => {
    Platform.OS = 'android';
    Luciq.init({
      token: 'some-token',
      invocationEvents: [InvocationEvent.none],
    });

    await waitForExpect(() => {
      expect(NativeLuciq.reportCurrentViewChange).toBeCalledTimes(1);
      expect(NativeLuciq.reportCurrentViewChange).toBeCalledWith('Initial Screen');
    });
  });

  it('init should not call reportCurrentViewChange on ios Platform', async () => {
    Platform.OS = 'ios';
    Luciq.init({
      token: 'some-token',
      invocationEvents: [InvocationEvent.none],
    });

    await waitForExpect(() => {
      expect(NativeLuciq.reportCurrentViewChange).not.toBeCalled();
    });
  });

  it('should call the native method setUserData', () => {
    const userData = 'userData';
    Luciq.setUserData(userData);

    expect(NativeLuciq.setUserData).toBeCalledTimes(1);
    expect(NativeLuciq.setUserData).toBeCalledWith(userData);
  });

  it('should call the native method setTrackUserSteps', () => {
    Platform.OS = 'ios';
    Luciq.setTrackUserSteps(true);

    expect(NativeLuciq.setTrackUserSteps).toBeCalledTimes(1);
    expect(NativeLuciq.setTrackUserSteps).toBeCalledWith(true);
  });

  it('should not call the native method setTrackUserSteps when platform is android', () => {
    Platform.OS = 'android';
    Luciq.setTrackUserSteps(true);

    expect(NativeLuciq.setTrackUserSteps).not.toBeCalled();
  });

  it('should call the native method setLCQLogPrintsToConsole', () => {
    Platform.OS = 'ios';
    Luciq.setLCQLogPrintsToConsole(true);

    expect(NativeLuciq.setLCQLogPrintsToConsole).toBeCalledTimes(1);
    expect(NativeLuciq.setLCQLogPrintsToConsole).toBeCalledWith(true);
  });

  it('should not call the native method setLCQLogPrintsToConsole when platform is android', () => {
    Platform.OS = 'android';
    Luciq.setLCQLogPrintsToConsole(true);

    expect(NativeLuciq.setLCQLogPrintsToConsole).not.toBeCalled();
  });

  it('should call the native method setSessionProfilerEnabled', () => {
    Luciq.setSessionProfilerEnabled(true);

    expect(NativeLuciq.setSessionProfilerEnabled).toBeCalledTimes(1);
    expect(NativeLuciq.setSessionProfilerEnabled).toBeCalledWith(true);
  });

  it('should call the native method setLocale', () => {
    const locale = Locale.english;
    Luciq.setLocale(locale);

    expect(NativeLuciq.setLocale).toBeCalledTimes(1);
    expect(NativeLuciq.setLocale).toBeCalledWith(locale);
  });

  it('should call the native method setColorTheme', () => {
    const theme = ColorTheme.dark;
    Luciq.setColorTheme(theme);

    expect(NativeLuciq.setColorTheme).toBeCalledTimes(1);
    expect(NativeLuciq.setColorTheme).toBeCalledWith(theme);
  });

  it('should call the native method setPrimaryColor on iOS', () => {
    Platform.OS = 'ios';
    const color = '#fff';
    Luciq.setTheme({ primaryColor: color });

    expect(NativeLuciq.setTheme).toBeCalledTimes(1);
    expect(NativeLuciq.setTheme).toBeCalledWith({ primaryColor: color });
  });

  it('should call the native method appendTags', () => {
    const tags = ['tag1', 'tag2'];
    Luciq.appendTags(tags);

    expect(NativeLuciq.appendTags).toBeCalledTimes(1);
    expect(NativeLuciq.appendTags).toBeCalledWith(tags);
  });

  it('should call the native method resetTags', () => {
    Luciq.resetTags();

    expect(NativeLuciq.resetTags).toBeCalledTimes(1);
  });

  it('should call native method getTags', async () => {
    const expected = ['tag1', 'tag2'];

    mocked(NativeLuciq).getTags.mockResolvedValueOnce(expected);

    const actual = await Luciq.getTags();

    expect(actual).toBe(expected);
    expect(NativeLuciq.getTags).toBeCalledTimes(1);
  });

  it('should call the native method setString', () => {
    const string = 'report an issue';
    const key = StringKey.reportBug;
    Luciq.setString(key, string);

    expect(NativeLuciq.setString).toBeCalledTimes(1);
    expect(NativeLuciq.setString).toBeCalledWith(string, key);
  });

  it('should suffix the repro steps list item numbering title string on Android', () => {
    Platform.OS = 'android';

    const key = StringKey.reproStepsListItemNumberingTitle;
    const string = 'Page';
    const expected = 'Page #';

    Luciq.setString(key, string);

    expect(NativeLuciq.setString).toBeCalledTimes(1);
    expect(NativeLuciq.setString).toBeCalledWith(expected, key);
  });

  it('should call the native method identifyUser', () => {
    const email = 'foo@luciq.ai';
    const name = 'Luciq';
    Luciq.identifyUser(email, name);

    expect(NativeLuciq.identifyUser).toBeCalledTimes(1);
    expect(NativeLuciq.identifyUser).toBeCalledWith(email, name, undefined);
  });

  it('identifyUser when id is defined should call the native method identifyUser', () => {
    const email = 'foo@luciq.ai';
    const name = 'Luciq';
    const id = 'luciq-id';
    Luciq.identifyUser(email, name, id);

    expect(NativeLuciq.identifyUser).toBeCalledTimes(1);
    expect(NativeLuciq.identifyUser).toBeCalledWith(email, name, id);
  });

  it('should call the native method logOut', () => {
    Luciq.logOut();

    expect(NativeLuciq.logOut).toBeCalledTimes(1);
  });

  it('should call the native method logUserEvent', () => {
    const event = 'click';
    Luciq.logUserEvent(event);

    expect(NativeLuciq.logUserEvent).toBeCalledTimes(1);
    expect(NativeLuciq.logUserEvent).toBeCalledWith(event);
  });

  it('should call the native method logVerbose', () => {
    const message = 'log';
    Luciq.logVerbose(message);

    expect(NativeLuciq.logVerbose).toBeCalledTimes(1);
  });

  it('should not call the native method logVerbose when no message', () => {
    // @ts-ignore
    Luciq.logVerbose(null);

    expect(NativeLuciq.logVerbose).not.toBeCalled();
  });

  it('should call the native method logDebug', () => {
    const message = 'log';
    Luciq.logDebug(message);

    expect(NativeLuciq.logDebug).toBeCalledTimes(1);
  });

  it('should not call the native method logDebug when no message', () => {
    // @ts-ignore
    Luciq.logDebug(null);

    expect(NativeLuciq.logDebug).not.toBeCalled();
  });

  it('should call the native method logInfo', () => {
    const message = 'log';
    Luciq.logInfo(message);

    expect(NativeLuciq.logInfo).toBeCalledTimes(1);
  });

  it('should not call the native method logInfo when no message', () => {
    // @ts-ignore
    Luciq.logInfo(null);

    expect(NativeLuciq.logInfo).not.toBeCalled();
  });

  it('should call the native method logWarn', () => {
    const message = 'log';
    Luciq.logWarn(message);

    expect(NativeLuciq.logWarn).toBeCalledTimes(1);
  });

  it('should not call the native method logWarn when no message', () => {
    // @ts-ignore
    Luciq.logWarn(null);

    expect(NativeLuciq.logWarn).not.toBeCalled();
  });

  it('should call the native method logError', () => {
    const message = 'log';
    Luciq.logError(message);

    expect(NativeLuciq.logError).toBeCalledTimes(1);
  });

  it('should not call the native method logError when no message', () => {
    // @ts-ignore
    Luciq.logError(null);

    expect(NativeLuciq.logError).not.toBeCalled();
  });

  it('should call the native method clearLogs', () => {
    Luciq.clearLogs();

    expect(NativeLuciq.clearLogs).toBeCalledTimes(1);
  });

  it('setReproStepsConfig should call the native setReproStepsConfig', () => {
    Platform.OS = 'android';

    const bug = ReproStepsMode.disabled;
    const crash = ReproStepsMode.enabled;
    const sessionReplay = ReproStepsMode.enabledWithNoScreenshots;
    const config = { bug, crash, sessionReplay };

    Luciq.setReproStepsConfig(config);

    expect(NativeLuciq.setReproStepsConfig).toBeCalledTimes(1);
    expect(NativeLuciq.setReproStepsConfig).toBeCalledWith(bug, crash, sessionReplay);
  });

  it('setReproStepsConfig should prioritize `all` over `bug`, `crash`, and `sessionReplay`', () => {
    Platform.OS = 'android';

    const bug = ReproStepsMode.disabled;
    const crash = ReproStepsMode.enabled;
    const sessionReplay = ReproStepsMode.enabledWithNoScreenshots;
    const all = ReproStepsMode.enabledWithNoScreenshots;
    const config = { all, bug, crash, sessionReplay };

    Luciq.setReproStepsConfig(config);

    expect(NativeLuciq.setReproStepsConfig).toBeCalledTimes(1);
    expect(NativeLuciq.setReproStepsConfig).toBeCalledWith(all, all, all);
  });

  it('setReproStepsConfig should use defaults for `bug`, `crash`, and `sessionReplay`', () => {
    Platform.OS = 'android';

    const config = {};

    Luciq.setReproStepsConfig(config);

    expect(NativeLuciq.setReproStepsConfig).toBeCalledTimes(1);
    expect(NativeLuciq.setReproStepsConfig).toBeCalledWith(
      ReproStepsMode.enabled,
      ReproStepsMode.enabledWithNoScreenshots,
      ReproStepsMode.enabled,
    );
  });

  it.each([
    ['key', null],
    [null, 'value'],
    [null, null],
    [{}, 'value'],
    ['key', []],
  ])("should fail if key and value aren't strings when calling setUserAttribute", (key, value) => {
    const logSpy = jest.spyOn(Logger, 'error');

    // @ts-ignore
    Luciq.setUserAttribute(key, value);
    expect(NativeLuciq.setUserAttribute).not.toBeCalled();
    expect(logSpy).toHaveBeenCalledWith(LuciqConstants.SET_USER_ATTRIBUTES_ERROR_TYPE_MESSAGE);
    logSpy.mockRestore();
  });

  it('should call the native method setUserAttribute', () => {
    const key = 'age';
    const value = '24';
    Luciq.setUserAttribute(key, value);

    expect(NativeLuciq.setUserAttribute).toBeCalledTimes(1);
    expect(NativeLuciq.setUserAttribute).toBeCalledWith(key, value);
  });

  it('should call native method getUserAttribute', async () => {
    const key = 'age';
    const expected = '21';

    mocked(NativeLuciq).getUserAttribute.mockResolvedValueOnce(expected);

    const actual = await Luciq.getUserAttribute(key);

    expect(actual).toBe(expected);
    expect(NativeLuciq.getUserAttribute).toBeCalledTimes(1);
    expect(NativeLuciq.getUserAttribute).toBeCalledWith(key);
  });

  it('should call the native method removeUserAttribute', () => {
    const key = 'age';
    Luciq.removeUserAttribute(key);

    expect(NativeLuciq.removeUserAttribute).toBeCalledTimes(1);
    expect(NativeLuciq.removeUserAttribute).toBeCalledWith(key);
  });

  it.each([[null]])("should fail if key isn't a string when calling removeUserAttribute", (key) => {
    const logSpy = jest.spyOn(console, 'error');

    // @ts-ignore
    Luciq.removeUserAttribute(key);
    expect(NativeLuciq.removeUserAttribute).not.toBeCalled();
    expect(logSpy).toHaveBeenCalledWith(LuciqConstants.REMOVE_USER_ATTRIBUTES_ERROR_TYPE_MESSAGE);
    logSpy.mockRestore();
  });

  it('should call native method getAllUserAttributes', async () => {
    const expected = { type: 'guest' };

    mocked(NativeLuciq).getAllUserAttributes.mockResolvedValueOnce(expected);

    const actual = await Luciq.getAllUserAttributes();

    expect(actual).toBe(expected);
    expect(NativeLuciq.getAllUserAttributes).toBeCalledTimes(1);
    expect(NativeLuciq.getAllUserAttributes).toBeCalledWith();
  });

  it('should call the native method clearAllUserAttributes', () => {
    Luciq.clearAllUserAttributes();

    expect(NativeLuciq.clearAllUserAttributes).toBeCalledTimes(1);
  });

  it('should call the native method showWelcomeMessageWithMode', () => {
    const mode = WelcomeMessageMode.beta;
    Luciq.showWelcomeMessage(mode);

    expect(NativeLuciq.showWelcomeMessageWithMode).toBeCalledTimes(1);
    expect(NativeLuciq.showWelcomeMessageWithMode).toBeCalledWith(mode);
  });

  it('should call the native method setWelcomeMessageMode', () => {
    const mode = WelcomeMessageMode.beta;
    Luciq.setWelcomeMessageMode(mode);

    expect(NativeLuciq.setWelcomeMessageMode).toBeCalledTimes(1);
    expect(NativeLuciq.setWelcomeMessageMode).toBeCalledWith(mode);
  });

  it('should call the native method setFileAttachment with filePath when platform is ios', () => {
    Platform.OS = 'ios';
    const path = '~/path';
    Luciq.addFileAttachment(path, '');

    expect(NativeLuciq.setFileAttachment).toBeCalledTimes(1);
    expect(NativeLuciq.setFileAttachment).toBeCalledWith(path);
  });

  it('should call the native method setFileAttachment with filePath and fileName when platform is android', () => {
    Platform.OS = 'android';
    const path = '~/path';
    const name = 'file';
    Luciq.addFileAttachment(path, name);

    expect(NativeLuciq.setFileAttachment).toBeCalledTimes(1);
    expect(NativeLuciq.setFileAttachment).toBeCalledWith(path, name);
  });

  it('should call the native method addPrivateView', () => {
    Luciq.addPrivateView(0);

    expect(NativeLuciq.addPrivateView).toBeCalledTimes(1);
    expect(NativeLuciq.addPrivateView).toBeCalledWith(findNodeHandle(0));
  });

  it('should call the native method removePrivateView', () => {
    Luciq.removePrivateView(0);

    expect(NativeLuciq.removePrivateView).toBeCalledTimes(1);
    expect(NativeLuciq.removePrivateView).toBeCalledWith(findNodeHandle(0));
  });

  it('should call the native method show', () => {
    Luciq.show();

    expect(NativeLuciq.show).toBeCalledTimes(1);
  });

  it('should call the native method setPreSendingHandler with a function', () => {
    const callback = jest.fn();
    Luciq.onReportSubmitHandler(callback);

    expect(NativeLuciq.setPreSendingHandler).toBeCalledTimes(1);
    expect(NativeLuciq.setPreSendingHandler).toBeCalledWith();
  });

  it('should invoke callback on emitting the event LCQpreSendingHandler', (done) => {
    const report = {
      tags: ['tag1', 'tag2'],
      consoleLogs: ['consoleLog'],
      luciqLogs: ['luciqLog'],
      userAttributes: [{ age: '24' }],
      fileAttachments: ['path'],
    };
    const callback = (rep: Report) => {
      expect(rep).toBeInstanceOf(Report);
      expect(rep.tags).toBe(report.tags);
      expect(rep.consoleLogs).toBe(report.consoleLogs);
      expect(rep.luciqLogs).toBe(report.luciqLogs);
      expect(rep.userAttributes).toBe(report.userAttributes);
      expect(rep.fileAttachments).toBe(report.fileAttachments);
      done();
    };
    Luciq.onReportSubmitHandler(callback);
    emitter.emit(NativeEvents.PRESENDING_HANDLER, report);

    expect(emitter.listenerCount(NativeEvents.PRESENDING_HANDLER)).toBe(1);
  });

  it('should call native addFeatureFlags method', () => {
    const featureFlags: Array<FeatureFlag> = [
      {
        name: 'key1',
        variant: 'variant1',
      },
      {
        name: 'key2',
        variant: 'variant2',
      },
    ];
    const expected: Record<string, string | undefined> = {};
    expected.key1 = 'variant1';
    expected.key2 = 'variant2';

    Luciq.addFeatureFlags(featureFlags);
    expect(NativeLuciq.addFeatureFlags).toBeCalledTimes(1);
    expect(NativeLuciq.addFeatureFlags).toBeCalledWith(expected);
  });

  it('should call native addFeatureFlag method', () => {
    const featureFlag: FeatureFlag = {
      name: 'key1',
      variant: 'variant2',
    };
    const expected: Record<string, string | undefined> = {};
    expected.key1 = 'variant2';

    Luciq.addFeatureFlag(featureFlag);
    expect(NativeLuciq.addFeatureFlags).toBeCalledTimes(1);
    expect(NativeLuciq.addFeatureFlags).toBeCalledWith(expected);
  });
  it('should call native removeFeatureFlags method', () => {
    const featureFlags = ['exp1', 'exp2'];
    Luciq.removeFeatureFlags(featureFlags);
    expect(NativeLuciq.removeFeatureFlags).toBeCalledTimes(1);
    expect(NativeLuciq.removeFeatureFlags).toBeCalledWith(featureFlags);
  });

  it('should call native removeFeatureFlag method', () => {
    const featureFlag = 'exp1';
    Luciq.removeFeatureFlag(featureFlag);
    expect(NativeLuciq.removeFeatureFlags).toBeCalledTimes(1);
    expect(NativeLuciq.removeFeatureFlags).toBeCalledWith([featureFlag]);
  });

  it('should call native removeAllFeatureFlags method', () => {
    Luciq.removeAllFeatureFlags();
    expect(NativeLuciq.removeAllFeatureFlags).toBeCalledTimes(1);
  });

  it('should call the native willRedirectToStore method', () => {
    Luciq.willRedirectToStore();
    expect(NativeLuciq.willRedirectToStore).toBeCalledTimes(1);
  });

  it('should register feature flag listener', () => {
    const callback = jest.fn();
    Luciq._registerFeatureFlagsChangeListener(callback);

    expect(NativeLuciq.registerFeatureFlagsChangeListener).toBeCalledTimes(1);
  });

  it('should invoke callback on emitting the event LCQOnNewFeatureFlagsUpdateReceivedCallback', () => {
    const callback = jest.fn();
    Luciq._registerFeatureFlagsChangeListener(callback);
    emitter.emit(NativeEvents.ON_FEATURE_FLAGS_CHANGE);

    expect(emitter.listenerCount(NativeEvents.ON_FEATURE_FLAGS_CHANGE)).toBe(1);
    expect(callback).toHaveBeenCalled();
  });

  it('should call the native method enableAutoMasking', () => {
    Luciq.enableAutoMasking([AutoMaskingType.labels]);

    expect(NativeLuciq.enableAutoMasking).toBeCalledTimes(1);
    expect(NativeLuciq.enableAutoMasking).toBeCalledWith([AutoMaskingType.labels]);
  });
});

describe('Luciq iOS initialization tests', () => {
  let config: LuciqConfig;
  beforeEach(() => {
    Platform.OS = 'ios';
    config = {
      token: 'some-token',
      invocationEvents: [InvocationEvent.floatingButton, InvocationEvent.shake],
      debugLogsLevel: LogLevel.debug,
      networkInterceptionMode: NetworkInterceptionMode.native,
      codePushVersion: '1.1.0',
      overAirVersion: {
        service: OverAirUpdateServices.expo,
        version: 'D0A12345-6789-4B3C-A123-4567ABCDEF01',
      },
    };
    // Fast-forward until all timers have been executed
    jest.advanceTimersByTime(1000);
  });

  it('should initialize correctly with javascript interception mode', () => {
    config.networkInterceptionMode = NetworkInterceptionMode.javascript;

    Luciq.init(config);

    expect(NativeNetworkLogger.isNativeInterceptionEnabled).toHaveBeenCalled();
    expect(NetworkLogger.setEnabled).toHaveBeenCalledWith(true);
    expect(NativeLuciq.init).toHaveBeenCalledWith(
      config.token,
      config.invocationEvents,
      config.debugLogsLevel,
      false, // Disable native interception
      config.codePushVersion,
      config.ignoreAndroidSecureFlag,
      undefined,
      config.overAirVersion,
    );
  });

  it('should initialize correctly with native interception mode when [isNativeInterceptionEnabled] == ture', () => {
    jest.spyOn(NativeNetworkLogger, 'isNativeInterceptionEnabled').mockReturnValue(true);

    Luciq.init(config);

    expect(NativeNetworkLogger.isNativeInterceptionEnabled).toHaveBeenCalled();
    expect(NetworkLogger.setEnabled).toHaveBeenCalledWith(false);
    expect(NativeLuciq.init).toHaveBeenCalledWith(
      config.token,
      config.invocationEvents,
      config.debugLogsLevel,
      true, // Enable native interception
      config.codePushVersion,
      undefined,
      undefined,
      config.overAirVersion,
    );
  });

  it('should disable native interception mode when user sets networkInterceptionMode to native and [isNativeInterceptionEnabled] == false', () => {
    jest.spyOn(NativeNetworkLogger, 'isNativeInterceptionEnabled').mockReturnValue(false);

    Luciq.init(config);

    expect(NativeNetworkLogger.isNativeInterceptionEnabled).toHaveBeenCalled();
    expect(NetworkLogger.setEnabled).toHaveBeenCalled();
    expect(NativeLuciq.init).toHaveBeenCalledWith(
      config.token,
      config.invocationEvents,
      config.debugLogsLevel,
      false, // Disable native interception
      config.codePushVersion,
      config.ignoreAndroidSecureFlag,
      undefined,
      config.overAirVersion,
    );
  });

  it('should display error message when user sets networkInterceptionMode to native and [isNativeInterceptionEnabled] == false', () => {
    jest.spyOn(NativeNetworkLogger, 'isNativeInterceptionEnabled').mockReturnValue(false);
    const logSpy = jest.spyOn(global.console, 'error');

    Luciq.init(config);

    expect(logSpy).toBeCalledTimes(1);
    expect(logSpy).toBeCalledWith(
      LuciqConstants.LCQ_APM_TAG + LuciqConstants.NATIVE_INTERCEPTION_DISABLED_MESSAGE,
    );
  });
});

describe('Luciq Android initialization tests', () => {
  let config: LuciqConfig;

  beforeEach(() => {
    Platform.OS = 'android';
    config = {
      token: 'some-token',
      invocationEvents: [InvocationEvent.floatingButton, InvocationEvent.shake],
      debugLogsLevel: LogLevel.debug,
      networkInterceptionMode: NetworkInterceptionMode.javascript,
      codePushVersion: '1.1.0',
      overAirVersion: {
        service: OverAirUpdateServices.expo,
        version: 'D0A12345-6789-4B3C-A123-4567ABCDEF01',
      },
    };
  });

  it('should initialize correctly with native interception enabled', () => {
    config.networkInterceptionMode = NetworkInterceptionMode.native;
    Luciq.init(config);
    fakeTimer(() => {
      expect(NativeLuciq.setOnFeaturesUpdatedListener).toHaveBeenCalled();
      expect(NetworkLogger.setEnabled).toHaveBeenCalledWith(true);
      expect(NativeLuciq.init).toHaveBeenCalledWith(
        config.token,
        config.invocationEvents,
        config.debugLogsLevel,
        false, // always disable native interception to insure sending network logs to core (Bugs & Crashes).
        config.codePushVersion,
        { ignoreAndroidSecureFlag: config.ignoreAndroidSecureFlag },
        undefined,
        config.overAirVersion,
      );
    });
  });

  it('should show warning message when networkInterceptionMode == javascript and user added APM plugin', () => {
    jest.spyOn(NativeNetworkLogger, 'isNativeInterceptionEnabled').mockReturnValue(true);
    jest.spyOn(NativeNetworkLogger, 'hasAPMNetworkPlugin').mockReturnValue(Promise.resolve(true));
    const logSpy = jest.spyOn(global.console, 'warn');

    Luciq.init(config);
    fakeTimer(() => {
      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toBeCalledWith(
        LuciqConstants.LCQ_APM_TAG + LuciqConstants.SWITCHED_TO_NATIVE_INTERCEPTION_MESSAGE,
      );
    });
  });

  it('should show error message when networkInterceptionMode == native and user did not add APM plugin', () => {
    config.networkInterceptionMode = NetworkInterceptionMode.native;

    jest.spyOn(NativeNetworkLogger, 'isNativeInterceptionEnabled').mockReturnValue(true);
    jest.spyOn(NativeNetworkLogger, 'hasAPMNetworkPlugin').mockReturnValue(Promise.resolve(false));
    const logSpy = jest.spyOn(global.console, 'error');

    Luciq.init(config);

    fakeTimer(() => {
      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toBeCalledWith(
        LuciqConstants.LCQ_APM_TAG + LuciqConstants.PLUGIN_NOT_INSTALLED_MESSAGE,
      );
    });
  });

  it('should show error message when networkInterceptionMode == native and user did not add APM plugin and the isNativeInterceptionEnabled is disabled', () => {
    config.networkInterceptionMode = NetworkInterceptionMode.native;

    jest.spyOn(NativeNetworkLogger, 'isNativeInterceptionEnabled').mockReturnValue(false);
    jest.spyOn(NativeNetworkLogger, 'hasAPMNetworkPlugin').mockReturnValue(Promise.resolve(false));
    const logSpy = jest.spyOn(global.console, 'error');

    Luciq.init(config);

    fakeTimer(() => {
      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toBeCalledWith(
        LuciqConstants.LCQ_APM_TAG + LuciqConstants.NATIVE_INTERCEPTION_DISABLED_MESSAGE,
      );
    });
  });

  it('should show error message when networkInterceptionMode == native and the isNativeInterceptionEnabled is disabled', () => {
    config.networkInterceptionMode = NetworkInterceptionMode.native;
    jest.spyOn(NativeNetworkLogger, 'isNativeInterceptionEnabled').mockReturnValue(false);
    jest.spyOn(NativeNetworkLogger, 'hasAPMNetworkPlugin').mockReturnValue(Promise.resolve(true));
    const logSpy = jest.spyOn(global.console, 'error');

    Luciq.init(config);

    fakeTimer(() => {
      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toBeCalledWith(
        LuciqConstants.LCQ_APM_TAG + LuciqConstants.NATIVE_INTERCEPTION_DISABLED_MESSAGE,
      );
    });
  });

  it('should initialize correctly with App variant', async () => {
    config.appVariant = 'App Variant';
    await Luciq.init(config);
    fakeTimer(() => {
      expect(NativeLuciq.setOnFeaturesUpdatedListener).toHaveBeenCalled();
      expect(NativeLuciq.init).toHaveBeenCalledWith(
        config.token,
        config.invocationEvents,
        config.debugLogsLevel,
        true,
        config.codePushVersion,
        config.appVariant,
        undefined,
        config.overAirVersion,
      );
    });
  });
});
