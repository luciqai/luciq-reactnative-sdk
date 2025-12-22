import React from 'react';
import { requireNativeComponent, ViewStyle } from 'react-native';
import type {
  NativeScreenLoadingViewProps,
  ScreenLoadingEvent,
} from '../native/NativeScreenLoadingView';
import * as APM from '../modules/APM';
import { useNavigationTiming, NavigationTimingContextValue } from './NavigationTimingProvider';

const NativeScreenLoadingView =
  requireNativeComponent<NativeScreenLoadingViewProps>('LCQScreenLoadingView');

/**
 * Props for screen loading measurement component
 */
export interface ScreenLoadingProps {
  /** Whether to record this measurement (default: true) */
  record?: boolean;
  /** Screen name for the measurement. Auto-detected if NavigationTimingProvider is used */
  screenName?: string;
  /** Children to render */
  children?: React.ReactNode;
  /** Callback when measurement is complete */
  onMeasured?: (duration: number) => void;
  /**
   * Use navigation dispatch time as start time instead of component render time.
   * Requires NavigationTimingProvider to be set up.
   * Default: true when provider is available
   */
  useDispatchTime?: boolean;
}

/**
 * Internal props that include navigation timing data for class components
 */
interface ScreenLoadingClassProps extends ScreenLoadingProps {
  navigationTiming: NavigationTimingContextValue;
}

/**
 * State interface for ScreenLoadingClass component
 */
interface ScreenLoadingState {
  hasReported: boolean;
}

/**
 * Class component for measuring Time To Initial Display (TTID)
 *
 * Place this at the top of your screen component to measure when
 * the initial UI becomes visible to the user.
 */
class ScreenLoadingClass extends React.Component<ScreenLoadingClassProps, ScreenLoadingState> {
  private dispatchTimeRef: number | null = null;
  private lastScreenName: string = '';
  private lastDispatchTime: number | null = null;

  // Lifecycle timing tracking
  private constructorTime: number = 0;
  private willMountTime: number = 0;
  private didMountTime: number = 0;
  private lastUpdateTime: number = 0;

  constructor(props: ScreenLoadingClassProps) {
    super(props);
    this.constructorTime = Date.now();
    console.log('[LuciqScreenLoading] Constructor called - component is being constructed', {
      timestamp: this.constructorTime,
    });

    const { navigationTiming, useDispatchTime = true, screenName } = props;
    const effectiveScreenName = screenName || navigationTiming.currentScreenName || '';

    this.state = {
      hasReported: false,
    };

    this.dispatchTimeRef = useDispatchTime ? navigationTiming.dispatchTime : null;
    this.lastScreenName = effectiveScreenName;
    this.lastDispatchTime = navigationTiming.dispatchTime;
  }

  componentWillMount(): void {
    this.willMountTime = Date.now();
    const durationSinceConstructor = this.willMountTime - this.constructorTime;
    console.log('[LuciqScreenLoading] componentWillMount - component is about to mount', {
      timestamp: this.willMountTime,
      durationSinceConstructor: `${durationSinceConstructor}ms`,
    });
  }

  componentDidMount(): void {
    this.didMountTime = Date.now();
    const durationSinceWillMount = this.didMountTime - this.willMountTime;
    const durationSinceConstructor = this.didMountTime - this.constructorTime;
    console.log('[LuciqScreenLoading] componentDidMount - component has mounted', {
      timestamp: this.didMountTime,
      durationSinceWillMount: `${durationSinceWillMount}ms`,
      totalMountDuration: `${durationSinceConstructor}ms`,
    });
    this.lastUpdateTime = this.didMountTime;
  }

  layoutDidChange(): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    console.log('[LuciqScreenLoading] layoutDidChange - component layout has changed', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
    });
  }

  componentDidUpdate(prevProps: ScreenLoadingClassProps, prevState: ScreenLoadingState): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    console.log('[LuciqScreenLoading] componentDidUpdate - component has updated', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
      prevProps: {
        screenName: prevProps.screenName,
        record: prevProps.record,
        useDispatchTime: prevProps.useDispatchTime,
      },
      currentProps: {
        screenName: this.props.screenName,
        record: this.props.record,
        useDispatchTime: this.props.useDispatchTime,
      },
      prevState,
      currentState: this.state,
    });
    this.lastUpdateTime = now;

    const { navigationTiming, useDispatchTime = true, screenName } = this.props;
    const effectiveScreenName = screenName || navigationTiming.currentScreenName || '';

    const screenNameChanged = this.lastScreenName !== effectiveScreenName;
    const dispatchTimeChanged =
      useDispatchTime &&
      navigationTiming.dispatchTime !== null &&
      this.lastDispatchTime !== navigationTiming.dispatchTime;

    if (screenNameChanged || dispatchTimeChanged) {
      this.setState({ hasReported: false });
      this.dispatchTimeRef = useDispatchTime ? navigationTiming.dispatchTime : null;
      this.lastScreenName = effectiveScreenName;
      this.lastDispatchTime = navigationTiming.dispatchTime;
    }
  }

  componentWillUnmount(): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    const totalLifetime = now - this.constructorTime;
    console.log('[LuciqScreenLoading] componentWillUnmount - component is about to unmount', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
      totalLifetime: `${totalLifetime}ms`,
    });
  }

  private handleDisplay = (event: { nativeEvent: ScreenLoadingEvent }): void => {
    if (this.state.hasReported) {
      return;
    }

    const { navigationTiming, screenName, useDispatchTime = true, onMeasured } = this.props;
    const effectiveScreenName = screenName || navigationTiming.currentScreenName || '';

    this.setState({ hasReported: true });

    // Calculate duration from dispatch time if available and enabled
    let duration = this.constructorTime - event.nativeEvent.endTime;
    let startTime = this.constructorTime;

    if (useDispatchTime && this.dispatchTimeRef) {
      startTime = this.dispatchTimeRef;
      duration = event.nativeEvent.endTime - startTime;
    }

    // Report to APM module
    APM._reportScreenLoadingMetric({
      type: 'initial_display',
      screenName: effectiveScreenName,
      duration,
      startTime,
      endTime: event.nativeEvent.endTime,
    });

    onMeasured?.(duration);
  };

  render(): React.ReactElement {
    const renderTime = Date.now();
    const durationSinceLastUpdate = renderTime - (this.lastUpdateTime || this.constructorTime);
    const durationSinceConstructor = renderTime - this.constructorTime;
    console.log('[LuciqScreenLoading] render - component is rendering', {
      timestamp: renderTime,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
      totalSinceConstructor: `${durationSinceConstructor}ms`,
      hasReported: this.state.hasReported,
    });

    const { children, record = true, screenName, navigationTiming } = this.props;
    const effectiveScreenName = screenName || navigationTiming.currentScreenName || '';

    if (!APM.isScreenLoadingEnabled()) {
      return <>{children}</>;
    }

    // Invisible view that tracks render timing
    const style: ViewStyle = {
      position: 'absolute',
      width: 0,
      height: 0,
      overflow: 'hidden',
    };

    return (
      <>
        <NativeScreenLoadingView
          style={style}
          displayType="initialDisplay"
          record={record}
          screenName={effectiveScreenName}
          onDisplay={this.handleDisplay}
        />
        {children}
      </>
    );
  }
}

/**
 * Component for measuring Time To Initial Display (TTID)
 *
 * Place this at the top of your screen component to measure when
 * the initial UI becomes visible to the user.
 *
 * @example
 * ```tsx
 * // Basic usage - screen name auto-detected from navigation
 * function HomeScreen() {
 *   return (
 *     <View>
 *       <LuciqScreenLoading />
 *       <Text>Home Screen Content</Text>
 *     </View>
 *   );
 * }
 *
 * // With manual screen name
 * function ProfileScreen() {
 *   return (
 *     <View>
 *       <LuciqScreenLoading
 *         screenName="ProfileScreen"
 *         onMeasured={(duration) => console.log(`TTID: ${duration}ms`)}
 *       />
 *       <ProfileContent />
 *     </View>
 *   );
 * }
 * ```
 */
function LuciqScreenLoading(props: ScreenLoadingProps): React.ReactElement {
  const navigationTiming = useNavigationTiming();
  return <ScreenLoadingClass {...props} navigationTiming={navigationTiming} />;
}

export default LuciqScreenLoading;
