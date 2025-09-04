import { NativeLuciq } from '../native/NativeLuciq';
import { _registerFeatureFlagsChangeListener } from '../modules/Luciq';

export const FeatureFlags = {
  isW3ExternalTraceID: () => NativeLuciq.isW3ExternalTraceIDEnabled(),
  isW3ExternalGeneratedHeader: () => NativeLuciq.isW3ExternalGeneratedHeaderEnabled(),
  isW3CaughtHeader: () => NativeLuciq.isW3CaughtHeaderEnabled(),
  networkLogLimit: () => NativeLuciq.getNetworkBodyMaxSize(),
};

export const registerFeatureFlagsListener = () => {
  _registerFeatureFlagsChangeListener(
    (res: {
      isW3ExternalTraceIDEnabled: boolean;
      isW3ExternalGeneratedHeaderEnabled: boolean;
      isW3CaughtHeaderEnabled: boolean;
      networkBodyLimit: number;
    }) => {
      FeatureFlags.isW3ExternalTraceID = async () => {
        return res.isW3ExternalTraceIDEnabled;
      };
      FeatureFlags.isW3ExternalGeneratedHeader = async () => {
        return res.isW3ExternalGeneratedHeaderEnabled;
      };
      FeatureFlags.isW3CaughtHeader = async () => {
        return res.isW3CaughtHeaderEnabled;
      };
      FeatureFlags.networkLogLimit = async () => {
        return res.networkBodyLimit;
      };
    },
  );
};
