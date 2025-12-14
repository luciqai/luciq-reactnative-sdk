import React, { JSX, useRef, useEffect, useCallback } from 'react';
import { requireNativeComponent, ViewStyle } from 'react-native';
import type {
  NativeScreenLoadingViewProps,
  ScreenLoadingEvent,
} from '../native/NativeScreenLoadingView';
import * as APM from '../modules/APM';
import { useNavigationTiming } from './NavigationTimingProvider';

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
export function InitialDisplay({
  record = true,
  screenName,
  children,
  onMeasured,
  useDispatchTime = true,
  attributes,
}: ScreenLoadingProps): JSX.Element {
  const hasReported = useRef(false);
  const navigationTiming = useNavigationTiming();

  // Determine the effective screen name - use prop if provided, otherwise use navigation context
  const effectiveScreenName = screenName || navigationTiming.currentScreenName || '';

  // Store dispatch time at render for accurate measurement
  const dispatchTimeRef = useRef<number | null>(
    useDispatchTime ? navigationTiming.dispatchTime : null,
  );

  // Track the screen name to detect changes
  const lastScreenNameRef = useRef(effectiveScreenName);
  const lastDispatchTimeRef = useRef(navigationTiming.dispatchTime);

  // Reset hasReported when screen name changes (for screen revisits)
  // or when dispatch time changes (for new navigations)
  useEffect(() => {
    const screenNameChanged = lastScreenNameRef.current !== effectiveScreenName;
    const dispatchTimeChanged =
      useDispatchTime &&
      navigationTiming.dispatchTime !== null &&
      lastDispatchTimeRef.current !== navigationTiming.dispatchTime;

    if (screenNameChanged || dispatchTimeChanged) {
      hasReported.current = false;
      dispatchTimeRef.current = useDispatchTime ? navigationTiming.dispatchTime : null;
      lastScreenNameRef.current = effectiveScreenName;
      lastDispatchTimeRef.current = navigationTiming.dispatchTime;
    }
  }, [effectiveScreenName, navigationTiming.dispatchTime, useDispatchTime]);

  const handleDisplay = useCallback(
    (event: { nativeEvent: ScreenLoadingEvent }) => {
      if (hasReported.current) {
        return;
      }

      hasReported.current = true;

      // Calculate duration from dispatch time if available and enabled
      let duration = event.nativeEvent.duration;
      let startTime = event.nativeEvent.startTime;

      if (useDispatchTime && dispatchTimeRef.current) {
        startTime = dispatchTimeRef.current;
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
    },
    [effectiveScreenName, useDispatchTime, attributes, onMeasured],
  );

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
        onDisplay={handleDisplay}
      />
      {children}
    </>
  );
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
export function FullDisplay({
  record = true,
  screenName,
  children,
  onMeasured,
  useDispatchTime = true,
  attributes,
}: ScreenLoadingProps): JSX.Element {
  const hasReported = useRef(false);
  const navigationTiming = useNavigationTiming();

  // Determine the effective screen name
  const effectiveScreenName = screenName || navigationTiming.currentScreenName || '';

  // Store dispatch time at render
  const dispatchTimeRef = useRef<number | null>(
    useDispatchTime ? navigationTiming.dispatchTime : null,
  );

  // Track changes for reset
  const lastScreenNameRef = useRef(effectiveScreenName);
  const lastDispatchTimeRef = useRef(navigationTiming.dispatchTime);

  // Reset hasReported when screen name or dispatch time changes
  useEffect(() => {
    const screenNameChanged = lastScreenNameRef.current !== effectiveScreenName;
    const dispatchTimeChanged =
      useDispatchTime &&
      navigationTiming.dispatchTime !== null &&
      lastDispatchTimeRef.current !== navigationTiming.dispatchTime;

    if (screenNameChanged || dispatchTimeChanged) {
      hasReported.current = false;
      dispatchTimeRef.current = useDispatchTime ? navigationTiming.dispatchTime : null;
      lastScreenNameRef.current = effectiveScreenName;
      lastDispatchTimeRef.current = navigationTiming.dispatchTime;
    }
  }, [effectiveScreenName, navigationTiming.dispatchTime, useDispatchTime]);

  const handleDisplay = useCallback(
    (event: { nativeEvent: ScreenLoadingEvent }) => {
      if (hasReported.current) {
        return;
      }

      // Check if TTID exists for this screen
      if (!APM._hasInitialDisplayForScreen(effectiveScreenName)) {
        console.warn(
          `[LuciqScreenLoading] No initial display found for screen "${effectiveScreenName}". ` +
            'TTFD requires TTID to be measured first. ' +
            'Make sure to place InitialDisplay component before FullDisplay.',
        );
        return;
      }

      hasReported.current = true;

      // Calculate duration from dispatch time if available and enabled
      let duration = event.nativeEvent.duration;
      let startTime = event.nativeEvent.startTime;

      if (useDispatchTime && dispatchTimeRef.current) {
        startTime = dispatchTimeRef.current;
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
    },
    [effectiveScreenName, useDispatchTime, attributes, onMeasured],
  );

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
        onDisplay={handleDisplay}
      />
      {children}
    </>
  );
}

// Export as namespace for clean API
const LuciqScreenLoading = {
  InitialDisplay,
  FullDisplay,
};

export default LuciqScreenLoading;
