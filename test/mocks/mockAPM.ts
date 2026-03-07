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
  initScreenFrameTracking: jest.fn().mockResolvedValue(undefined),
  setActiveScreenSpanId: jest.fn(),
  getScreenTimeToDisplay: jest.fn().mockResolvedValue(null),
  isScreenLoadingEnabled: jest.fn().mockResolvedValue(false),
  isEndScreenLoadingEnabled: jest.fn().mockResolvedValue(true),
  endScreenLoading: jest.fn(),
  setScreenLoadingEnabled: jest.fn(),
  syncScreenLoading: jest.fn(),
  syncManualScreenLoading: jest.fn(),
};

export default mockAPM;
