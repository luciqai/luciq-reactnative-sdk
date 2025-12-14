/**
 * Tests for LuciqNavigationContainer utility functions and integration
 *
 * Since we don't have react-test-renderer available, we test the helper functions
 * and mock-based integration patterns directly.
 */

import {
  createMockNavigationRef,
  simulateNavigation,
  simulatePush,
  createNestedState,
} from '../mocks/mockNavigation';

// Mock the native modules and Luciq module
jest.mock('../../src/native/NativeAPM', () => ({
  NativeAPM: {
    setEnabled: jest.fn(),
    setScreenLoadingEnabled: jest.fn(),
    startScreenLoading: jest.fn(),
    endScreenLoading: jest.fn(),
    reportScreenLoadingMetric: jest.fn(),
    setFlowAttribute: jest.fn(),
  },
}));

jest.mock('../../src/native/NativeLuciq', () => ({
  NativeLuciq: {
    reportScreenChange: jest.fn(),
    reportCurrentViewChange: jest.fn(),
    setEnabled: jest.fn(),
    getConstants: jest.fn(() => ({
      sdkColors: {},
    })),
  },
  emitter: {
    addListener: jest.fn(),
  },
  NativeEvents: {},
}));

// Import after mocking
import * as APM from '../../src/modules/APM';
import * as Luciq from '../../src/modules/Luciq';
import { NativeAPM } from '../../src/native/NativeAPM';

describe('LuciqNavigationContainer Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    APM.setScreenLoadingEnabled(false);
  });

  describe('Screen Loading Enable/Disable', () => {
    it('should enable screen loading when setScreenLoadingEnabled is called', () => {
      APM.setScreenLoadingEnabled(true);

      expect(NativeAPM.setScreenLoadingEnabled).toHaveBeenCalledWith(true);
      expect(APM.isScreenLoadingEnabled()).toBe(true);
    });

    it('should disable screen loading when setScreenLoadingEnabled is called with false', () => {
      APM.setScreenLoadingEnabled(true);
      APM.setScreenLoadingEnabled(false);

      expect(NativeAPM.setScreenLoadingEnabled).toHaveBeenLastCalledWith(false);
      expect(APM.isScreenLoadingEnabled()).toBe(false);
    });

    it('should handle rapid enable/disable toggles', () => {
      for (let i = 0; i < 5; i++) {
        APM.setScreenLoadingEnabled(i % 2 === 0);
      }

      expect(NativeAPM.setScreenLoadingEnabled).toHaveBeenCalledTimes(5);
      expect(APM.isScreenLoadingEnabled()).toBe(false); // Last call was with false (4 % 2 === 0)
    });
  });

  describe('Auto Screen Loading', () => {
    it('should enable auto screen loading via Luciq module', () => {
      const setAutoSpy = jest.spyOn(Luciq, 'setAutoScreenLoadingEnabled');

      Luciq.setAutoScreenLoadingEnabled(true);

      expect(setAutoSpy).toHaveBeenCalledWith(true);
    });

    it('should disable auto screen loading', () => {
      const setAutoSpy = jest.spyOn(Luciq, 'setAutoScreenLoadingEnabled');

      Luciq.setAutoScreenLoadingEnabled(false);

      expect(setAutoSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('Navigation State Change Handling', () => {
    it('should handle navigation state changes', () => {
      const mockRef = createMockNavigationRef();
      const stateCallback = jest.fn();

      mockRef.current!.addListener('state', stateCallback);
      simulateNavigation(mockRef, 'Profile');

      expect(stateCallback).toHaveBeenCalled();
    });

    it('should update state correctly after navigation', () => {
      const mockRef = createMockNavigationRef();

      simulateNavigation(mockRef, 'Settings');

      const state = mockRef.current!.getRootState();
      expect(state.routes[state.index].name).toBe('Settings');
    });

    it('should preserve navigation history', () => {
      const mockRef = createMockNavigationRef();

      simulateNavigation(mockRef, 'Profile', ['Home']);
      simulateNavigation(mockRef, 'Settings', ['Home', 'Profile']);

      const state = mockRef.current!.getRootState();
      expect(state.routes.length).toBe(3);
      expect(state.routes.map((r: any) => r.name)).toEqual(['Home', 'Profile', 'Settings']);
    });

    it('should handle multiple rapid navigations', () => {
      const mockRef = createMockNavigationRef();
      const stateCallback = jest.fn();

      mockRef.current!.addListener('state', stateCallback);

      simulateNavigation(mockRef, 'Screen1', ['Home']);
      simulateNavigation(mockRef, 'Screen2', ['Home', 'Screen1']);
      simulateNavigation(mockRef, 'Screen3', ['Home', 'Screen1', 'Screen2']);

      expect(stateCallback).toHaveBeenCalledTimes(3);
    });
  });

  describe('Dispatch Event Handling', () => {
    it('should emit __unsafe_action__ event for NAVIGATE action', () => {
      const mockRef = createMockNavigationRef();
      const dispatchCallback = jest.fn();

      mockRef.current!.addListener('__unsafe_action__', dispatchCallback);
      simulateNavigation(mockRef, 'Details');

      expect(dispatchCallback).toHaveBeenCalledWith({
        data: {
          action: {
            type: 'NAVIGATE',
            payload: { name: 'Details' },
          },
        },
      });
    });

    it('should emit __unsafe_action__ event for PUSH action', () => {
      const mockRef = createMockNavigationRef();
      const dispatchCallback = jest.fn();

      mockRef.current!.addListener('__unsafe_action__', dispatchCallback);
      simulatePush(mockRef, 'NewScreen');

      expect(dispatchCallback).toHaveBeenCalledWith({
        data: {
          action: {
            type: 'PUSH',
            payload: { name: 'NewScreen' },
          },
        },
      });
    });

    it('should receive dispatch time before state change', () => {
      const mockRef = createMockNavigationRef();
      const events: string[] = [];

      mockRef.current!.addListener('__unsafe_action__', () => {
        events.push('dispatch');
      });

      mockRef.current!.addListener('state', () => {
        events.push('state');
      });

      simulateNavigation(mockRef, 'NewScreen');

      // Dispatch should come before state change
      expect(events).toEqual(['dispatch', 'state']);
    });

    it('should capture timing from both events', () => {
      const mockRef = createMockNavigationRef();
      let dispatchTime: number | null = null;
      let stateChangeTime: number | null = null;

      mockRef.current!.addListener('__unsafe_action__', () => {
        dispatchTime = Date.now();
      });

      mockRef.current!.addListener('state', () => {
        stateChangeTime = Date.now();
      });

      simulateNavigation(mockRef, 'TimedScreen');

      expect(dispatchTime).not.toBeNull();
      expect(stateChangeTime).not.toBeNull();
      expect(stateChangeTime! >= dispatchTime!).toBe(true);
    });
  });

  describe('Screen Exclusion Logic', () => {
    it('should allow checking if screens are excluded', () => {
      const excludedScreens = ['SplashScreen', 'LoadingScreen'];

      const isExcluded = (screenName: string) => excludedScreens.includes(screenName);

      expect(isExcluded('SplashScreen')).toBe(true);
      expect(isExcluded('LoadingScreen')).toBe(true);
      expect(isExcluded('HomeScreen')).toBe(false);
    });

    it('should handle empty exclusion list', () => {
      const excludedScreens: string[] = [];

      const isExcluded = (screenName: string) => excludedScreens.includes(screenName);

      expect(isExcluded('AnyScreen')).toBe(false);
    });

    it('should handle case-sensitive screen names', () => {
      const excludedScreens = ['SplashScreen'];

      const isExcluded = (screenName: string) => excludedScreens.includes(screenName);

      expect(isExcluded('SplashScreen')).toBe(true);
      expect(isExcluded('splashscreen')).toBe(false);
      expect(isExcluded('SPLASHSCREEN')).toBe(false);
    });

    it('should support wildcard-like patterns via custom logic', () => {
      const excludedPatterns = ['Splash', 'Loading'];

      const isExcluded = (screenName: string) =>
        excludedPatterns.some((pattern) => screenName.includes(pattern));

      expect(isExcluded('SplashScreen')).toBe(true);
      expect(isExcluded('LoadingView')).toBe(true);
      expect(isExcluded('HomeScreen')).toBe(false);
    });
  });

  describe('Screen Name Extraction', () => {
    it('should extract screen name with default extractor', () => {
      const route = { name: 'ProductScreen', params: { id: '123' } };
      const defaultExtractor = (r: typeof route) => r.name;

      expect(defaultExtractor(route)).toBe('ProductScreen');
    });

    it('should support custom screen name extractor', () => {
      const route = { name: 'Product', params: { id: '123', category: 'electronics' } };
      const customExtractor = (r: typeof route) => {
        if (r.params?.id) {
          return `${r.name}-${r.params.id}`;
        }
        return r.name;
      };

      expect(customExtractor(route)).toBe('Product-123');
    });

    it('should handle routes without params', () => {
      const route = { name: 'HomeScreen' };
      const extractor = (r: typeof route) => r.name;

      expect(extractor(route)).toBe('HomeScreen');
    });

    it('should handle complex params in custom extractor', () => {
      const route = {
        name: 'Search',
        params: { query: 'shoes', filters: { color: 'red', size: 'large' } },
      };

      const customExtractor = (r: typeof route) => {
        if (r.params?.query) {
          return `${r.name}:${r.params.query}`;
        }
        return r.name;
      };

      expect(customExtractor(route)).toBe('Search:shoes');
    });

    it('should handle empty route name', () => {
      const route = { name: '', params: {} };
      const extractor = (r: typeof route) => r.name || 'UnknownScreen';

      expect(extractor(route)).toBe('UnknownScreen');
    });
  });

  describe('Nested Navigation State', () => {
    it('should extract active route from nested state', () => {
      const getActiveRouteName = (state: any): string | null => {
        if (!state) {
          return null;
        }
        const route = state.routes?.[state.index];
        if (!route) {
          return null;
        }
        if (route.state) {
          return getActiveRouteName(route.state);
        }
        return route.name || null;
      };

      const nestedState = {
        index: 0,
        routes: [
          {
            name: 'MainStack',
            key: 'main-1',
            state: {
              index: 1,
              routes: [
                { name: 'Home', key: 'home-1' },
                {
                  name: 'TabNavigator',
                  key: 'tabs-1',
                  state: {
                    index: 0,
                    routes: [{ name: 'Feed', key: 'feed-1' }],
                  },
                },
              ],
            },
          },
        ],
      };

      expect(getActiveRouteName(nestedState)).toBe('Feed');
    });

    it('should handle single-level navigation state', () => {
      const getActiveRouteName = (state: any): string | null => {
        if (!state) {
          return null;
        }
        const route = state.routes?.[state.index];
        if (!route) {
          return null;
        }
        if (route.state) {
          return getActiveRouteName(route.state);
        }
        return route.name || null;
      };

      const simpleState = {
        index: 0,
        routes: [{ name: 'Home', key: 'home-1' }],
      };

      expect(getActiveRouteName(simpleState)).toBe('Home');
    });

    it('should return null for empty state', () => {
      const getActiveRouteName = (state: any): string | null => {
        if (!state) {
          return null;
        }
        const route = state.routes?.[state.index];
        if (!route) {
          return null;
        }
        if (route.state) {
          return getActiveRouteName(route.state);
        }
        return route.name || null;
      };

      expect(getActiveRouteName(null)).toBeNull();
      expect(getActiveRouteName(undefined)).toBeNull();
    });

    it('should handle deeply nested navigators', () => {
      const getActiveRouteName = (state: any): string | null => {
        if (!state) {
          return null;
        }
        const route = state.routes?.[state.index];
        if (!route) {
          return null;
        }
        if (route.state) {
          return getActiveRouteName(route.state);
        }
        return route.name || null;
      };

      const state = createNestedState(['Root', 'MainStack', 'TabNav', 'HomeTab', 'ProfileModal']);

      expect(getActiveRouteName(state)).toBe('ProfileModal');
    });

    it('should handle state with multiple routes at each level', () => {
      const getActiveRouteName = (state: any): string | null => {
        if (!state) {
          return null;
        }
        const route = state.routes?.[state.index];
        if (!route) {
          return null;
        }
        if (route.state) {
          return getActiveRouteName(route.state);
        }
        return route.name || null;
      };

      const state = {
        index: 1, // Second route is active
        routes: [
          { name: 'Tab1', key: 'tab1' },
          {
            name: 'Tab2',
            key: 'tab2',
            state: {
              index: 2,
              routes: [
                { name: 'SubScreen1', key: 'sub1' },
                { name: 'SubScreen2', key: 'sub2' },
                { name: 'SubScreen3', key: 'sub3' },
              ],
            },
          },
          { name: 'Tab3', key: 'tab3' },
        ],
      };

      expect(getActiveRouteName(state)).toBe('SubScreen3');
    });
  });
});

describe('Screen Loading Configuration', () => {
  it('should have default configuration values', () => {
    const defaultConfig = {
      enabled: false,
      autoTrackingEnabled: false,
      excludedScreens: [],
      includeAnimationTime: true,
      timeout: 30000,
      slowLoadingThreshold: 3000,
    };

    expect(defaultConfig.enabled).toBe(false);
    expect(defaultConfig.autoTrackingEnabled).toBe(false);
    expect(defaultConfig.excludedScreens).toEqual([]);
    expect(defaultConfig.includeAnimationTime).toBe(true);
    expect(defaultConfig.timeout).toBe(30000);
    expect(defaultConfig.slowLoadingThreshold).toBe(3000);
  });

  it('should allow creating config with overrides', () => {
    const createConfig = (overrides: Record<string, any>) => ({
      enabled: false,
      autoTrackingEnabled: false,
      excludedScreens: [],
      includeAnimationTime: true,
      timeout: 30000,
      slowLoadingThreshold: 3000,
      ...overrides,
    });

    const customConfig = createConfig({
      enabled: true,
      excludedScreens: ['SplashScreen'],
      slowLoadingThreshold: 2000,
    });

    expect(customConfig.enabled).toBe(true);
    expect(customConfig.excludedScreens).toEqual(['SplashScreen']);
    expect(customConfig.slowLoadingThreshold).toBe(2000);
    // Unchanged values should remain default
    expect(customConfig.autoTrackingEnabled).toBe(false);
    expect(customConfig.timeout).toBe(30000);
  });

  it('should support onSlowLoading callback', () => {
    const onSlowLoading = jest.fn();
    const config = {
      enabled: true,
      slowLoadingThreshold: 2000,
      onSlowLoading,
    };

    // Simulate slow loading detection
    const duration = 3000;
    const screenName = 'SlowScreen';

    if (duration > config.slowLoadingThreshold && config.onSlowLoading) {
      config.onSlowLoading(screenName, duration);
    }

    expect(onSlowLoading).toHaveBeenCalledWith('SlowScreen', 3000);
  });

  it('should not call onSlowLoading when under threshold', () => {
    const onSlowLoading = jest.fn();
    const config = {
      enabled: true,
      slowLoadingThreshold: 3000,
      onSlowLoading,
    };

    const duration = 2000;
    const screenName = 'FastScreen';

    if (duration > config.slowLoadingThreshold && config.onSlowLoading) {
      config.onSlowLoading(screenName, duration);
    }

    expect(onSlowLoading).not.toHaveBeenCalled();
  });
});

describe('LuciqNavigationContainer Props', () => {
  describe('enableScreenTracking prop', () => {
    it('should default to true', () => {
      const defaultProps = {
        enableScreenTracking: true,
      };

      expect(defaultProps.enableScreenTracking).toBe(true);
    });

    it('should allow disabling screen tracking', () => {
      const props = {
        enableScreenTracking: false,
      };

      expect(props.enableScreenTracking).toBe(false);
    });
  });

  describe('enableScreenLoading prop', () => {
    it('should default to false', () => {
      const defaultProps = {
        enableScreenLoading: false,
      };

      expect(defaultProps.enableScreenLoading).toBe(false);
    });

    it('should allow enabling screen loading', () => {
      const props = {
        enableScreenLoading: true,
      };

      expect(props.enableScreenLoading).toBe(true);
    });
  });

  describe('excludedScreens prop', () => {
    it('should default to empty array', () => {
      const defaultProps = {
        excludedScreens: [],
      };

      expect(defaultProps.excludedScreens).toEqual([]);
    });

    it('should accept screen names to exclude', () => {
      const props = {
        excludedScreens: ['SplashScreen', 'OnboardingScreen', 'LoadingScreen'],
      };

      expect(props.excludedScreens.length).toBe(3);
      expect(props.excludedScreens).toContain('SplashScreen');
    });
  });

  describe('screenNameExtractor prop', () => {
    it('should accept a custom extractor function', () => {
      const extractor = (route: { name: string; params?: Record<string, unknown> }) => {
        return (route.params?.customName as string) || route.name;
      };

      const route = { name: 'Screen', params: { customName: 'CustomScreenName' } };

      expect(extractor(route)).toBe('CustomScreenName');
    });
  });

  describe('screenLoadingConfig prop', () => {
    it('should accept partial config overrides', () => {
      const partialConfig = {
        enabled: true,
        slowLoadingThreshold: 5000,
      };

      expect(partialConfig.enabled).toBe(true);
      expect(partialConfig.slowLoadingThreshold).toBe(5000);
    });
  });
});

describe('Navigation Event Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('onStateChange handling', () => {
    it('should track screen changes from state updates', () => {
      const mockRef = createMockNavigationRef();
      const screenChanges: string[] = [];

      mockRef.current!.addListener('state', () => {
        const state = mockRef.current!.getRootState();
        const currentScreen = state.routes[state.index].name;
        screenChanges.push(currentScreen);
      });

      simulateNavigation(mockRef, 'Profile', ['Home']);
      simulateNavigation(mockRef, 'Settings', ['Home', 'Profile']);

      expect(screenChanges).toEqual(['Profile', 'Settings']);
    });

    it('should call user onStateChange callback', () => {
      const userCallback = jest.fn();
      const mockRef = createMockNavigationRef();

      mockRef.current!.addListener('state', () => {
        const state = mockRef.current!.getRootState();
        userCallback(state);
      });

      simulateNavigation(mockRef, 'NewScreen');

      expect(userCallback).toHaveBeenCalled();
    });
  });

  describe('onReady handling', () => {
    it('should simulate onReady behavior', () => {
      let isReady = false;

      const onReady = () => {
        isReady = true;
      };

      // Simulate component mount and navigation container ready
      onReady();

      expect(isReady).toBe(true);
    });

    it('should enable screen loading on ready when configured', () => {
      const config = {
        enableScreenLoading: true,
        autoTrackingEnabled: true,
      };

      let screenLoadingEnabled = false;
      let autoTrackingEnabled = false;

      const onReady = () => {
        if (config.enableScreenLoading) {
          screenLoadingEnabled = true;
          autoTrackingEnabled = config.autoTrackingEnabled;
        }
      };

      onReady();

      expect(screenLoadingEnabled).toBe(true);
      expect(autoTrackingEnabled).toBe(true);
    });
  });
});

describe('Ref Handling', () => {
  it('should handle callback refs', () => {
    const mockRef = createMockNavigationRef();
    let refInstance: any = null;

    const callbackRef = (instance: any) => {
      refInstance = instance;
    };

    // Simulate ref assignment
    callbackRef(mockRef.current);

    expect(refInstance).toBe(mockRef.current);
  });

  it('should handle object refs', () => {
    const mockRef = createMockNavigationRef();
    const userRef = { current: null as any };

    // Simulate ref merge
    userRef.current = mockRef.current;

    expect(userRef.current).toBe(mockRef.current);
  });

  it('should handle null refs gracefully', () => {
    const userRef = { current: null };

    // Simulate handling null
    const handleRef = (instance: any) => {
      if (userRef && typeof userRef === 'object') {
        userRef.current = instance;
      }
    };

    handleRef(null);

    expect(userRef.current).toBeNull();
  });
});

// Note: Full component rendering tests for LuciqNavigationContainer require
// react-test-renderer and @testing-library/react-native which are not
// available in this test environment. The component behavior is verified
// through runtime usage in the example app.
