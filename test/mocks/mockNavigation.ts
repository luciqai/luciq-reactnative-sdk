/**
 * Mock navigation utilities for testing navigation-related components
 */

type ListenerCallback = (e: any) => void;

interface MockNavigationRef {
  current: {
    addListener: jest.Mock<() => void, [string, ListenerCallback]>;
    getRootState: jest.Mock;
    _listeners: Map<string, Set<ListenerCallback>>;
    _emit: (event: string, data: any) => void;
  } | null;
}

/**
 * Creates a mock navigation ref that simulates React Navigation's NavigationContainerRef
 */
export const createMockNavigationRef = (): MockNavigationRef => {
  const listeners = new Map<string, Set<ListenerCallback>>();

  const mockRef: MockNavigationRef = {
    current: {
      _listeners: listeners,
      addListener: jest.fn((event: string, callback: ListenerCallback) => {
        if (!listeners.has(event)) {
          listeners.set(event, new Set());
        }
        listeners.get(event)!.add(callback);
        return () => {
          listeners.get(event)?.delete(callback);
        };
      }),
      getRootState: jest.fn(() => ({
        index: 0,
        routes: [{ name: 'Home', key: 'home-1' }],
      })),
      _emit: (event: string, data: any) => {
        listeners.get(event)?.forEach((cb) => cb(data));
      },
    },
  };

  return mockRef;
};

/**
 * Simulates a navigation action by emitting the __unsafe_action__ event
 * followed by a state change event
 */
export const simulateNavigation = (
  mockRef: MockNavigationRef,
  targetScreen: string,
  previousScreens: string[] = ['Home'],
) => {
  if (!mockRef.current) {
    return;
  }

  // Simulate dispatch event (__unsafe_action__)
  mockRef.current._emit('__unsafe_action__', {
    data: {
      action: {
        type: 'NAVIGATE',
        payload: { name: targetScreen },
      },
    },
  });

  // Update the mock state
  const routes = [...previousScreens, targetScreen].map((name, index) => ({
    name,
    key: `${name.toLowerCase()}-${index}`,
  }));

  mockRef.current.getRootState.mockReturnValue({
    index: routes.length - 1,
    routes,
  });

  // Simulate state change event
  mockRef.current._emit('state', {});
};

/**
 * Simulates a push navigation action
 */
export const simulatePush = (
  mockRef: MockNavigationRef,
  targetScreen: string,
  previousScreens: string[] = ['Home'],
) => {
  if (!mockRef.current) {
    return;
  }

  mockRef.current._emit('__unsafe_action__', {
    data: {
      action: {
        type: 'PUSH',
        payload: { name: targetScreen },
      },
    },
  });

  const routes = [...previousScreens, targetScreen].map((name, index) => ({
    name,
    key: `${name.toLowerCase()}-${index}`,
  }));

  mockRef.current.getRootState.mockReturnValue({
    index: routes.length - 1,
    routes,
  });

  mockRef.current._emit('state', {});
};

/**
 * Creates a nested navigation state for testing nested navigators
 */
export const createNestedState = (screens: string[]): any => {
  if (screens.length === 0) {
    return null;
  }

  if (screens.length === 1) {
    return {
      index: 0,
      routes: [{ name: screens[0], key: `${screens[0].toLowerCase()}-0` }],
    };
  }

  const [first, ...rest] = screens;
  return {
    index: 0,
    routes: [
      {
        name: first,
        key: `${first.toLowerCase()}-0`,
        state: createNestedState(rest),
      },
    ],
  };
};
