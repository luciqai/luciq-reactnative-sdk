import { Platform } from 'react-native';

import { NativeAPM } from '../../src/native/NativeAPM';
import { NativeLuciq } from '../../src/native/NativeLuciq';
import * as APM from '../../src/modules/APM';

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

  describe('Screen Loading', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should enable screen loading when setScreenLoadingEnabled is called', () => {
      APM.setScreenLoadingEnabled(true);

      expect(NativeAPM.setScreenLoadingEnabled).toHaveBeenCalledTimes(1);
      expect(NativeAPM.setScreenLoadingEnabled).toHaveBeenCalledWith(true);
      expect(APM.isScreenLoadingEnabled()).toBe(true);
    });

    it('should start screen loading measurement', () => {
      APM.setScreenLoadingEnabled(true);
      APM.startScreenLoading('HomeScreen');

      expect(NativeAPM.startScreenLoading).toHaveBeenCalledTimes(1);
      expect(NativeAPM.startScreenLoading).toHaveBeenCalledWith('HomeScreen');
    });

    it('should not start measurement when disabled', () => {
      APM.setScreenLoadingEnabled(false);
      APM.startScreenLoading('HomeScreen');

      expect(NativeAPM.startScreenLoading).not.toHaveBeenCalled();
    });

    it('should end screen loading measurement with duration', () => {
      APM.setScreenLoadingEnabled(true);
      APM.startScreenLoading('HomeScreen');

      // Simulate some time passing
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1250);

      APM.endScreenLoading('HomeScreen');

      expect(NativeAPM.endScreenLoading).toHaveBeenCalledTimes(1);
      expect(NativeAPM.endScreenLoading).toHaveBeenCalledWith('HomeScreen', 250);
    });

    it('should track TTID for TTFD dependency', () => {
      APM.setScreenLoadingEnabled(true);
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'TestScreen',
        duration: 250,
        startTime: 1000,
        endTime: 1250,
      });

      expect(APM._hasInitialDisplayForScreen('TestScreen')).toBe(true);
    });

    it('should report screen loading metrics to native', () => {
      APM.setScreenLoadingEnabled(true);
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'TestScreen',
        duration: 250,
        startTime: 1000,
        endTime: 1250,
      });

      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledTimes(1);
      expect(NativeAPM.reportScreenLoadingMetric).toHaveBeenCalledWith(
        'initial_display',
        'TestScreen',
        250,
        1000,
        1250,
      );
    });

    it('should not report metrics when disabled', () => {
      APM.setScreenLoadingEnabled(false);
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: 'TestScreen',
        duration: 250,
        startTime: 1000,
        endTime: 1250,
      });

      expect(NativeAPM.reportScreenLoadingMetric).not.toHaveBeenCalled();
    });
  });
});
