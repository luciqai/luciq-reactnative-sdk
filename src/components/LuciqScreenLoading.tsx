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
 * Props for screen loading measurement components
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
  /**
   * Custom attributes to attach to this measurement
   */
  attributes?: Record<string, string>;
}

/**
 * Internal props that include navigation timing data for class components
 */
interface ScreenLoadingClassProps extends ScreenLoadingProps {
  navigationTiming: NavigationTimingContextValue;
}

/**
 * State interface for InitialDisplay class component
 */
interface InitialDisplayState {
  hasReported: boolean;
}

/**
 * Class component for measuring Time To Initial Display (TTID)
 *
 * Place this at the top of your screen component to measure when
 * the initial UI becomes visible to the user.
 */
class InitialDisplayClass extends React.Component<ScreenLoadingClassProps, InitialDisplayState> {
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
    console.log('[InitialDisplayClass] Constructor called - component is being constructed', {
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
    console.log('[InitialDisplayClass] componentWillMount - component is about to mount', {
      timestamp: this.willMountTime,
      durationSinceConstructor: `${durationSinceConstructor}ms`,
    });
  }

  componentDidMount(): void {
    this.didMountTime = Date.now();
    const durationSinceWillMount = this.didMountTime - this.willMountTime;
    const durationSinceConstructor = this.didMountTime - this.constructorTime;
    console.log('[InitialDisplayClass] componentDidMount - component has mounted', {
      timestamp: this.didMountTime,
      durationSinceWillMount: `${durationSinceWillMount}ms`,
      totalMountDuration: `${durationSinceConstructor}ms`,
    });
    this.lastUpdateTime = this.didMountTime;
  }

  layoutDidChange(): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    console.log('[InitialDisplayClass] layoutDidChange - component layout has changed', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
    });
  }

  componentDidUpdate(prevProps: ScreenLoadingClassProps, prevState: InitialDisplayState): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    console.log('[InitialDisplayClass] componentDidUpdate - component has updated', {
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
    console.log('[InitialDisplayClass] componentWillUnmount - component is about to unmount', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
      totalLifetime: `${totalLifetime}ms`,
    });
  }

  private handleDisplay = (event: { nativeEvent: ScreenLoadingEvent }): void => {
    if (this.state.hasReported) {
      return;
    }

    const {
      navigationTiming,
      screenName,
      useDispatchTime = true,
      attributes,
      onMeasured,
    } = this.props;
    const effectiveScreenName = screenName || navigationTiming.currentScreenName || '';

    this.setState({ hasReported: true });

    // Calculate duration from dispatch time if available and enabled
    let duration = event.nativeEvent.duration;
    let startTime = event.nativeEvent.startTime;

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

    // Report custom attributes if provided
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        //todo: replace with screen loading
        APM.setFlowAttribute(effectiveScreenName, key, value);
      });
    }

    onMeasured?.(duration);
  };

  render(): React.ReactElement {
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
 * State interface for FullDisplay class component
 */
interface FullDisplayState {
  hasReported: boolean;
}

/**
 * Class component for measuring Time To Full Display (TTFD)
 *
 * Place this where your screen is fully loaded, typically after
 * async data has been fetched and rendered.
 */
class FullDisplayClass extends React.Component<ScreenLoadingClassProps, FullDisplayState> {
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
    console.log('[FullDisplayClass] Constructor called - component is being constructed', {
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
    console.log('[FullDisplayClass] componentWillMount - component is about to mount', {
      timestamp: this.willMountTime,
      durationSinceConstructor: `${durationSinceConstructor}ms`,
    });
  }

  componentDidMount(): void {
    this.didMountTime = Date.now();
    const durationSinceWillMount = this.didMountTime - this.willMountTime;
    const durationSinceConstructor = this.didMountTime - this.constructorTime;
    console.log('[FullDisplayClass] componentDidMount - component has mounted', {
      timestamp: this.didMountTime,
      durationSinceWillMount: `${durationSinceWillMount}ms`,
      totalMountDuration: `${durationSinceConstructor}ms`,
    });
    this.lastUpdateTime = this.didMountTime;
  }

  layoutDidChange(): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    console.log('[FullDisplayClass] layoutDidChange - component layout has changed', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
    });
  }

  componentDidUpdate(prevProps: ScreenLoadingClassProps, prevState: FullDisplayState): void {
    const now = Date.now();
    const durationSinceLastUpdate = now - this.lastUpdateTime;
    console.log('[FullDisplayClass] componentDidUpdate - component has updated', {
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
    console.log('[FullDisplayClass] componentWillUnmount - component is about to unmount', {
      timestamp: now,
      durationSinceLastUpdate: `${durationSinceLastUpdate}ms`,
      totalLifetime: `${totalLifetime}ms`,
    });
  }

  private handleDisplay = (event: { nativeEvent: ScreenLoadingEvent }): void => {
    if (this.state.hasReported) {
      return;
    }

    const {
      navigationTiming,
      screenName,
      useDispatchTime = true,
      attributes,
      onMeasured,
    } = this.props;
    const effectiveScreenName = screenName || navigationTiming.currentScreenName || '';

    // Check if TTID exists for this screen
    if (!APM._hasInitialDisplayForScreen(effectiveScreenName)) {
      console.warn(
        `[LuciqScreenLoading] No initial display found for screen "${effectiveScreenName}". ` +
          'TTFD requires TTID to be measured first. ' +
          'Make sure to place InitialDisplay component before FullDisplay.',
      );
      return;
    }

    this.setState({ hasReported: true });

    // Calculate duration from dispatch time if available and enabled
    let duration = event.nativeEvent.duration;
    let startTime = event.nativeEvent.startTime;

    if (useDispatchTime && this.dispatchTimeRef) {
      startTime = this.dispatchTimeRef;
      duration = event.nativeEvent.endTime - startTime;
    }

    APM._reportScreenLoadingMetric({
      type: 'full_display',
      screenName: effectiveScreenName,
      duration,
      startTime,
      endTime: event.nativeEvent.endTime,
    });

    // Report custom attributes if provided
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        //todo: replace with screen loading
        APM.setFlowAttribute(effectiveScreenName, key, value);
      });
    }

    onMeasured?.(duration);
  };

  render(): React.ReactElement {
    const { children, record = true, screenName, navigationTiming } = this.props;
    const effectiveScreenName = screenName || navigationTiming.currentScreenName || '';

    if (!APM.isScreenLoadingEnabled()) {
      return <>{children}</>;
    }

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
          displayType="fullDisplay"
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
 *       <LuciqScreenLoading.InitialDisplay />
 *       <Text>Home Screen Content</Text>
 *     </View>
 *   );
 * }
 *
 * // With manual screen name
 * function ProfileScreen() {
 *   return (
 *     <View>
 *       <LuciqScreenLoading.InitialDisplay
 *         screenName="ProfileScreen"
 *         onMeasured={(duration) => console.log(`TTID: ${duration}ms`)}
 *       />
 *       <ProfileContent />
 *     </View>
 *   );
 * }
 *
 * // With custom attributes
 * function ProductScreen({ productId }) {
 *   return (
 *     <View>
 *       <LuciqScreenLoading.InitialDisplay
 *         screenName="ProductScreen"
 *         attributes={{ product_id: productId, source: 'search' }}
 *       />
 *       <ProductContent />
 *     </View>
 *   );
 * }
 * ```
 */
export function InitialDisplay(props: ScreenLoadingProps): React.ReactElement {
  const navigationTiming = useNavigationTiming();
  return <InitialDisplayClass {...props} navigationTiming={navigationTiming} />;
}

/**
 * Component for measuring Time To Full Display (TTFD)
 *
 * Place this where your screen is fully loaded, typically after
 * async data has been fetched and rendered. This component must be
 * rendered after InitialDisplay has been measured for the same screen.
 *
 * @example
 * ```tsx
 * function ProductListScreen() {
 *   const [products, setProducts] = useState(null);
 *   const [isLoading, setIsLoading] = useState(true);
 *
 *   useEffect(() => {
 *     fetchProducts().then((data) => {
 *       setProducts(data);
 *       setIsLoading(false);
 *     });
 *   }, []);
 *
 *   return (
 *     <View>
 *       <LuciqScreenLoading.InitialDisplay />
 *
 *       {isLoading ? (
 *         <ActivityIndicator />
 *       ) : (
 *         <>
 *           <LuciqScreenLoading.FullDisplay />
 *           <ProductList products={products} />
 *         </>
 *       )}
 *     </View>
 *   );
 * }
 *
 * // With custom attributes
 * function SearchResultsScreen({ query, results }) {
 *   return (
 *     <View>
 *       <LuciqScreenLoading.InitialDisplay screenName="SearchResults" />
 *       {results && (
 *         <>
 *           <LuciqScreenLoading.FullDisplay
 *             screenName="SearchResults"
 *             attributes={{
 *               query: query,
 *               result_count: String(results.length),
 *             }}
 *           />
 *           <ResultsList results={results} />
 *         </>
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export function FullDisplay(props: ScreenLoadingProps): React.ReactElement {
  const navigationTiming = useNavigationTiming();
  return <FullDisplayClass {...props} navigationTiming={navigationTiming} />;
}

// Export as namespace for clean API
const LuciqScreenLoading = {
  InitialDisplay,
  FullDisplay,
};

export default LuciqScreenLoading;
