import React, { useEffect, type ComponentType, type JSX } from 'react';

import { useScreenLoading, type UseScreenLoadingOptions } from '../hooks';

/**
 * Options for the withScreenLoading HOC
 */
export interface WithScreenLoadingOptions extends Omit<UseScreenLoadingOptions, 'autoStart'> {
  /**
   * Screen name for measurement. Defaults to component displayName or name.
   * If not provided and NavigationTimingProvider is not available, uses the component name.
   */
  screenName?: string;

  /**
   * Automatically report TTID on mount (default: true)
   */
  autoReportTTID?: boolean;
}

/**
 * Props injected into the wrapped component by withScreenLoading
 */
export interface WithScreenLoadingInjectedProps {
  /**
   * Report a custom loading stage
   * @param stageName - Name of the stage (e.g., 'data_loaded', 'images_ready')
   */
  reportStage: (stageName: string) => void;

  /**
   * The screen name being tracked
   */
  screenLoadingScreenName: string;

  /**
   * Get the elapsed time since measurement started
   */
  getElapsedTime: () => number;
}

/**
 * Higher-order component that adds screen loading measurement to a screen component.
 *
 * This HOC provides a declarative way to add screen loading tracking to your screens.
 * It automatically reports TTID on mount and provides functions to report custom stages.
 *
 * For class components or when you need a simple wrapper approach.
 * For functional components with more control, consider using {@link useScreenLoading} hook directly.
 *
 * @example
 * Basic usage - auto-reports TTID on mount:
 * ```tsx
 * const HomeScreen = withScreenLoading(function HomeScreen() {
 *   return (
 *     <View>
 *       <Text>Home</Text>
 *     </View>
 *   );
 * });
 * ```
 *
 * @example
 * With custom stages for data loading:
 * ```tsx
 * interface ProfileScreenProps extends WithScreenLoadingInjectedProps {
 *   userId: string;
 * }
 *
 * const ProfileScreen = withScreenLoading(
 *   function ProfileScreen({ userId, reportStage }: ProfileScreenProps) {
 *     const [data, setData] = useState(null);
 *
 *     useEffect(() => {
 *       fetchProfile(userId).then((result) => {
 *         setData(result);
 *         reportStage('data_loaded'); // Report custom stage
 *       });
 *     }, [userId, reportStage]);
 *
 *     return <ProfileContent data={data} />;
 *   },
 *   { screenName: 'ProfileScreen' }
 * );
 * ```
 *
 * @param WrappedComponent - The component to wrap with screen loading measurement
 * @param options - Configuration options for screen loading
 * @returns A new component with screen loading measurement capabilities
 */
export function withScreenLoading<P extends object>(
  WrappedComponent: ComponentType<P & Partial<WithScreenLoadingInjectedProps>>,
  options: WithScreenLoadingOptions = {},
): ComponentType<Omit<P, keyof WithScreenLoadingInjectedProps>> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  const { screenName: configuredScreenName, autoReportTTID = true, useDispatchTime } = options;

  function WithScreenLoadingComponent(
    props: Omit<P, keyof WithScreenLoadingInjectedProps>,
  ): JSX.Element {
    const { reportInitialDisplay, reportStage, screenName, getElapsedTime } = useScreenLoading({
      screenName: configuredScreenName || displayName,
      autoStart: true,
      useDispatchTime,
    });

    // Auto-report TTID on mount
    useEffect(() => {
      if (autoReportTTID) {
        reportInitialDisplay();
      }
    }, [reportInitialDisplay]);

    // Inject screen loading props into the wrapped component
    const injectedProps: WithScreenLoadingInjectedProps = {
      reportStage,
      screenLoadingScreenName: screenName,
      getElapsedTime,
    };

    return <WrappedComponent {...(props as P)} {...injectedProps} />;
  }

  WithScreenLoadingComponent.displayName = `withScreenLoading(${displayName})`;

  return WithScreenLoadingComponent;
}

export default withScreenLoading;
