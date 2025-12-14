import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
  JSX,
} from 'react';
import { APM } from '../index';

/**
 * Navigation timing context value interface
 */
export interface NavigationTimingContextValue {
  /** Timestamp when navigation action was dispatched */
  dispatchTime: number | null;
  /** Current screen name from navigation state */
  currentScreenName: string | null;
  /** Previous screen name */
  previousScreenName: string | null;
  /** Whether navigation is currently in progress */
  isNavigating: boolean;
  /** Register a callback for navigation start */
  onNavigationStart: (callback: (screenName: string) => void) => () => void;
  /** Manually set dispatch time (for custom integrations) */
  setDispatchTime: (time: number) => void;
}

/**
 * Default context value when provider is not available
 */
const defaultContextValue: NavigationTimingContextValue = {
  dispatchTime: null,
  currentScreenName: null,
  previousScreenName: null,
  isNavigating: false,
  onNavigationStart: () => () => {},
  setDispatchTime: () => {},
};

const NavigationTimingContext = createContext<NavigationTimingContextValue>(defaultContextValue);

/**
 * Type for navigation ref - using a generic type to avoid requiring @react-navigation/native
 * This allows the provider to work with any navigation ref that has the expected shape
 */
interface NavigationRef {
  current?: {
    addListener: (event: string, callback: (e: any) => void) => () => void;
    getRootState: () => any;
  } | null;
}

interface NavigationTimingProviderProps {
  children: ReactNode;
  navigationRef: NavigationRef;
}

/**
 * Helper function to extract the active route name from navigation state
 * Recursively traverses nested navigators to find the deepest active route
 */
function getActiveRouteName(state: any): string | null {
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
 * Helper function to extract target screen from navigation action
 */
function extractTargetScreen(action: any): string | null {
  if (!action) {
    return null;
  }

  if (action.type === 'NAVIGATE' || action.type === 'PUSH') {
    return action.payload?.name || null;
  }

  // Handle nested actions
  if (action.payload?.action) {
    return extractTargetScreen(action.payload.action);
  }

  return null;
}

/**
 * NavigationTimingProvider
 *
 * A context provider that captures navigation timing information at the dispatch level.
 * This enables accurate measurement of screen loading times by capturing the true
 * navigation start time (when the action is dispatched) rather than when the state changes.
 *
 * @example
 * ```tsx
 * import { NavigationTimingProvider } from '@luciq/react-native';
 * import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
 *
 * function App() {
 *   const navigationRef = useNavigationContainerRef();
 *
 *   return (
 *     <NavigationContainer ref={navigationRef}>
 *       <NavigationTimingProvider navigationRef={navigationRef}>
 *         <Stack.Navigator>
 *           <Stack.Screen name="Home" component={HomeScreen} />
 *         </Stack.Navigator>
 *       </NavigationTimingProvider>
 *     </NavigationContainer>
 *   );
 * }
 * ```
 */
export function NavigationTimingProvider({
  children,
  navigationRef,
}: NavigationTimingProviderProps): JSX.Element {
  const [dispatchTime, setDispatchTimeState] = useState<number>(0);
  const [endTime, setEndTimeState] = useState<number>(0);
  const [currentScreenName, setCurrentScreenName] = useState<string>('N/A');
  const [previousScreenName, setPreviousScreenName] = useState<string>('N/A');
  const [isNavigating, setIsNavigating] = useState(false);

  const navigationStartCallbacks = useRef<Set<(screenName: string) => void>>(new Set());

  // Keep track of current screen name in a ref to avoid stale closure issues
  const currentScreenNameRef = useRef<string>('N/A');

  useEffect(() => {
    const navRef = navigationRef.current;
    if (!navRef) {
      return;
    }

    // Get initial screen name
    const initialState = navRef.getRootState?.();
    const initialScreenName = getActiveRouteName(initialState);
    if (initialScreenName) {
      setCurrentScreenName(initialScreenName);
      currentScreenNameRef.current = initialScreenName;
    }

    let dispatchUnsubscribe: (() => void) | undefined;
    let stateUnsubscribe: (() => void) | undefined;

    try {
      // Listen to the __unsafe_action__ event for accurate dispatch timing
      // This event fires immediately when a navigation action is dispatched
      dispatchUnsubscribe = navRef.addListener('__unsafe_action__' as any, (e: any) => {
        const dispatchTimestamp = Date.now();
        setDispatchTimeState(dispatchTimestamp);
        setIsNavigating(true);

        // Extract target screen name from action if possible
        const targetScreen = extractTargetScreen(e?.data?.action);
        if (targetScreen) {
          navigationStartCallbacks.current.forEach((cb) => cb(targetScreen));
        }
      });
    } catch {
      // __unsafe_action__ might not be available in all versions
      // Silently ignore if the event is not supported
    }

    try {
      // Listen to state changes for completion
      stateUnsubscribe = navRef.addListener('state', () => {
        const endTimestamp = Date.now();
        setEndTimeState(endTimestamp);
        const state = navRef.getRootState?.();
        const newScreenName = getActiveRouteName(state);

        if (newScreenName && newScreenName !== currentScreenNameRef.current) {
          setPreviousScreenName(currentScreenNameRef.current);
          setCurrentScreenName(newScreenName);
          currentScreenNameRef.current = newScreenName;
        }

        // Mark navigation as complete after state settles
        // Using setTimeout to ensure React has finished processing the state update
        setTimeout(() => {
          APM._reportScreenLoadingMetric({
            type: 'initial_display',
            screenName: currentScreenName ?? 'N/A',
            duration: dispatchTime - endTime,
            startTime: dispatchTime,
            endTime: endTime,
          });
          setIsNavigating(false);
        }, 0);
      });
    } catch {
      // State event should always be available, but handle gracefully
    }

    return () => {
      dispatchUnsubscribe?.();
      stateUnsubscribe?.();
    };
  }, [currentScreenName, dispatchTime, endTime, navigationRef]);

  const onNavigationStart = useCallback((callback: (screenName: string) => void) => {
    navigationStartCallbacks.current.add(callback);
    return () => {
      navigationStartCallbacks.current.delete(callback);
    };
  }, []);

  const setDispatchTime = useCallback((time: number) => {
    setDispatchTimeState(time);
  }, []);

  const contextValue: NavigationTimingContextValue = {
    dispatchTime,
    currentScreenName,
    previousScreenName,
    isNavigating,
    onNavigationStart,
    setDispatchTime,
  };

  return (
    <NavigationTimingContext.Provider value={contextValue}>
      {children}
    </NavigationTimingContext.Provider>
  );
}

/**
 * Hook to access navigation timing context
 *
 * Returns the navigation timing context value. When used outside a
 * NavigationTimingProvider, returns default values that allow components
 * to gracefully degrade.
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { dispatchTime, currentScreenName } = useNavigationTiming();
 *
 *   // dispatchTime will be the timestamp when navigation was dispatched
 *   // currentScreenName will be the current screen from navigation state
 * }
 * ```
 */
export function useNavigationTiming(): NavigationTimingContextValue {
  return useContext(NavigationTimingContext);
}

export { NavigationTimingContext };
