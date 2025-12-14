/**
 * Configuration options for the screen loading measurement feature
 */
export interface ScreenLoadingConfig {
  /**
   * Enable screen loading measurement
   * Default: false
   */
  enabled: boolean;

  /**
   * Enable automatic measurement via navigation events
   * When true, TTID/TTFD are measured automatically for all screens
   * Default: false
   */
  autoTrackingEnabled: boolean;

  /**
   * Screens to exclude from automatic tracking
   * Default: []
   */
  excludedScreens: string[];

  /**
   * Include animation duration in screen loading time
   * When false, measurement starts after transition animation completes
   * Default: true (measure from dispatch)
   */
  includeAnimationTime: boolean;

  /**
   * Timeout (ms) after which screen loading is considered failed
   * Default: 30000 (30 seconds)
   */
  timeout: number;

  /**
   * Threshold (ms) above which a warning is logged
   * Default: 3000 (3 seconds)
   */
  slowLoadingThreshold: number;

  /**
   * Callback when screen loading exceeds threshold
   */
  onSlowLoading?: (screenName: string, duration: number) => void;

  /**
   * Custom function to generate screen names from routes
   */
  screenNameGenerator?: (route: { name: string; params?: Record<string, unknown> }) => string;
}

/**
 * Default screen loading configuration
 */
export const defaultScreenLoadingConfig: ScreenLoadingConfig = {
  enabled: false,
  autoTrackingEnabled: false,
  excludedScreens: [],
  includeAnimationTime: true,
  timeout: 30000,
  slowLoadingThreshold: 3000,
  onSlowLoading: undefined,
  screenNameGenerator: undefined,
};

/**
 * Create a screen loading configuration with partial overrides
 *
 * @example
 * ```tsx
 * const config = createScreenLoadingConfig({
 *   enabled: true,
 *   autoTrackingEnabled: true,
 *   excludedScreens: ['SplashScreen'],
 *   slowLoadingThreshold: 2000,
 *   onSlowLoading: (screenName, duration) => {
 *     console.warn(`Slow screen load: ${screenName} took ${duration}ms`);
 *   },
 * });
 * ```
 */
export function createScreenLoadingConfig(
  overrides: Partial<ScreenLoadingConfig>,
): ScreenLoadingConfig {
  return {
    ...defaultScreenLoadingConfig,
    ...overrides,
  };
}
