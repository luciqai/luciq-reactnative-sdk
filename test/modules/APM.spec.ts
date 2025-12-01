import { Platform } from 'react-native';

import { NativeAPM } from '../../src/native/NativeAPM';
import { NativeLuciq } from '../../src/native/NativeLuciq';
import * as APM from '../../src/modules/APM';
import { CustomSpan } from '../../src';
import * as CustomSpansManager from '../../src/utils/CustomSpansManager';

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

  describe('Custom Spans delegation', () => {
    it('APM.startCustomSpan delegates to manager', async () => {
      const span = new CustomSpan('Delegation', jest.fn(), jest.fn().mockResolvedValue(undefined));
      const spy = jest.spyOn(CustomSpansManager, 'startCustomSpan').mockResolvedValueOnce(span);

      const result = await APM.startCustomSpan('Delegation');

      expect(spy).toHaveBeenCalledWith('Delegation');
      expect(result).toBe(span);
    });

    it('APM.addCompletedCustomSpan delegates to manager', async () => {
      const start = new Date(Date.now() - 1000);
      const end = new Date();
      const spy = jest
        .spyOn(CustomSpansManager, 'addCompletedCustomSpan')
        .mockResolvedValueOnce(undefined);

      await APM.addCompletedCustomSpan('Delegation', start, end);

      expect(spy).toHaveBeenCalledWith('Delegation', start, end);
    });
  });
});
