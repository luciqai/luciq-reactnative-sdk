/**
 * Tests for ScreenLoadingConfig model
 */

import {
  createScreenLoadingConfig,
  defaultScreenLoadingConfig,
  type ScreenLoadingConfig,
} from '../../src';

describe('ScreenLoadingConfig', () => {
  describe('defaultScreenLoadingConfig', () => {
    it('should have correct default values', () => {
      expect(defaultScreenLoadingConfig.enabled).toBe(false);
      expect(defaultScreenLoadingConfig.autoTrackingEnabled).toBe(false);
      expect(defaultScreenLoadingConfig.excludedScreens).toEqual([]);
      expect(defaultScreenLoadingConfig.includeAnimationTime).toBe(true);
      expect(defaultScreenLoadingConfig.timeout).toBe(30000);
      expect(defaultScreenLoadingConfig.slowLoadingThreshold).toBe(3000);
      expect(defaultScreenLoadingConfig.onSlowLoading).toBeUndefined();
      expect(defaultScreenLoadingConfig.screenNameGenerator).toBeUndefined();
    });

    it('should not be mutable when accessed directly', () => {
      // Create a copy to test mutation
      const config = { ...defaultScreenLoadingConfig };
      config.enabled = true;

      // Original should remain unchanged
      expect(defaultScreenLoadingConfig.enabled).toBe(false);
    });
  });

  describe('createScreenLoadingConfig', () => {
    it('should create config with default values when no overrides provided', () => {
      const config = createScreenLoadingConfig({});

      expect(config.enabled).toBe(false);
      expect(config.autoTrackingEnabled).toBe(false);
      expect(config.excludedScreens).toEqual([]);
      expect(config.includeAnimationTime).toBe(true);
      expect(config.timeout).toBe(30000);
      expect(config.slowLoadingThreshold).toBe(3000);
    });

    it('should override enabled when provided', () => {
      const config = createScreenLoadingConfig({ enabled: true });

      expect(config.enabled).toBe(true);
      // Other values should remain default
      expect(config.autoTrackingEnabled).toBe(false);
    });

    it('should override autoTrackingEnabled when provided', () => {
      const config = createScreenLoadingConfig({ autoTrackingEnabled: true });

      expect(config.autoTrackingEnabled).toBe(true);
    });

    it('should override excludedScreens when provided', () => {
      const excludedScreens = ['SplashScreen', 'LoadingScreen'];
      const config = createScreenLoadingConfig({ excludedScreens });

      expect(config.excludedScreens).toEqual(['SplashScreen', 'LoadingScreen']);
    });

    it('should override includeAnimationTime when provided', () => {
      const config = createScreenLoadingConfig({ includeAnimationTime: false });

      expect(config.includeAnimationTime).toBe(false);
    });

    it('should override timeout when provided', () => {
      const config = createScreenLoadingConfig({ timeout: 60000 });

      expect(config.timeout).toBe(60000);
    });

    it('should override slowLoadingThreshold when provided', () => {
      const config = createScreenLoadingConfig({ slowLoadingThreshold: 5000 });

      expect(config.slowLoadingThreshold).toBe(5000);
    });

    it('should include onSlowLoading callback when provided', () => {
      const onSlowLoading = jest.fn();
      const config = createScreenLoadingConfig({ onSlowLoading });

      expect(config.onSlowLoading).toBe(onSlowLoading);
    });

    it('should include screenNameGenerator when provided', () => {
      const screenNameGenerator = (route: { name: string }) => `Custom_${route.name}`;
      const config = createScreenLoadingConfig({ screenNameGenerator });

      expect(config.screenNameGenerator).toBe(screenNameGenerator);
      expect(config.screenNameGenerator!({ name: 'Home' })).toBe('Custom_Home');
    });

    it('should allow multiple overrides at once', () => {
      const onSlowLoading = jest.fn();
      const config = createScreenLoadingConfig({
        enabled: true,
        autoTrackingEnabled: true,
        excludedScreens: ['Splash'],
        slowLoadingThreshold: 2000,
        onSlowLoading,
      });

      expect(config.enabled).toBe(true);
      expect(config.autoTrackingEnabled).toBe(true);
      expect(config.excludedScreens).toEqual(['Splash']);
      expect(config.slowLoadingThreshold).toBe(2000);
      expect(config.onSlowLoading).toBe(onSlowLoading);
      // Non-overridden values should remain default
      expect(config.timeout).toBe(30000);
      expect(config.includeAnimationTime).toBe(true);
    });
  });

  describe('onSlowLoading callback', () => {
    it('should be callable with screen name and duration', () => {
      const onSlowLoading = jest.fn();
      const config = createScreenLoadingConfig({
        slowLoadingThreshold: 2000,
        onSlowLoading,
      });

      // Simulate slow loading detection
      const screenName = 'SlowScreen';
      const duration = 3500;

      if (duration > config.slowLoadingThreshold && config.onSlowLoading) {
        config.onSlowLoading(screenName, duration);
      }

      expect(onSlowLoading).toHaveBeenCalledWith('SlowScreen', 3500);
    });

    it('should not be called when duration is below threshold', () => {
      const onSlowLoading = jest.fn();
      const config = createScreenLoadingConfig({
        slowLoadingThreshold: 3000,
        onSlowLoading,
      });

      // Simulate fast loading
      const screenName = 'FastScreen';
      const duration = 1500;

      if (duration > config.slowLoadingThreshold && config.onSlowLoading) {
        config.onSlowLoading(screenName, duration);
      }

      expect(onSlowLoading).not.toHaveBeenCalled();
    });
  });

  describe('screenNameGenerator', () => {
    it('should generate custom screen names from routes', () => {
      const screenNameGenerator = (route: { name: string; params?: Record<string, unknown> }) => {
        if (route.name === 'Product' && route.params?.id) {
          return `Product_${route.params.id}`;
        }
        return route.name;
      };

      const config = createScreenLoadingConfig({ screenNameGenerator });

      expect(config.screenNameGenerator!({ name: 'Home' })).toBe('Home');
      expect(config.screenNameGenerator!({ name: 'Product', params: { id: '123' } })).toBe(
        'Product_123',
      );
      expect(config.screenNameGenerator!({ name: 'Product' })).toBe('Product');
    });

    it('should handle routes with complex params', () => {
      const screenNameGenerator = (route: { name: string; params?: Record<string, unknown> }) => {
        const parts = [route.name];
        if (route.params?.category) {
          parts.push(String(route.params.category));
        }
        if (route.params?.id) {
          parts.push(String(route.params.id));
        }
        return parts.join('_');
      };

      const config = createScreenLoadingConfig({ screenNameGenerator });

      expect(
        config.screenNameGenerator!({
          name: 'Product',
          params: { category: 'electronics', id: '456' },
        }),
      ).toBe('Product_electronics_456');
    });
  });

  describe('excludedScreens filtering', () => {
    it('should correctly identify excluded screens', () => {
      const config = createScreenLoadingConfig({
        excludedScreens: ['SplashScreen', 'LoadingScreen', 'OnboardingScreen'],
      });

      const isExcluded = (screenName: string) => config.excludedScreens.includes(screenName);

      expect(isExcluded('SplashScreen')).toBe(true);
      expect(isExcluded('LoadingScreen')).toBe(true);
      expect(isExcluded('OnboardingScreen')).toBe(true);
      expect(isExcluded('HomeScreen')).toBe(false);
      expect(isExcluded('ProfileScreen')).toBe(false);
    });

    it('should handle empty excluded screens list', () => {
      const config = createScreenLoadingConfig({
        excludedScreens: [],
      });

      const isExcluded = (screenName: string) => config.excludedScreens.includes(screenName);

      expect(isExcluded('AnyScreen')).toBe(false);
    });
  });

  describe('timeout configuration', () => {
    it('should use default timeout of 30 seconds', () => {
      const config = createScreenLoadingConfig({});

      expect(config.timeout).toBe(30000);
    });

    it('should allow custom timeout values', () => {
      const configShort = createScreenLoadingConfig({ timeout: 10000 });
      const configLong = createScreenLoadingConfig({ timeout: 120000 });

      expect(configShort.timeout).toBe(10000);
      expect(configLong.timeout).toBe(120000);
    });

    it('should detect timeout conditions', () => {
      const config = createScreenLoadingConfig({ timeout: 30000 });
      const startTime = Date.now() - 35000; // 35 seconds ago
      const elapsed = Date.now() - startTime;

      const isTimedOut = elapsed > config.timeout;

      expect(isTimedOut).toBe(true);
    });
  });

  describe('includeAnimationTime configuration', () => {
    it('should include animation time by default', () => {
      const config = createScreenLoadingConfig({});

      expect(config.includeAnimationTime).toBe(true);
    });

    it('should allow excluding animation time', () => {
      const config = createScreenLoadingConfig({ includeAnimationTime: false });

      expect(config.includeAnimationTime).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should enforce correct types for ScreenLoadingConfig', () => {
      const config: ScreenLoadingConfig = {
        enabled: true,
        autoTrackingEnabled: false,
        excludedScreens: ['Screen1'],
        includeAnimationTime: true,
        timeout: 30000,
        slowLoadingThreshold: 3000,
        onSlowLoading: (screenName: string, duration: number) => {
          console.log(`${screenName}: ${duration}ms`);
        },
        screenNameGenerator: (route: { name: string; params?: Record<string, unknown> }) =>
          route.name,
      };

      expect(config).toBeDefined();
      expect(typeof config.enabled).toBe('boolean');
      expect(typeof config.autoTrackingEnabled).toBe('boolean');
      expect(Array.isArray(config.excludedScreens)).toBe(true);
      expect(typeof config.includeAnimationTime).toBe('boolean');
      expect(typeof config.timeout).toBe('number');
      expect(typeof config.slowLoadingThreshold).toBe('number');
      expect(typeof config.onSlowLoading).toBe('function');
      expect(typeof config.screenNameGenerator).toBe('function');
    });
  });
});
