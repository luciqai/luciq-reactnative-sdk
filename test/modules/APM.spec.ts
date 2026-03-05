import { Platform } from 'react-native';

import { NativeAPM } from '../../src/native/NativeAPM';
import { NativeLuciq } from '../../src/native/NativeLuciq';
import * as APM from '../../src/modules/APM';
import { ScreenLoadingManager } from '../../src/modules/apm/ScreenLoadingManager';

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

  it('should call the native method setScreenLoadingEnabled', () => {
    APM.setScreenLoadingEnabled(true);

    expect(NativeAPM.setScreenLoadingEnabled).toBeCalledTimes(1);
    expect(NativeAPM.setScreenLoadingEnabled).toBeCalledWith(true);
  });

  it('should call ScreenLoadingManager.endScreenLoading', () => {
    const spy = jest.spyOn(ScreenLoadingManager, 'endScreenLoading').mockImplementation();

    APM.endScreenLoading();

    expect(spy).toBeCalledTimes(1);
    spy.mockRestore();
  });

  it('should call ScreenLoadingManager.excludeRoutes', () => {
    const spy = jest.spyOn(ScreenLoadingManager, 'excludeRoutes').mockImplementation();
    const routes = ['Home', 'Settings'];

    APM.excludeScreenLoadingRoutes(routes);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(routes);
    spy.mockRestore();
  });

  it('should call ScreenLoadingManager.includeRoutes with routes', () => {
    const spy = jest.spyOn(ScreenLoadingManager, 'includeRoutes').mockImplementation();
    const routes = ['Home'];

    APM.includeScreenLoadingRoutes(routes);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(routes);
    spy.mockRestore();
  });

  it('should call ScreenLoadingManager.includeRoutes without arguments', () => {
    const spy = jest.spyOn(ScreenLoadingManager, 'includeRoutes').mockImplementation();

    APM.includeScreenLoadingRoutes();

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(undefined);
    spy.mockRestore();
  });
});
