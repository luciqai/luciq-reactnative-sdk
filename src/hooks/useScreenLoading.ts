import { useRef, useEffect, useCallback } from 'react';

import * as APM from '../modules/APM';
import { useNavigationTiming } from '../components/NavigationTimingProvider';

//todo: need modification
/**
 * Options for useScreenLoading hook
 */
export interface UseScreenLoadingOptions {
  /** Screen name for the measurement. Auto-detected if NavigationTimingProvider is used */
  screenName?: string;
  /** Whether to automatically start measurement on mount (default: true) */
  autoStart?: boolean;
  /** Use navigation dispatch time as start time (default: true) */
  useDispatchTime?: boolean;
  /** Custom attributes to attach to measurements */
  attributes?: Record<string, string>;
}

/**
 * Return value of useScreenLoading hook
 */
export interface UseScreenLoadingReturn {
  /** Manually report initial display (TTID) */
  reportInitialDisplay: () => void;
  /** Manually report full display (TTFD) */
  reportFullDisplay: () => void;
  /** Report a custom loading stage */
  reportStage: (stageName: string) => void;
  /** Current screen name being tracked */
  screenName: string;
  /** Time elapsed since navigation started (or hook mounted) in milliseconds */
  getElapsedTime: () => number;
}

/**
 * Hook for programmatic screen loading measurement
 *
 * Provides more control over when measurements are reported compared to
 * the component-based API. Useful when you need to measure specific points
 * in your component lifecycle or async operations.
 *
 * @example
 * ```tsx
 * function DataDashboard() {
 *   const [data, setData] = useState(null);
 *   const { reportInitialDisplay, reportFullDisplay } = useScreenLoading();
 *
 *   useEffect(() => {
 *     // Report TTID when component mounts
 *     reportInitialDisplay();
 *
 *     fetchDashboardData().then((result) => {
 *       setData(result);
 *       // Report TTFD when data is loaded
 *       reportFullDisplay();
 *     });
 *   }, []);
 *
 *   return <DashboardContent data={data} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom screen name (when not using NavigationTimingProvider)
 * function ProductScreen() {
 *   const { reportInitialDisplay, reportFullDisplay } = useScreenLoading({
 *     screenName: 'ProductScreen',
 *     attributes: { source: 'deep_link' },
 *   });
 *
 *   // ...
 * }
 * ```
 */
export function useScreenLoading(options: UseScreenLoadingOptions = {}): UseScreenLoadingReturn {
  const {
    screenName: providedScreenName,
    autoStart = true,
    useDispatchTime = true,
    attributes,
  } = options;

  const navigationTiming = useNavigationTiming();
  const screenName = providedScreenName || navigationTiming.currentScreenName || 'UnknownScreen';

  // Determine start time: use dispatch time if available and enabled, otherwise use current time
  const getStartTime = useCallback(() => {
    if (useDispatchTime && navigationTiming.dispatchTime) {
      return navigationTiming.dispatchTime;
    }
    return Date.now();
  }, [useDispatchTime, navigationTiming.dispatchTime]);

  const startTimeRef = useRef<number>(getStartTime());

  const hasReportedTTID = useRef(false);
  const hasReportedTTFD = useRef(false);
  const stagesReported = useRef<Set<string>>(new Set());

  // Track screen name changes to reset state
  const lastScreenNameRef = useRef(screenName);

  // Reset on screen change or dispatch time change
  useEffect(() => {
    const dispatchTimeChanged =
      useDispatchTime &&
      navigationTiming.dispatchTime &&
      startTimeRef.current !== navigationTiming.dispatchTime;

    const screenNameChanged = lastScreenNameRef.current !== screenName;

    if (screenNameChanged || dispatchTimeChanged) {
      hasReportedTTID.current = false;
      hasReportedTTFD.current = false;
      stagesReported.current.clear();
      startTimeRef.current = getStartTime();
      lastScreenNameRef.current = screenName;
    }
  }, [screenName, navigationTiming.dispatchTime, useDispatchTime, getStartTime]);

  // Auto-start measurement if enabled
  useEffect(() => {
    if (autoStart && APM.isScreenLoadingEnabled()) {
      APM.startScreenLoading(screenName);
    }
  }, [screenName, autoStart]);

  const reportInitialDisplay = useCallback(() => {
    if (hasReportedTTID.current || !APM.isScreenLoadingEnabled()) {
      return;
    }

    hasReportedTTID.current = true;
    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;

    APM._reportScreenLoadingMetric({
      type: 'initial_display',
      screenName,
      duration,
      startTime: startTimeRef.current,
      endTime,
    });

    // Apply custom attributes if provided
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        APM.setFlowAttribute(screenName, key, value);
      });
    }
  }, [screenName, attributes]);

  const reportFullDisplay = useCallback(() => {
    if (hasReportedTTFD.current || !APM.isScreenLoadingEnabled()) {
      return;
    }

    if (!hasReportedTTID.current) {
      console.warn(
        `[useScreenLoading] Attempting to report TTFD before TTID for "${screenName}". ` +
          'Call reportInitialDisplay() first.',
      );
      return;
    }

    hasReportedTTFD.current = true;
    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;

    APM._reportScreenLoadingMetric({
      type: 'full_display',
      screenName,
      duration,
      startTime: startTimeRef.current,
      endTime,
    });

    // Apply custom attributes if provided
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        APM.setFlowAttribute(screenName, key, value);
      });
    }
  }, [screenName, attributes]);

  const reportStage = useCallback(
    (stageName: string) => {
      if (stagesReported.current.has(stageName) || !APM.isScreenLoadingEnabled()) {
        return;
      }

      stagesReported.current.add(stageName);
      const endTime = Date.now();
      const duration = endTime - startTimeRef.current;

      // Report as custom flow attribute
      APM.setFlowAttribute(screenName, `stage_${stageName}`, `${duration}ms`);
    },
    [screenName],
  );

  const getElapsedTime = useCallback(() => {
    return Date.now() - startTimeRef.current;
  }, []);

  return {
    reportInitialDisplay,
    reportFullDisplay,
    reportStage,
    screenName,
    getElapsedTime,
  };
}

/**
 * Options for useScreenLoadingState hook
 */
export interface UseScreenLoadingStateOptions {
  /** Screen name for the measurement. Auto-detected if NavigationTimingProvider is used */
  screenName?: string;
  /** Whether the screen is fully loaded and ready */
  isReady: boolean;
  /** Callback when TTID is reported */
  onTTID?: (duration: number) => void;
  /** Callback when TTFD is reported */
  onTTFD?: (duration: number) => void;
}

/**
 * Simple hook that reports initial display when component mounts
 * and full display when the ready condition becomes true.
 *
 * This is a convenience hook for the common pattern of measuring
 * screen loading based on a loading state.
 *
 * @example
 * ```tsx
 * function ProductScreen() {
 *   const [products, setProducts] = useState(null);
 *
 *   useScreenLoadingState({
 *     screenName: 'ProductScreen',
 *     isReady: products !== null,
 *   });
 *
 *   useEffect(() => {
 *     fetchProducts().then(setProducts);
 *   }, []);
 *
 *   return <ProductList products={products} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With callbacks
 * function DashboardScreen() {
 *   const [data, setData] = useState(null);
 *
 *   useScreenLoadingState({
 *     isReady: data !== null,
 *     onTTID: (duration) => console.log(`Initial display: ${duration}ms`),
 *     onTTFD: (duration) => console.log(`Full display: ${duration}ms`),
 *   });
 *
 *   // ...
 * }
 * ```
 */
export function useScreenLoadingState(options: UseScreenLoadingStateOptions): void {
  const { screenName, isReady, onTTID, onTTFD } = options;
  const { reportInitialDisplay, reportFullDisplay, getElapsedTime } = useScreenLoading({
    screenName,
    autoStart: true,
  });

  const hasReportedTTID = useRef(false);
  const hasReportedTTFD = useRef(false);

  // Store callbacks in refs to avoid re-triggering effects
  const onTTIDRef = useRef(onTTID);
  const onTTFDRef = useRef(onTTFD);

  useEffect(() => {
    onTTIDRef.current = onTTID;
    onTTFDRef.current = onTTFD;
  }, [onTTID, onTTFD]);

  // Report TTID on mount
  useEffect(() => {
    if (!hasReportedTTID.current) {
      hasReportedTTID.current = true;
      reportInitialDisplay();
      onTTIDRef.current?.(getElapsedTime());
    }
  }, [reportInitialDisplay, getElapsedTime]);

  // Report TTFD when ready
  useEffect(() => {
    if (isReady && !hasReportedTTFD.current && hasReportedTTID.current) {
      hasReportedTTFD.current = true;
      reportFullDisplay();
      onTTFDRef.current?.(getElapsedTime());
    }
  }, [isReady, reportFullDisplay, getElapsedTime]);
}
