import type { SessionReplayNativeModule } from '../../src/native/NativeSessionReplay';

const mockSessionReplay: SessionReplayNativeModule = {
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  setEnabled: jest.fn(),
  setNetworkLogsEnabled: jest.fn(),
  setLuciqLogsEnabled: jest.fn(),
  setUserStepsEnabled: jest.fn(),
  getSessionReplayLink: jest.fn().mockReturnValue('link'),
  setSyncCallback: jest.fn(),
  evaluateSync: jest.fn(),
  setCapturingMode: jest.fn(),
  setScreenshotQuality: jest.fn(),
  setScreenshotCaptureInterval: jest.fn(),
};

export default mockSessionReplay;
