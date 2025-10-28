import { Logger } from '../../src/utils/logger';
import LuciqConstants from '../../src/utils/LuciqConstants';
import {
  createProactiveReportingConfig,
  ProactiveReportingConfigOptions,
} from '../../src/models/ProactiveReportingConfigs';

// Mock the Logger to track warning calls
jest.mock('../../src/utils/logger', () => ({
  Logger: {
    warn: jest.fn(),
  },
}));

describe('ProactiveReportingConfigs', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createProactiveReportingConfig', () => {
    describe('with default parameters', () => {
      it('should return default configuration when no parameters provided', () => {
        const config = createProactiveReportingConfig();

        expect(config).toEqual({
          gapBetweenModals: 24,
          modalDelayAfterDetection: 20,
          enabled: true,
        });
        expect(Logger.warn).not.toHaveBeenCalled();
      });

      it('should return default configuration when empty object provided', () => {
        const config = createProactiveReportingConfig({} as ProactiveReportingConfigOptions);

        expect(config).toEqual({
          gapBetweenModals: 24,
          modalDelayAfterDetection: 20,
          enabled: true,
        });
        expect(Logger.warn).not.toHaveBeenCalled();
      });
    });

    describe('with valid parameters', () => {
      it('should return configuration with provided valid values', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: 30,
          modalDelayAfterDetection: 15,
          enabled: false,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 30,
          modalDelayAfterDetection: 15,
          enabled: false,
        });
        expect(Logger.warn).not.toHaveBeenCalled();
      });

      it('should handle partial configuration with valid values', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: 50,
          modalDelayAfterDetection: 20, // default value
          enabled: false,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 50,
          modalDelayAfterDetection: 20, // default value
          enabled: false,
        });
        expect(Logger.warn).not.toHaveBeenCalled();
      });

      it('should handle only enabled parameter', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: 24, // default value
          modalDelayAfterDetection: 20, // default value
          enabled: false,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 24, // default value
          modalDelayAfterDetection: 20, // default value
          enabled: false,
        });
        expect(Logger.warn).not.toHaveBeenCalled();
      });
    });

    describe('with invalid gapBetweenModals', () => {
      it('should use default value and log warning when gapBetweenModals is zero', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: 0,
          modalDelayAfterDetection: 15,
          enabled: true,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 24, // default value used
          modalDelayAfterDetection: 15,
          enabled: true,
        });
        expect(Logger.warn).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledWith(LuciqConstants.GAP_MODEL_ERROR_MESSAGE);
      });

      it('should use default value and log warning when gapBetweenModals is negative', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: -5,
          modalDelayAfterDetection: 15,
          enabled: true,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 24, // default value used
          modalDelayAfterDetection: 15,
          enabled: true,
        });
        expect(Logger.warn).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledWith(LuciqConstants.GAP_MODEL_ERROR_MESSAGE);
      });
    });

    describe('with invalid modalDelayAfterDetection', () => {
      it('should use default value and log warning when modalDelayAfterDetection is zero', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: 30,
          modalDelayAfterDetection: 0,
          enabled: true,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 30,
          modalDelayAfterDetection: 20, // default value used
          enabled: true,
        });
        expect(Logger.warn).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledWith(LuciqConstants.MODAL_DETECTION_ERROR_MESSAGE);
      });

      it('should use default value and log warning when modalDelayAfterDetection is negative', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: 30,
          modalDelayAfterDetection: -10,
          enabled: true,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 30,
          modalDelayAfterDetection: 20, // default value used
          enabled: true,
        });
        expect(Logger.warn).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledWith(LuciqConstants.MODAL_DETECTION_ERROR_MESSAGE);
      });
    });

    describe('with both invalid parameters', () => {
      it('should use default values and log both warnings when both parameters are invalid', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: -1,
          modalDelayAfterDetection: 0,
          enabled: true,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 24, // default value used
          modalDelayAfterDetection: 20, // default value used
          enabled: true,
        });
        expect(Logger.warn).toHaveBeenCalledTimes(2);
        expect(Logger.warn).toHaveBeenNthCalledWith(1, LuciqConstants.GAP_MODEL_ERROR_MESSAGE);
        expect(Logger.warn).toHaveBeenNthCalledWith(
          2,
          LuciqConstants.MODAL_DETECTION_ERROR_MESSAGE,
        );
      });
    });

    describe('edge cases', () => {
      it('should handle very small positive values', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: 0.1,
          modalDelayAfterDetection: 0.5,
          enabled: true,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 0.1,
          modalDelayAfterDetection: 0.5,
          enabled: true,
        });
        expect(Logger.warn).not.toHaveBeenCalled();
      });

      it('should handle large positive values', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: 1000,
          modalDelayAfterDetection: 500,
          enabled: false,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 1000,
          modalDelayAfterDetection: 500,
          enabled: false,
        });
        expect(Logger.warn).not.toHaveBeenCalled();
      });

      it('should handle enabled as false with invalid timing values', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: -5,
          modalDelayAfterDetection: -3,
          enabled: false,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 24, // default value used
          modalDelayAfterDetection: 20, // default value used
          enabled: false,
        });
        expect(Logger.warn).toHaveBeenCalledTimes(2);
      });
    });

    describe('type safety', () => {
      it('should accept valid ProactiveReportingConfigOptions interface', () => {
        const options: ProactiveReportingConfigOptions = {
          gapBetweenModals: 25,
          modalDelayAfterDetection: 18,
          enabled: true,
        };

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 25,
          modalDelayAfterDetection: 18,
          enabled: true,
        });
      });

      it('should handle undefined values gracefully', () => {
        const options = {
          gapBetweenModals: undefined,
          modalDelayAfterDetection: undefined,
          enabled: undefined,
        } as any;

        const config = createProactiveReportingConfig(options);

        expect(config).toEqual({
          gapBetweenModals: 24, // default value
          modalDelayAfterDetection: 20, // default value
          enabled: true, // default value
        });
        expect(Logger.warn).not.toHaveBeenCalled();
      });
    });
  });

  describe('ProactiveReportingConfigOptions interface', () => {
    it('should accept all required properties', () => {
      const validOptions: ProactiveReportingConfigOptions = {
        gapBetweenModals: 30,
        modalDelayAfterDetection: 15,
        enabled: true,
      };

      expect(validOptions.gapBetweenModals).toBe(30);
      expect(validOptions.modalDelayAfterDetection).toBe(15);
      expect(validOptions.enabled).toBe(true);
    });

    it('should accept boolean enabled property', () => {
      const optionsWithEnabledTrue: ProactiveReportingConfigOptions = {
        gapBetweenModals: 24,
        modalDelayAfterDetection: 20,
        enabled: true,
      };

      const optionsWithEnabledFalse: ProactiveReportingConfigOptions = {
        gapBetweenModals: 24,
        modalDelayAfterDetection: 20,
        enabled: false,
      };

      expect(optionsWithEnabledTrue.enabled).toBe(true);
      expect(optionsWithEnabledFalse.enabled).toBe(false);
    });
  });
});
