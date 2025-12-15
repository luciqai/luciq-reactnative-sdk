import React, { type ReactNode } from 'react';

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
 * State for LuciqNavigationContainer class component
 */
interface LuciqNavigationContainerState {
  isReady: boolean;
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
export class LuciqNavigationContainer extends React.Component<
  LuciqNavigationContainerProps,
  LuciqNavigationContainerState
> {
  private navigationRef: NavigationRef['current'] = null;
  private lastScreenName: string | null = null;

  // Lifecycle timing tracking
  private constructorTime: number = 0;
  private willMountTime: number = 0;
  private didMountTime: number = 0;
  private lastUpdateTime: number = 0;

  constructor(props: LuciqNavigationContainerProps) {
    super(props);
    this.constructorTime = Date.now();
    console.log('[LuciqNavigationContainer] Constructor called - component is being constructed', {
      timestamp: this.constructorTime,
    });

    this.state = {
      isReady: false,
    };
  }

  componentWillMount(): void {
    this.willMountTime = Date.now();
    const durationSinceConstructor = this.willMountTime - this.constructorTime;
    console.log('[LuciqNavigationContainer] componentWillMount - component is about to mount', {
      timestamp: this.willMountTime,
      durationSinceConstructor: `${durationSinceConstructor}ms`,
    });
  }

  componentDidMount(): void {
    this.didMountTime = Date.now();
    const durationSinceWillMount = this.didMountTime - this.willMountTime;
    const durationSinceConstructor = this.didMountTime - this.constructorTime;
    console.log('[LuciqNavigationContainer] componentDidMount - component has mounted', {
      timestamp: this.didMountTime,
      durationSinceWillMount: `${durationSinceWillMount}ms`,
      totalMountDuration: `${durationSinceConstructor}ms`,
    });
    this.lastUpdateTime = this.didMountTime;
  }

  layoutDidChange(): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    console.log('[LuciqNavigationContainer] layoutDidChange - component layout has changed', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
    });
  }

  componentDidUpdate(
    prevProps: LuciqNavigationContainerProps,
    prevState: LuciqNavigationContainerState,
  ): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    console.log('[LuciqNavigationContainer] componentDidUpdate - component has updated', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
      prevProps: {
        enableScreenTracking: prevProps.enableScreenTracking,
        enableScreenLoading: prevProps.enableScreenLoading,
        excludedScreens: prevProps.excludedScreens,
      },
      currentProps: {
        enableScreenTracking: this.props.enableScreenTracking,
        enableScreenLoading: this.props.enableScreenLoading,
        excludedScreens: this.props.excludedScreens,
      },
      prevState,
      currentState: this.state,
    });
    this.lastUpdateTime = now;
  }

  componentWillUnmount(): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    const totalLifetime = now - this.constructorTime;
    console.log('[LuciqNavigationContainer] componentWillUnmount - component is about to unmount', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
      totalLifetime: `${totalLifetime}ms`,
    });
  }

  /**
   * Get the effective screen loading configuration
   */
  private getEffectiveConfig(): Partial<ScreenLoadingConfig> {
    const { enableScreenLoading = false, excludedScreens = [], screenNameExtractor, screenLoadingConfig } = this.props;
    
    return {
      enabled: enableScreenLoading,
      excludedScreens,
      screenNameGenerator: screenNameExtractor,
      ...screenLoadingConfig,
    };
  }

  /**
   * Check if a screen should be excluded from tracking
   */
  private isScreenExcluded = (screenName: string): boolean => {
    const effectiveConfig = this.getEffectiveConfig();
    const excluded = effectiveConfig.excludedScreens || [];
    return excluded.includes(screenName);
  };

  /**
   * Get the effective screen name using custom extractor if provided
   */
  private getEffectiveScreenName = (route: { name: string; params?: Record<string, unknown> }): string => {
    const effectiveConfig = this.getEffectiveConfig();
    if (effectiveConfig.screenNameGenerator) {
      return effectiveConfig.screenNameGenerator(route);
    }
    return route.name;
  };

  /**
   * Handle state changes for screen tracking
   */
  private handleStateChange = (state: NavigationState | undefined): void => {
    const { onStateChange, enableScreenTracking = true } = this.props;

    // Call user's onStateChange if provided
    onStateChange?.(state);

    if (!state) {
      return;
    }

    const currentScreenName = getActiveRouteName(state);

    if (currentScreenName && !this.isScreenExcluded(currentScreenName)) {
      // Get effective screen name
      const route = state.routes[state.index];
      const effectiveScreenName = route
        ? this.getEffectiveScreenName({ name: route.name, params: route.params })
        : currentScreenName;

      // Only track if screen changed
      if (effectiveScreenName !== this.lastScreenName) {
        this.lastScreenName = effectiveScreenName;

        // Call Luciq's screen change handler if tracking is enabled
        if (enableScreenTracking) {
          // Cast to the expected type - Luciq.onStateChange accepts a generic navigation state
          Luciq.onStateChange(state as any);
        }
      }
    }
  };

  /**
   * Handle navigation ready event
   */
  private handleReady = (): void => {
    const { onReady } = this.props;
    const effectiveConfig = this.getEffectiveConfig();

    this.setState({ isReady: true });

    // Enable screen loading if requested
    if (effectiveConfig.enabled) {
      APM.setScreenLoadingEnabled(true);
      //todo: need to be refactored
      Luciq.setAutoScreenLoadingEnabled(effectiveConfig.autoTrackingEnabled || false);
    }

    // Get initial screen name
    if (this.navigationRef) {
      const state = this.navigationRef.getRootState?.();
      const initialScreen = getActiveRouteName(state);
      if (initialScreen) {
        this.lastScreenName = initialScreen;
      }
    }

    // Call user's onReady if provided
    onReady?.();
  };

  /**
   * Handle ref assignment and merging with user ref
   */
  private handleRef = (instance: any): void => {
    this.navigationRef = instance;

    // Handle user's ref if provided
    const userRef = this.props.ref;
    if (userRef) {
      if (typeof userRef === 'function') {
        userRef(instance);
      } else if (typeof userRef === 'object' && userRef !== null) {
        (userRef as React.MutableRefObject<any>).current = instance;
      }
    }
  };

  /**
   * Create the navigation ref object for NavigationTimingProvider
   */
  private getNavigationRefForProvider(): NavigationRef {
    return {
      current: this.navigationRef,
    };
  }

  render(): React.ReactElement {
    const {
      children,
      NavigationContainer: NavigationContainerComponent,
      // Extract props that shouldn't be passed to NavigationContainer
      enableScreenTracking: _enableScreenTracking,
      enableScreenLoading: _enableScreenLoading,
      screenNameExtractor: _screenNameExtractor,
      excludedScreens: _excludedScreens,
      screenLoadingConfig: _screenLoadingConfig,
      onStateChange: _onStateChange,
      onReady: _onReady,
      ...props
    } = this.props;

    const navigationRefForProvider = this.getNavigationRefForProvider();

    // Render with NavigationContainer if provided
    if (NavigationContainerComponent) {
      return (
        <NavigationContainerComponent
          {...props}
          ref={this.handleRef}
          onStateChange={this.handleStateChange}
          onReady={this.handleReady}>
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
}

export default LuciqNavigationContainer;
