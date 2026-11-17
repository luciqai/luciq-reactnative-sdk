import '../mocks/mockLuciqUtils';
import '../mocks/mockNetworkLogger';

import { Platform } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

import type * as LuciqModule from '../../src/modules/Luciq';
import type * as NativeLuciqModule from '../../src/native/NativeLuciq';

jest.mock('../../src/modules/NetworkLogger');

/** The navigation state lives in module state, so every case loads a fresh module. */
function loadFresh() {
  let modules!: {
    Luciq: typeof LuciqModule;
    NativeLuciq: typeof NativeLuciqModule.NativeLuciq;
  };
  jest.isolateModules(() => {
    modules = {
      Luciq: require('../../src/modules/Luciq'),
      NativeLuciq: require('../../src/native/NativeLuciq').NativeLuciq,
    };
  });
  return modules;
}

/** A ready navigation container whose current route is [routeName]. */
function navigationRefOn(routeName: string) {
  return {
    current: {
      addListener: jest.fn(() => jest.fn()),
      getCurrentRoute: jest.fn(() => ({ name: routeName })),
    },
  } as unknown as NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
}

const someState = { index: 0, routes: [{ name: 'any' }] };

describe('current view with setNavigationListener', () => {
  it('reports each new route as the current view on Android', () => {
    Platform.OS = 'android';
    const { Luciq, NativeLuciq } = loadFresh();
    Luciq.setNavigationListener(navigationRefOn('BenefitDetail'));

    // @ts-ignore
    Luciq.onStateChange(someState);

    expect(NativeLuciq.reportCurrentViewChange).toBeCalledWith('BenefitDetail');
    expect(NativeLuciq.reportScreenChange).toBeCalledWith('BenefitDetail', null);
  });

  it('does not report the current view separately on iOS', () => {
    Platform.OS = 'ios';
    const { Luciq, NativeLuciq } = loadFresh();
    Luciq.setNavigationListener(navigationRefOn('BenefitDetail'));

    // @ts-ignore
    Luciq.onStateChange(someState);

    expect(NativeLuciq.reportCurrentViewChange).not.toBeCalled();
    expect(NativeLuciq.reportScreenChange).toBeCalledWith('BenefitDetail', null);
  });
});
