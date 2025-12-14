import React, { useRef, useCallback, useMemo, useEffect, type JSX, type ReactNode } from 'react';

import { NavigationTimingProvider } from './NavigationTimingProvider';
import * as Luciq from '../modules/Luciq';
import * as APM from '../modules/APM';
import type { ScreenLoadingConfig } from '../models/ScreenLoadingConfig';

/**
 * Type for navigation state - compatible with React Navigation v5+
 */
interface NavigationState {
  index: number;
  routes: Array<{
    name: string;
    key: string;
    params?: Record<string, unknown>;
    state?: NavigationState;
  }>;
}

/**
 * Type for navigation ref - using a generic type to avoid requiring @react-navigation/native as a dependency
 * This allows the container to work with any navigation ref that has the expected shape
 */
interface NavigationRef {
  current?: {
    addListener: (event: string, callback: (e: any) => void) => () => void;
    getRootState: () => NavigationState | undefined;
    isReady: () => boolean;
  } | null;
}

/**
 * Props for NavigationContainer from @react-navigation/native
 * We define a minimal interface to avoid requiring the package as a dependency
 */
interface NavigationContainerProps {
  children?: ReactNode;
  onStateChange?: (state: NavigationState | undefined) => void;
  onReady?: () => void;
  ref?: React.Ref<any>;
  [key: string]: unknown;
}

/**
 * Props for LuciqNavigationContainer
 */
export interface LuciqNavigationContainerProps extends NavigationContainerProps {
  /**
   * Enable automatic screen tracking and repro steps
   * Default: true
   */
  enableScreenTracking?: boolean;

  /**
   * Enable automatic screen loading measurement using dispatch timing
   * Default: false (use APM.setScreenLoadingEnabled to control globally)
   */
  enableScreenLoading?: boolean;

  /**
   * Custom function to extract screen name from route
   * Default: Uses route name
   */
  screenNameExtractor?: (route: { name: string; params?: Record<string, unknown> }) => string;

  /**
   * Screens to exclude from automatic tracking
   */
  excludedScreens?: string[];

  /**
   * Full screen loading configuration (overrides individual props)
   */
  screenLoadingConfig?: Partial<ScreenLoadingConfig>;

  /**
   * The NavigationContainer component to wrap
   * If not provided, you must wrap children manually with NavigationContainer
   *
   * @example
   * ```tsx
   * import { NavigationContainer } from '@react-navigation/native';
   *
   * <LuciqNavigationContainer NavigationContainer={NavigationContainer}>
   *   <Stack.Navigator>...</Stack.Navigator>
   * </LuciqNavigationContainer>
   * ```
   */
  NavigationContainer?: React.ComponentType<NavigationContainerProps>;
}

/**
 * Helper function to extract the active route name from navigation state
 * Recursively traverses nested navigators to find the deepest active route
 */
function getActiveRouteName(state: NavigationState | undefined): string | null {
  if (!state) {
    return null;
  }

  const route = state.routes?.[state.index];
  if (!route) {
    return null;
  }

  // Dive into nested navigators
  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name || null;
}

/**
 * LuciqNavigationContainer
 *
 * A drop-in wrapper for NavigationContainer that automatically sets up Luciq tracking including:
 * - Screen change reporting for repro steps
 * - Navigation timing context for screen loading
 * - Automatic TTID/TTFD measurement (when enabled)
 *
 * This component provides the NavigationTimingProvider context to all children,
 * enabling automatic screen name detection in LuciqScreenLoading components.
 *
 * @example
 * Basic usage with NavigationContainer prop:
 * ```tsx
 * import { NavigationContainer } from '@react-navigation/native';
 * import { LuciqNavigationContainer } from '@luciq/react-native';
 *
 * function App() {
 *   return (
 *     <LuciqNavigationContainer
 *       NavigationContainer={NavigationContainer}
 *       enableScreenLoading={true}
 *       excludedScreens={['SplashScreen']}
 *     >
 *       <Stack.Navigator>
 *         <Stack.Screen name="Home" component={HomeScreen} />
 *         <Stack.Screen name="Profile" component={ProfileScreen} />
 *       </Stack.Navigator>
 *     </LuciqNavigationContainer>
 *   );
 * }
 * ```
 *
 * @example
 * Usage with existing NavigationContainer setup:
 * ```tsx
 * import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
 * import { LuciqNavigationContainer } from '@luciq/react-native';
 *
 * function App() {
 *   const navigationRef = useNavigationContainerRef();
 *
 *   return (
 *     <NavigationContainer ref={navigationRef}>
 *       <LuciqNavigationContainer
 *         navigationRef={navigationRef}
 *         enableScreenLoading={true}
 *       >
 *         <Stack.Navigator>...</Stack.Navigator>
 *       </LuciqNavigationContainer>
 *     </NavigationContainer>
 *   );
 * }
 * ```
 *
 * @example
 * With custom screen name extraction:
 * ```tsx
 * <LuciqNavigationContainer
 *   NavigationContainer={NavigationContainer}
 *   screenNameExtractor={(route) => {
 *     // Include params in screen name for analytics
 *     if (route.name === 'Product' && route.params?.id) {
 *       return `Product-${route.params.id}`;
 *     }
 *     return route.name;
 *   }}
 * >
 *   {children}
 * </LuciqNavigationContainer>
 * ```
 */
export function LuciqNavigationContainer({
  children,
  enableScreenTracking = true,
  enableScreenLoading = false,
  screenNameExtractor,
  excludedScreens = [],
  screenLoadingConfig,
  NavigationContainer: NavigationContainerComponent,
  onStateChange,
  onReady,
  ...props
}: LuciqNavigationContainerProps): JSX.Element {
  const navigationRef = useRef<NavigationRef['current']>(null);
  const isReadyRef = useRef(false);
  const lastScreenNameRef = useRef<string | null>(null);

  // Merge config from props and screenLoadingConfig
  const effectiveConfig = useMemo(() => {
    const config: Partial<ScreenLoadingConfig> = {
      enabled: enableScreenLoading,
      excludedScreens,
      screenNameGenerator: screenNameExtractor,
      ...screenLoadingConfig,
    };
    return config;
  }, [enableScreenLoading, excludedScreens, screenNameExtractor, screenLoadingConfig]);

  // Check if a screen should be excluded from tracking
  const isScreenExcluded = useCallback(
    (screenName: string): boolean => {
      const excluded = effectiveConfig.excludedScreens || [];
      return excluded.includes(screenName);
    },
    [effectiveConfig.excludedScreens],
  );

  // Get the effective screen name using custom extractor if provided
  const getEffectiveScreenName = useCallback(
    (route: { name: string; params?: Record<string, unknown> }): string => {
      if (effectiveConfig.screenNameGenerator) {
        return effectiveConfig.screenNameGenerator(route);
      }
      return route.name;
    },
    [effectiveConfig],
  );

  // Handle state changes for screen tracking
  const handleStateChange = useCallback(
    (state: NavigationState | undefined) => {
      // Call user's onStateChange if provided
      onStateChange?.(state);

      if (!state) {
        return;
      }

      const currentScreenName = getActiveRouteName(state);

      if (currentScreenName && !isScreenExcluded(currentScreenName)) {
        // Get effective screen name
        const route = state.routes[state.index];
        const effectiveScreenName = route
          ? getEffectiveScreenName({ name: route.name, params: route.params })
          : currentScreenName;

        // Only track if screen changed
        if (effectiveScreenName !== lastScreenNameRef.current) {
          lastScreenNameRef.current = effectiveScreenName;

          // Call Luciq's screen change handler if tracking is enabled
          if (enableScreenTracking) {
            // Cast to the expected type - Luciq.onStateChange accepts a generic navigation state
            Luciq.onStateChange(state as any);
          }
        }
      }
    },
    [enableScreenTracking, onStateChange, isScreenExcluded, getEffectiveScreenName],
  );

  // Set up navigation listener on ready
  const handleReady = useCallback(() => {
    isReadyRef.current = true;

    // Enable screen loading if requested
    if (effectiveConfig.enabled) {
      APM.setScreenLoadingEnabled(true);
      //todo: need to be refactored
      Luciq.setAutoScreenLoadingEnabled(effectiveConfig.autoTrackingEnabled || false);
    }

    // Get initial screen name
    if (navigationRef.current) {
      const state = navigationRef.current.getRootState?.();
      const initialScreen = getActiveRouteName(state);
      if (initialScreen) {
        lastScreenNameRef.current = initialScreen;
      }
    }

    // Call user's onReady if provided
    onReady?.();
  }, [effectiveConfig, onReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isReadyRef.current = false;
    };
  }, []);

  // Handle ref assignment and merging with user ref
  const handleRef = useCallback(
    (instance: any) => {
      navigationRef.current = instance;

      // Handle user's ref if provided
      const userRef = props.ref;
      if (userRef) {
        if (typeof userRef === 'function') {
          userRef(instance);
        } else if (typeof userRef === 'object' && userRef !== null) {
          (userRef as React.MutableRefObject<any>).current = instance;
        }
      }
    },
    [props.ref],
  );

  // Create the navigation ref object for NavigationTimingProvider
  const navigationRefForProvider = useMemo<NavigationRef>(
    () => ({
      get current() {
        return navigationRef.current;
      },
    }),
    [],
  );

  // Render with NavigationContainer if provided
  if (NavigationContainerComponent) {
    return (
      <NavigationContainerComponent
        {...props}
        ref={handleRef}
        onStateChange={handleStateChange}
        onReady={handleReady}>
        <NavigationTimingProvider navigationRef={navigationRefForProvider}>
          {children}
        </NavigationTimingProvider>
      </NavigationContainerComponent>
    );
  }

  // Render only the provider wrapper if NavigationContainer is handled externally
  return (
    <NavigationTimingProvider navigationRef={navigationRefForProvider}>
      {children}
    </NavigationTimingProvider>
  );
}

export default LuciqNavigationContainer;
