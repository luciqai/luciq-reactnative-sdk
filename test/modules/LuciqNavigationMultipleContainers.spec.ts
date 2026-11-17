import '../mocks/mockLuciqUtils';
import '../mocks/mockNetworkLogger';

import { Platform } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

import type * as LuciqModule from '../../src/modules/Luciq';
import type * as NativeLuciqModule from '../../src/native/NativeLuciq';
import type * as ScreenLoadingManagerModule from '../../src/modules/apm/ScreenLoadingManager';

jest.mock('../../src/modules/NetworkLogger');

type Modules = {
  Luciq: typeof LuciqModule;
  NativeLuciq: typeof NativeLuciqModule.NativeLuciq;
  ScreenLoadingManager: typeof ScreenLoadingManagerModule.ScreenLoadingManager;
};

/** The navigation state lives in module state, so every case loads a fresh module. */
function loadFresh(): Modules {
  let modules!: Modules;
  jest.isolateModules(() => {
    modules = {
      Luciq: require('../../src/modules/Luciq'),
      NativeLuciq: require('../../src/native/NativeLuciq').NativeLuciq,
      ScreenLoadingManager: require('../../src/modules/apm/ScreenLoadingManager')
        .ScreenLoadingManager,
    };
  });
  return modules;
}

/**
 * A ready NavigationContainer: [navigateTo] changes its current route and returns the new root
 * state, which is what the container passes to `onStateChange`.
 */
function fakeContainer(key: string, initialRoute: string) {
  let route = initialRoute;
  let rootState = { key, index: 0, routes: [{ name: route }] };
  const actionListeners: ((event?: any) => void)[] = [];
  const unsubscribe = jest.fn();
  const current = {
    addListener: jest.fn((_event: string, listener: (event?: any) => void) => {
      actionListeners.push(listener);
      return unsubscribe;
    }),
    getCurrentRoute: jest.fn(() => ({ name: route })),
    getRootState: jest.fn(() => rootState),
  };
  const ref = {
    current,
  } as unknown as NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  return {
    ref,
    current,
    unsubscribe,
    /** Dispatches a navigation action, as React Navigation does before the state changes. */
    dispatchAction: () => actionListeners.forEach((listener) => listener({ data: {} })),
    navigateTo(next: string) {
      route = next;
      rootState = { key, index: 0, routes: [{ name: next }] };
      return rootState;
    },
    get state() {
      return rootState;
    },
  };
}

beforeEach(() => {
  Platform.OS = 'ios';
});

describe('setNavigationListener with several NavigationContainers', () => {
  it('reports each container under its own routes', () => {
    const { Luciq, NativeLuciq } = loadFresh();
    const movies = fakeContainer('movies-root', 'Movies');
    const actors = fakeContainer('actors-root', 'Actors');

    Luciq.setNavigationListener(movies.ref);
    // @ts-ignore
    Luciq.onStateChange(movies.state);
    Luciq.setNavigationListener(actors.ref);
    // @ts-ignore
    Luciq.onStateChange(actors.state);

    expect(NativeLuciq.reportScreenChange).toHaveBeenNthCalledWith(1, 'Movies', null);
    expect(NativeLuciq.reportScreenChange).toHaveBeenNthCalledWith(2, 'Actors', null);
  });

  it('names a navigation in one container after its own route once another container registered', () => {
    const { Luciq, NativeLuciq } = loadFresh();
    const movies = fakeContainer('movies-root', 'Movies');
    const actors = fakeContainer('actors-root', 'Actors');
    Luciq.setNavigationListener(movies.ref);
    // @ts-ignore
    Luciq.onStateChange(movies.state);
    Luciq.setNavigationListener(actors.ref);
    // @ts-ignore
    Luciq.onStateChange(actors.state);
    (NativeLuciq.reportScreenChange as jest.Mock).mockClear();

    // @ts-ignore
    Luciq.onStateChange(movies.navigateTo('MovieDetails'));

    expect(NativeLuciq.reportScreenChange).toBeCalledTimes(1);
    expect(NativeLuciq.reportScreenChange).toBeCalledWith('MovieDetails', null);
  });

  it('keeps each container route separate, so returning to a route is still reported', () => {
    const { Luciq, NativeLuciq } = loadFresh();
    const movies = fakeContainer('movies-root', 'Movies');
    const actors = fakeContainer('actors-root', 'Actors');
    Luciq.setNavigationListener(movies.ref);
    Luciq.setNavigationListener(actors.ref);

    // @ts-ignore
    Luciq.onStateChange(movies.navigateTo('Details'));
    // @ts-ignore
    Luciq.onStateChange(actors.navigateTo('Details'));

    // Both containers moved to a route named Details: each is its own screen change.
    expect(NativeLuciq.reportScreenChange).toBeCalledTimes(2);
  });

  it('matches the container by its root state key when the state is a copy', () => {
    const { Luciq, NativeLuciq } = loadFresh();
    const movies = fakeContainer('movies-root', 'Movies');
    const actors = fakeContainer('actors-root', 'Actors');
    Luciq.setNavigationListener(movies.ref);
    Luciq.setNavigationListener(actors.ref);

    const copy = { ...movies.navigateTo('MovieDetails') };
    // @ts-ignore
    Luciq.onStateChange(copy);

    expect(NativeLuciq.reportScreenChange).toBeCalledWith('MovieDetails', null);
    expect(NativeLuciq.reportScreenChange).not.toBeCalledWith('Actors', null);
  });

  it('does not name a navigation span after another container route', () => {
    const { Luciq, NativeLuciq, ScreenLoadingManager } = loadFresh();
    jest.spyOn(ScreenLoadingManager, 'isFeatureEnabled').mockReturnValue(true);
    jest
      .spyOn(ScreenLoadingManager, 'createSpan')
      // @ts-ignore
      .mockReturnValue({ spanId: '42', screenName: 'NavigationPending' });
    // @ts-ignore
    jest.spyOn(ScreenLoadingManager, 'getActiveSpan').mockReturnValue({ spanId: '42' });
    jest.spyOn(ScreenLoadingManager, 'endSpan').mockResolvedValue(undefined);
    jest.spyOn(ScreenLoadingManager, 'isRouteExcluded').mockReturnValue(false);
    const movies = fakeContainer('movies-root', 'Movies');
    const actors = fakeContainer('actors-root', 'Actors');
    Luciq.setNavigationListener(movies.ref);
    Luciq.setNavigationListener(actors.ref);

    movies.dispatchAction();
    // @ts-ignore
    Luciq.onStateChange(actors.navigateTo('ActorDetails'));
    // @ts-ignore
    Luciq.onStateChange(movies.navigateTo('MovieDetails'));

    expect(NativeLuciq.reportScreenChange).toHaveBeenNthCalledWith(1, 'ActorDetails', null);
    expect(NativeLuciq.reportScreenChange).toHaveBeenNthCalledWith(2, 'MovieDetails', '42');
  });

  it('registers one listener when called twice with the same ref', () => {
    const { Luciq } = loadFresh();
    const movies = fakeContainer('movies-root', 'Movies');

    Luciq.setNavigationListener(movies.ref);
    Luciq.setNavigationListener(movies.ref);

    expect(movies.current.addListener).toBeCalledTimes(1);
  });

  it('drops a container that unmounted and removes its listener', () => {
    const { Luciq, NativeLuciq } = loadFresh();
    const movies = fakeContainer('movies-root', 'Movies');
    const actors = fakeContainer('actors-root', 'Actors');
    Luciq.setNavigationListener(movies.ref);
    Luciq.setNavigationListener(actors.ref);

    // @ts-ignore
    actors.ref.current = null;
    // @ts-ignore
    Luciq.onStateChange(movies.navigateTo('MovieDetails'));

    expect(actors.unsubscribe).toBeCalledTimes(1);
    expect(NativeLuciq.reportScreenChange).toBeCalledWith('MovieDetails', null);
  });
});

describe('setNavigationListener with a single NavigationContainer', () => {
  it('reports route changes and skips repeated routes, as before', () => {
    const { Luciq, NativeLuciq } = loadFresh();
    const app = fakeContainer('root', 'Home');
    Luciq.setNavigationListener(app.ref);

    // @ts-ignore
    Luciq.onStateChange(app.state);
    // @ts-ignore
    Luciq.onStateChange(app.state);
    // @ts-ignore
    Luciq.onStateChange(app.navigateTo('Settings'));

    expect(NativeLuciq.reportScreenChange).toBeCalledTimes(2);
    expect(NativeLuciq.reportScreenChange).toHaveBeenNthCalledWith(1, 'Home', null);
    expect(NativeLuciq.reportScreenChange).toHaveBeenNthCalledWith(2, 'Settings', null);
  });

  it('uses the container even when the passed state cannot be matched', () => {
    const { Luciq, NativeLuciq } = loadFresh();
    const app = fakeContainer('root', 'Home');
    Luciq.setNavigationListener(app.ref);

    // @ts-ignore
    Luciq.onStateChange({ index: 0, routes: [{ name: 'anything' }] });

    expect(NativeLuciq.reportScreenChange).toBeCalledWith('Home', null);
  });
});
