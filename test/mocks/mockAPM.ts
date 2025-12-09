import type { ApmNativeModule } from '../../src/native/NativeAPM';

const mockAPM: ApmNativeModule = {
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  setEnabled: jest.fn(),
  setAppLaunchEnabled: jest.fn(),
  setAutoUITraceEnabled: jest.fn(),
  startFlow: jest.fn(),
  setFlowAttribute: jest.fn(),
  endFlow: jest.fn(),
  startUITrace: jest.fn(),
  endUITrace: jest.fn(),
  endAppLaunch: jest.fn(),
  lcqSleep: jest.fn(),
  networkLogAndroid: jest.fn(),
  setScreenRenderingEnabled: jest.fn(),
  setScreenLoadingEnabled: jest.fn(),
  reportScreenLoadingMetric: jest.fn(),
  endScreenLoading: jest.fn(),
  startScreenLoading: jest.fn(),
};

export default mockAPM;
