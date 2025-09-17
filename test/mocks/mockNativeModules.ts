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
    LCQNetworkLogger: mockNetworkLogger,
    LCQAPM: mockAPM,
    LCQBugReporting: mockBugReporting,
    LCQCrashReporting: mockCrashReporting,
    LCQFeatureRequests: mockFeatureRequests,
    LCQSessionReplay: mockSessionReplay,
    Luciq: mockLuciq,
    LCQReplies: mockReplies,
    LCQSurveys: mockSurveys,
  };

  Object.assign(RN.NativeModules, mockNativeModules);

  return RN;
});
