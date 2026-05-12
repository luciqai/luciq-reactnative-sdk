import { NativeLuciq } from '../native/NativeLuciq';
import { _registerFeatureFlagsChangeListener } from '../modules/Luciq';
import { Logger } from './logger';

const TAG = 'LCQ-RN-NET:';

let cachedW3cFlags = {
  isW3cExternalTraceIDEnabled: false,
  isW3cExternalGeneratedHeaderEnabled: false,
  isW3cCaughtHeaderEnabled: false,
};

export async function initFeatureFlagsCache() {
  Logger.debug(TAG, '[FeatureFlags] Initializing W3C feature flags cache from native bridge...');
  try {
    const [traceID, generatedHeader, caughtHeader] = await Promise.all([
      NativeLuciq.isW3ExternalTraceIDEnabled(),
      NativeLuciq.isW3ExternalGeneratedHeaderEnabled(),
      NativeLuciq.isW3CaughtHeaderEnabled(),
    ]);
    cachedW3cFlags = {
      isW3cExternalTraceIDEnabled: traceID,
      isW3cExternalGeneratedHeaderEnabled: generatedHeader,
      isW3cCaughtHeaderEnabled: caughtHeader,
    };
    Logger.debug(
      TAG,
      `[FeatureFlags] Cache initialized: traceID=${traceID}, generatedHeader=${generatedHeader}, caughtHeader=${caughtHeader}`,
    );
  } catch (e) {
    Logger.debug(TAG, '[FeatureFlags] Failed to initialize cache, using defaults (all false):', e);
  }
}

export function getCachedW3cFlags() {
  return cachedW3cFlags;
}

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
      Logger.debug(
        TAG,
        `[FeatureFlags] Flags updated from native listener: traceID=${res.isW3ExternalTraceIDEnabled}, generatedHeader=${res.isW3ExternalGeneratedHeaderEnabled}, caughtHeader=${res.isW3CaughtHeaderEnabled}, bodyLimit=${res.networkBodyLimit}`,
      );
      cachedW3cFlags = {
        isW3cExternalTraceIDEnabled: res.isW3ExternalTraceIDEnabled,
        isW3cExternalGeneratedHeaderEnabled: res.isW3ExternalGeneratedHeaderEnabled,
        isW3cCaughtHeaderEnabled: res.isW3CaughtHeaderEnabled,
      };
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
