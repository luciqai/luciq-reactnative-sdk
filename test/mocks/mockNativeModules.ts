import type { LuciqNativePackage } from '../../src/native/NativePackage';
import mockAPM from './mockAPM';
import mockBugReporting from './mockBugReporting';
import mockCrashReporting from './mockCrashReporting';
import mockFeatureRequests from './mockFeatureRequests';
import mockSessionReplay from './mockSessionReplay';
import mockLuciq from './mockLuciq';
import mockReplies from './mockReplies';
import mockSurveys from './mockSurveys';
import mockNetworkLogger from './mockNetworkLogger';

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const mockNativeModules: LuciqNativePackage = {
    LQNetworkLogger: mockNetworkLogger,
    LQAPM: mockAPM,
    LQBugReporting: mockBugReporting,
    LQCrashReporting: mockCrashReporting,
    LQFeatureRequests: mockFeatureRequests,
    LQSessionReplay: mockSessionReplay,
    Luciq: mockLuciq,
    LQReplies: mockReplies,
    LQSurveys: mockSurveys,
  };

  Object.assign(RN.NativeModules, mockNativeModules);

  return RN;
});
