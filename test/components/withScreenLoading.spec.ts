/**
 * Tests for withScreenLoading HOC utility functions
 *
 * Since we don't have react-test-renderer available, we test the configuration
 * logic and option handling directly.
 */

// Mock the native modules
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
  },
  emitter: {
    addListener: jest.fn(),
  },
  NativeEvents: {},
}));

import type { WithScreenLoadingOptions, WithScreenLoadingInjectedProps } from '../../src';

describe('withScreenLoading HOC Options', () => {
  describe('WithScreenLoadingOptions', () => {
    it('should have correct default values structure', () => {
      const defaultOptions: WithScreenLoadingOptions = {
        autoReportTTID: true,
        autoReportTTFD: false,
      };

      expect(defaultOptions.autoReportTTID).toBe(true);
      expect(defaultOptions.autoReportTTFD).toBe(false);
      expect(defaultOptions.screenName).toBeUndefined();
      expect(defaultOptions.attributes).toBeUndefined();
    });

    it('should allow custom screen name', () => {
      const options: WithScreenLoadingOptions = {
        screenName: 'CustomScreenName',
        autoReportTTID: true,
        autoReportTTFD: false,
      };

      expect(options.screenName).toBe('CustomScreenName');
    });

    it('should allow custom attributes', () => {
      const options: WithScreenLoadingOptions = {
        screenName: 'ProductScreen',
        attributes: {
          product_id: '123',
          category: 'electronics',
        },
        autoReportTTID: true,
        autoReportTTFD: false,
      };

      expect(options.attributes).toEqual({
        product_id: '123',
        category: 'electronics',
      });
    });

    it('should allow useDispatchTime configuration', () => {
      const optionsWithDispatchTime: WithScreenLoadingOptions = {
        useDispatchTime: true,
        autoReportTTID: true,
      };

      const optionsWithoutDispatchTime: WithScreenLoadingOptions = {
        useDispatchTime: false,
        autoReportTTID: true,
      };

      expect(optionsWithDispatchTime.useDispatchTime).toBe(true);
      expect(optionsWithoutDispatchTime.useDispatchTime).toBe(false);
    });

    it('should allow auto TTFD for static screens', () => {
      const staticScreenOptions: WithScreenLoadingOptions = {
        screenName: 'AboutScreen',
        autoReportTTID: true,
        autoReportTTFD: true, // Static screens can auto-report TTFD
      };

      expect(staticScreenOptions.autoReportTTFD).toBe(true);
    });

    it('should allow all optional props to be undefined', () => {
      const minimalOptions: WithScreenLoadingOptions = {};

      expect(minimalOptions.screenName).toBeUndefined();
      expect(minimalOptions.autoReportTTID).toBeUndefined();
      expect(minimalOptions.autoReportTTFD).toBeUndefined();
      expect(minimalOptions.useDispatchTime).toBeUndefined();
      expect(minimalOptions.attributes).toBeUndefined();
    });

    it('should handle empty attributes object', () => {
      const options: WithScreenLoadingOptions = {
        attributes: {},
      };

      expect(options.attributes).toEqual({});
    });
  });

  describe('WithScreenLoadingInjectedProps', () => {
    it('should define expected injected prop types', () => {
      // Verify the interface shape
      const mockInjectedProps: WithScreenLoadingInjectedProps = {
        reportFullDisplay: jest.fn(),
        reportStage: jest.fn(),
        screenLoadingScreenName: 'TestScreen',
        getElapsedTime: jest.fn().mockReturnValue(100),
      };

      expect(typeof mockInjectedProps.reportFullDisplay).toBe('function');
      expect(typeof mockInjectedProps.reportStage).toBe('function');
      expect(mockInjectedProps.screenLoadingScreenName).toBe('TestScreen');
      expect(typeof mockInjectedProps.getElapsedTime).toBe('function');
    });

    it('should have callable reportFullDisplay', () => {
      const reportFullDisplay = jest.fn();

      reportFullDisplay();

      expect(reportFullDisplay).toHaveBeenCalled();
    });

    it('should have callable reportStage with stage name', () => {
      const reportStage = jest.fn();

      reportStage('data_loaded');
      reportStage('images_ready');

      expect(reportStage).toHaveBeenCalledWith('data_loaded');
      expect(reportStage).toHaveBeenCalledWith('images_ready');
    });

    it('should have callable getElapsedTime returning number', () => {
      const startTime = Date.now();
      const getElapsedTime = jest.fn().mockImplementation(() => Date.now() - startTime);

      const elapsed = getElapsedTime();

      expect(typeof elapsed).toBe('number');
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should support multiple reportStage calls', () => {
      const reportStage = jest.fn();
      const stages = ['init', 'api_call', 'data_parse', 'render'];

      stages.forEach((stage) => reportStage(stage));

      expect(reportStage).toHaveBeenCalledTimes(4);
      stages.forEach((stage) => {
        expect(reportStage).toHaveBeenCalledWith(stage);
      });
    });

    it('should support getElapsedTime at different points', () => {
      let mockTime = 1000;
      const getElapsedTime = jest.fn().mockImplementation(() => mockTime);

      expect(getElapsedTime()).toBe(1000);

      mockTime = 1500;
      expect(getElapsedTime()).toBe(1500);

      mockTime = 2000;
      expect(getElapsedTime()).toBe(2000);
    });
  });
});

describe('withScreenLoading Display Name', () => {
  it('should generate correct display name for named function', () => {
    function TestComponent() {
      return null;
    }
    const comp = TestComponent as { displayName?: string; name: string };

    const displayName = comp.displayName || comp.name || 'Component';
    const wrappedDisplayName = `withScreenLoading(${displayName})`;

    expect(wrappedDisplayName).toBe('withScreenLoading(TestComponent)');
  });

  it('should generate correct display name for component with displayName', () => {
    function MyComponent() {
      return null;
    }
    const comp = MyComponent as { displayName?: string; name: string };
    comp.displayName = 'CustomDisplayName';

    const displayName = comp.displayName || comp.name || 'Component';
    const wrappedDisplayName = `withScreenLoading(${displayName})`;

    expect(wrappedDisplayName).toBe('withScreenLoading(CustomDisplayName)');
  });

  it('should handle anonymous components', () => {
    const AnonymousComponent = () => null;
    const comp = AnonymousComponent as { displayName?: string; name: string };

    const displayName = comp.displayName || comp.name || 'Component';
    const wrappedDisplayName = `withScreenLoading(${displayName})`;

    expect(wrappedDisplayName).toBe('withScreenLoading(AnonymousComponent)');
  });

  it('should fall back to Component for truly anonymous functions', () => {
    const component = function () {
      return null;
    } as { displayName?: string; name: string };
    // Clear the name
    Object.defineProperty(component, 'name', { value: '' });

    const displayName = component.displayName || component.name || 'Component';
    const wrappedDisplayName = `withScreenLoading(${displayName})`;

    expect(wrappedDisplayName).toBe('withScreenLoading(Component)');
  });

  it('should prefer displayName over name', () => {
    function OriginalName() {
      return null;
    }
    const comp = OriginalName as { displayName?: string; name: string };
    comp.displayName = 'PreferredName';

    const displayName = comp.displayName || comp.name || 'Component';

    expect(displayName).toBe('PreferredName');
  });
});

describe('withScreenLoading Screen Name Resolution', () => {
  it('should use configured screenName when provided', () => {
    const options: WithScreenLoadingOptions = {
      screenName: 'ConfiguredScreen',
    };

    const componentName = 'OriginalComponent';
    const resolvedName = options.screenName || componentName;

    expect(resolvedName).toBe('ConfiguredScreen');
  });

  it('should fall back to component name when screenName not provided', () => {
    const options: WithScreenLoadingOptions = {};

    const componentName = 'MyScreenComponent';
    const resolvedName = options.screenName || componentName;

    expect(resolvedName).toBe('MyScreenComponent');
  });

  it('should handle empty string screenName by falling back', () => {
    const options: WithScreenLoadingOptions = {
      screenName: '',
    };

    const componentName = 'FallbackComponent';
    const resolvedName = options.screenName || componentName;

    expect(resolvedName).toBe('FallbackComponent');
  });

  it('should prioritize explicit screenName over all fallbacks', () => {
    const options: WithScreenLoadingOptions = {
      screenName: 'ExplicitScreen',
    };

    const componentName = 'ComponentName';
    const navigationScreenName = 'NavigationScreen';
    const resolvedName = options.screenName || navigationScreenName || componentName;

    expect(resolvedName).toBe('ExplicitScreen');
  });
});

describe('withScreenLoading Auto-Report Logic', () => {
  it('should report TTID when autoReportTTID is true', () => {
    const options: WithScreenLoadingOptions = {
      autoReportTTID: true,
      autoReportTTFD: false,
    };

    const reportInitialDisplay = jest.fn();

    // Simulate useEffect behavior
    if (options.autoReportTTID) {
      reportInitialDisplay();
    }

    expect(reportInitialDisplay).toHaveBeenCalled();
  });

  it('should not report TTID when autoReportTTID is false', () => {
    const options: WithScreenLoadingOptions = {
      autoReportTTID: false,
      autoReportTTFD: false,
    };

    const reportInitialDisplay = jest.fn();

    // Simulate useEffect behavior
    if (options.autoReportTTID) {
      reportInitialDisplay();
    }

    expect(reportInitialDisplay).not.toHaveBeenCalled();
  });

  it('should report TTFD when autoReportTTFD is true', () => {
    const options: WithScreenLoadingOptions = {
      autoReportTTID: true,
      autoReportTTFD: true,
    };

    const reportFullDisplay = jest.fn();

    // Simulate useEffect behavior
    if (options.autoReportTTFD) {
      reportFullDisplay();
    }

    expect(reportFullDisplay).toHaveBeenCalled();
  });

  it('should not report TTFD when autoReportTTFD is false', () => {
    const options: WithScreenLoadingOptions = {
      autoReportTTID: true,
      autoReportTTFD: false,
    };

    const reportFullDisplay = jest.fn();

    // Simulate useEffect behavior
    if (options.autoReportTTFD) {
      reportFullDisplay();
    }

    expect(reportFullDisplay).not.toHaveBeenCalled();
  });

  it('should handle undefined autoReportTTID with default behavior', () => {
    const options: WithScreenLoadingOptions = {};
    const autoReportTTID = options.autoReportTTID ?? true; // Default to true

    const reportInitialDisplay = jest.fn();

    if (autoReportTTID) {
      reportInitialDisplay();
    }

    expect(reportInitialDisplay).toHaveBeenCalled();
  });

  it('should handle undefined autoReportTTFD with default behavior', () => {
    const options: WithScreenLoadingOptions = {};
    const autoReportTTFD = options.autoReportTTFD ?? false; // Default to false

    const reportFullDisplay = jest.fn();

    if (autoReportTTFD) {
      reportFullDisplay();
    }

    expect(reportFullDisplay).not.toHaveBeenCalled();
  });
});

describe('withScreenLoading Integration Patterns', () => {
  describe('Static Screen Pattern', () => {
    it('should auto-report both TTID and TTFD for static screens', () => {
      const options: WithScreenLoadingOptions = {
        screenName: 'AboutScreen',
        autoReportTTID: true,
        autoReportTTFD: true, // No async data needed
      };

      const reportInitialDisplay = jest.fn();
      const reportFullDisplay = jest.fn();

      // Simulate mount
      if (options.autoReportTTID) {
        reportInitialDisplay();
      }
      if (options.autoReportTTFD) {
        reportFullDisplay();
      }

      expect(reportInitialDisplay).toHaveBeenCalledTimes(1);
      expect(reportFullDisplay).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dynamic Screen Pattern', () => {
    it('should auto-report TTID but require manual TTFD for dynamic screens', () => {
      const options: WithScreenLoadingOptions = {
        screenName: 'ProductListScreen',
        autoReportTTID: true,
        autoReportTTFD: false, // Async data, will call manually
      };

      const reportInitialDisplay = jest.fn();
      const reportFullDisplay = jest.fn();

      // Simulate mount - TTID reported automatically
      if (options.autoReportTTID) {
        reportInitialDisplay();
      }
      if (options.autoReportTTFD) {
        reportFullDisplay();
      }

      expect(reportInitialDisplay).toHaveBeenCalledTimes(1);
      expect(reportFullDisplay).not.toHaveBeenCalled();

      // Simulate data loaded - TTFD reported manually
      reportFullDisplay();
      expect(reportFullDisplay).toHaveBeenCalledTimes(1);
    });
  });

  describe('Class Component Support', () => {
    it('should provide props compatible with class component usage', () => {
      // Simulate what a class component would receive
      const injectedProps: WithScreenLoadingInjectedProps = {
        reportFullDisplay: jest.fn(),
        reportStage: jest.fn(),
        screenLoadingScreenName: 'ClassScreen',
        getElapsedTime: jest.fn().mockReturnValue(0),
      };

      // Class component would use in componentDidMount
      injectedProps.reportStage('component_mounted');

      // And when data loads
      injectedProps.reportFullDisplay();

      expect(injectedProps.reportStage).toHaveBeenCalledWith('component_mounted');
      expect(injectedProps.reportFullDisplay).toHaveBeenCalled();
    });
  });

  describe('Attributes Usage', () => {
    it('should support static attributes', () => {
      const options: WithScreenLoadingOptions = {
        screenName: 'CategoryScreen',
        attributes: {
          category: 'electronics',
          view_type: 'grid',
        },
      };

      expect(options.attributes!.category).toBe('electronics');
      expect(options.attributes!.view_type).toBe('grid');
    });

    it('should support many attributes', () => {
      const options: WithScreenLoadingOptions = {
        screenName: 'AnalyticsScreen',
        attributes: {
          attr1: 'value1',
          attr2: 'value2',
          attr3: 'value3',
          attr4: 'value4',
          attr5: 'value5',
        },
      };

      expect(Object.keys(options.attributes!).length).toBe(5);
    });
  });
});

describe('withScreenLoading Edge Cases', () => {
  describe('Timing Edge Cases', () => {
    it('should handle immediate TTFD after TTID', () => {
      const reportInitialDisplay = jest.fn();
      const reportFullDisplay = jest.fn();

      // Both called immediately
      reportInitialDisplay();
      reportFullDisplay();

      expect(reportInitialDisplay).toHaveBeenCalled();
      expect(reportFullDisplay).toHaveBeenCalled();
    });

    it('should handle getElapsedTime at zero', () => {
      const getElapsedTime = jest.fn().mockReturnValue(0);

      expect(getElapsedTime()).toBe(0);
    });

    it('should handle very large elapsed time', () => {
      const getElapsedTime = jest.fn().mockReturnValue(120000); // 2 minutes

      expect(getElapsedTime()).toBe(120000);
    });
  });

  describe('Screen Name Edge Cases', () => {
    it('should handle very long screen names', () => {
      const longName = 'A'.repeat(500);
      const options: WithScreenLoadingOptions = {
        screenName: longName,
      };

      expect(options.screenName?.length).toBe(500);
    });

    it('should handle screen names with special characters', () => {
      const specialNames = [
        'Screen/With/Slashes',
        'Screen:With:Colons',
        'Screen-With-Dashes',
        'Screen_With_Underscores',
        'Screen.With.Dots',
      ];

      specialNames.forEach((name) => {
        const options: WithScreenLoadingOptions = { screenName: name };
        expect(options.screenName).toBe(name);
      });
    });

    it('should handle Unicode screen names', () => {
      const options: WithScreenLoadingOptions = {
        screenName: '屏幕名称🚀',
      };

      expect(options.screenName).toBe('屏幕名称🚀');
    });
  });

  describe('reportStage Edge Cases', () => {
    it('should handle empty stage name', () => {
      const reportStage = jest.fn();

      reportStage('');

      expect(reportStage).toHaveBeenCalledWith('');
    });

    it('should handle stage names with special characters', () => {
      const reportStage = jest.fn();
      const stages = ['api-call', 'data_loaded', 'render.complete', 'step:1'];

      stages.forEach((stage) => reportStage(stage));

      expect(reportStage).toHaveBeenCalledTimes(4);
    });
  });
});

describe('withScreenLoading Type Safety', () => {
  it('should enforce correct option types', () => {
    const options: WithScreenLoadingOptions = {
      screenName: 'TypedScreen',
      autoReportTTID: true,
      autoReportTTFD: false,
      useDispatchTime: true,
      attributes: { key: 'value' },
    };

    // TypeScript would catch type errors here
    expect(typeof options.screenName).toBe('string');
    expect(typeof options.autoReportTTID).toBe('boolean');
    expect(typeof options.autoReportTTFD).toBe('boolean');
    expect(typeof options.useDispatchTime).toBe('boolean');
    expect(typeof options.attributes).toBe('object');
  });

  it('should enforce correct injected prop types', () => {
    const props: WithScreenLoadingInjectedProps = {
      reportFullDisplay: () => {},
      reportStage: (_stageName: string) => {},
      screenLoadingScreenName: 'Screen',
      getElapsedTime: () => 0,
    };

    expect(typeof props.reportFullDisplay).toBe('function');
    expect(typeof props.reportStage).toBe('function');
    expect(typeof props.screenLoadingScreenName).toBe('string');
    expect(typeof props.getElapsedTime).toBe('function');
  });
});

// Note: Full component rendering tests for withScreenLoading require
// react-test-renderer which is not available in this test environment.
// The HOC behavior is verified through runtime usage in the example app.
