import { AppLaunchStagesManager } from '../../../src/modules/apm/AppLaunchStagesManager';
import { NativeAPM } from '../../../src/native/NativeAPM';
import { Logger } from '../../../src/utils/logger';

// Mock LuciqUtils so nowMicros/toEpochMicros are predictable.
// nowMicros() at module load fixes the JS-start anchor to 5000.
jest.mock('../../../src/utils/LuciqUtils', () => ({
  nowMicros: jest.fn(() => 5000),
  toEpochMicros: jest.fn((v: number) => v + 1000000),
  fromEpochMicros: jest.fn((v: number) => v),
}));

jest.mock('../../../src/native/NativeAPM', () => ({
  NativeAPM: {
    isAppLaunchStagesEnabled: jest.fn().mockResolvedValue(true),
    syncAppLaunchStages: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  Logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const LuciqUtils = require('../../../src/utils/LuciqUtils');
const mockNowMicros = LuciqUtils.nowMicros as jest.Mock;

const enable = async () => {
  (NativeAPM.isAppLaunchStagesEnabled as jest.Mock).mockResolvedValue(true);
  await AppLaunchStagesManager.initialize();
};

describe('AppLaunchStagesManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // nowMicros defaults to 5000 (the module-load anchor value).
    mockNowMicros.mockImplementation(() => 5000);
    // Reset singleton state so each test starts fresh.
    (AppLaunchStagesManager as any).isInitialized = false;
    (AppLaunchStagesManager as any).isEnabled = false;
    (AppLaunchStagesManager as any).renderStartUs = undefined;
    (AppLaunchStagesManager as any).mountUs = undefined;
    (AppLaunchStagesManager as any).hasReported = false;
  });

  describe('Initialization', () => {
    it('should enable when the feature flag is on', async () => {
      (NativeAPM.isAppLaunchStagesEnabled as jest.Mock).mockResolvedValue(true);
      await AppLaunchStagesManager.initialize();

      expect(AppLaunchStagesManager.isFeatureEnabled()).toBe(true);
    });

    it('should stay disabled when the feature flag is off', async () => {
      (NativeAPM.isAppLaunchStagesEnabled as jest.Mock).mockResolvedValue(false);
      await AppLaunchStagesManager.initialize();

      expect(AppLaunchStagesManager.isFeatureEnabled()).toBe(false);
    });

    it('should not re-run initialization once initialized', async () => {
      (NativeAPM.isAppLaunchStagesEnabled as jest.Mock).mockResolvedValue(true);

      await AppLaunchStagesManager.initialize();
      await AppLaunchStagesManager.initialize();

      expect(NativeAPM.isAppLaunchStagesEnabled).toHaveBeenCalledTimes(1);
    });

    it('should stay quietly disabled when the native API is unavailable', async () => {
      const original = (NativeAPM as any).isAppLaunchStagesEnabled;
      (NativeAPM as any).isAppLaunchStagesEnabled = undefined;

      await AppLaunchStagesManager.initialize();

      expect(AppLaunchStagesManager.isFeatureEnabled()).toBe(false);
      expect(Logger.error).not.toHaveBeenCalled();
      expect(Logger.debug).toHaveBeenCalledWith(
        'LCQ-RN-APM-LAUNCH:',
        'native app launch stages API unavailable; feature disabled',
      );

      (NativeAPM as any).isAppLaunchStagesEnabled = original;
    });

    it('should handle initialization errors gracefully', async () => {
      (NativeAPM.isAppLaunchStagesEnabled as jest.Mock).mockRejectedValue(new Error('init failed'));

      await AppLaunchStagesManager.initialize();

      expect(AppLaunchStagesManager.isFeatureEnabled()).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith(
        'LCQ-RN-APM-LAUNCH:',
        'initialize failed',
        expect.objectContaining({ message: 'init failed', name: 'Error' }),
      );
    });
  });

  describe('When disabled', () => {
    it('should not record marks or report stages', () => {
      AppLaunchStagesManager.markRenderStart(7000);
      AppLaunchStagesManager.markMounted(9000);
      AppLaunchStagesManager.markInteractive();

      expect(NativeAPM.syncAppLaunchStages).not.toHaveBeenCalled();
      expect((AppLaunchStagesManager as any).renderStartUs).toBeUndefined();
      expect((AppLaunchStagesManager as any).mountUs).toBeUndefined();
    });
  });

  describe('Marks', () => {
    beforeEach(enable);

    it('should record render start only once', () => {
      AppLaunchStagesManager.markRenderStart(7000);
      AppLaunchStagesManager.markRenderStart(8000);

      expect((AppLaunchStagesManager as any).renderStartUs).toBe(7000);
    });

    it('should record mount only once', () => {
      AppLaunchStagesManager.markMounted(9000);
      AppLaunchStagesManager.markMounted(9500);

      expect((AppLaunchStagesManager as any).mountUs).toBe(9000);
    });
  });

  describe('Reporting', () => {
    beforeEach(enable);

    it('should report the full 4-stage breakdown to native', () => {
      AppLaunchStagesManager.markRenderStart(7000);
      AppLaunchStagesManager.markMounted(9000);
      mockNowMicros.mockReturnValue(12000); // interactive timestamp

      AppLaunchStagesManager.markInteractive();

      expect(NativeAPM.syncAppLaunchStages).toHaveBeenCalledTimes(1);
      const [jsStartEpochUs, stages] = (NativeAPM.syncAppLaunchStages as jest.Mock).mock.calls[0];

      // jsStart anchor (5000) -> epoch via toEpochMicros(v)=v+1e6
      expect(jsStartEpochUs).toBe(1005000);
      expect(stages).toEqual({
        rnd_st_mus: 1007000, // toEpochMicros(7000)
        js_exec_mus: 2000, //   renderStart(7000) - jsStart(5000)
        mnt_st_mus: 1009000, // toEpochMicros(9000)
        rnd_mus: 2000, //        mount(9000) - renderStart(7000)
        tti_mus: 3000, //        interactive(12000) - mount(9000)
        js_total_mus: 7000, //   interactive(12000) - jsStart(5000)
      });
    });

    it('should report only once per launch', () => {
      AppLaunchStagesManager.markRenderStart(7000);
      AppLaunchStagesManager.markMounted(9000);
      mockNowMicros.mockReturnValue(12000);

      AppLaunchStagesManager.markInteractive();
      AppLaunchStagesManager.markInteractive();

      expect(NativeAPM.syncAppLaunchStages).toHaveBeenCalledTimes(1);
    });

    it('should degrade to js_total_mus when render/mount marks are absent', () => {
      mockNowMicros.mockReturnValue(12000);

      AppLaunchStagesManager.markInteractive();

      const [jsStartEpochUs, stages] = (NativeAPM.syncAppLaunchStages as jest.Mock).mock.calls[0];
      expect(jsStartEpochUs).toBe(1005000);
      expect(stages).toEqual({ js_total_mus: 7000 });
    });

    it('should report a partial breakdown when only render start is marked', () => {
      AppLaunchStagesManager.markRenderStart(7000);
      mockNowMicros.mockReturnValue(12000);

      AppLaunchStagesManager.markInteractive();

      const [, stages] = (NativeAPM.syncAppLaunchStages as jest.Mock).mock.calls[0];
      expect(stages).toEqual({
        rnd_st_mus: 1007000,
        js_exec_mus: 2000,
        js_total_mus: 7000,
      });
    });

    it('should swallow native errors and log them', () => {
      AppLaunchStagesManager.markRenderStart(7000);
      AppLaunchStagesManager.markMounted(9000);
      mockNowMicros.mockReturnValue(12000);
      (NativeAPM.syncAppLaunchStages as jest.Mock).mockImplementationOnce(() => {
        throw new Error('native bridge unavailable');
      });

      expect(() => AppLaunchStagesManager.markInteractive()).not.toThrow();
      expect(Logger.error).toHaveBeenCalledWith(
        'LCQ-RN-APM-LAUNCH:',
        'markInteractive failed',
        expect.objectContaining({ message: 'native bridge unavailable', name: 'Error' }),
      );
    });
  });
});
