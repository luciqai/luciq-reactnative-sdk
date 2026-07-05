import React from 'react';
import { Text } from 'react-native';
import { render, screen, cleanup } from '@testing-library/react-native';

import { AppLaunchStagesManager } from '../../src/modules/apm/AppLaunchStagesManager';
import * as LuciqUtils from '../../src/utils/LuciqUtils';

jest.mock('../../src/modules/apm/AppLaunchStagesManager', () => ({
  AppLaunchStagesManager: {
    isFeatureEnabled: jest.fn(),
    markRenderStart: jest.fn(),
    markMounted: jest.fn(),
    markInteractive: jest.fn(),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  Logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../src/utils/LuciqUtils', () => ({
  nowMicros: jest.fn(() => 1000),
  toEpochMicros: jest.fn((val: number) => val + 1000000),
  fromEpochMicros: jest.fn((val: number) => val - 1000000),
}));

// Import after mocks are set up
const { LuciqCaptureAppLaunch } = require('../../src/components/LuciqCaptureAppLaunch');

const mockManager = AppLaunchStagesManager as jest.Mocked<typeof AppLaunchStagesManager>;
const mockNowMicros = LuciqUtils.nowMicros as jest.Mock;

describe('LuciqCaptureAppLaunch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNowMicros.mockReturnValue(1000);
  });

  afterEach(cleanup);

  it('should render children inside a View', () => {
    mockManager.isFeatureEnabled.mockReturnValue(false);

    render(
      <LuciqCaptureAppLaunch>
        <Text>Hello</Text>
      </LuciqCaptureAppLaunch>,
    );

    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('should mark render start and mount when the feature is enabled', () => {
    mockManager.isFeatureEnabled.mockReturnValue(true);

    render(
      <LuciqCaptureAppLaunch>
        <Text>App</Text>
      </LuciqCaptureAppLaunch>,
    );

    expect(mockManager.markRenderStart).toHaveBeenCalledWith(1000);
    expect(mockManager.markMounted).toHaveBeenCalledWith(1000);
  });

  it('should not mark anything when the feature is disabled', () => {
    mockManager.isFeatureEnabled.mockReturnValue(false);

    render(
      <LuciqCaptureAppLaunch>
        <Text>App</Text>
      </LuciqCaptureAppLaunch>,
    );

    expect(mockManager.markRenderStart).not.toHaveBeenCalled();
    expect(mockManager.markMounted).not.toHaveBeenCalled();
  });

  it('should not mark anything when record is false', () => {
    mockManager.isFeatureEnabled.mockReturnValue(true);

    render(
      <LuciqCaptureAppLaunch record={false}>
        <Text>App</Text>
      </LuciqCaptureAppLaunch>,
    );

    expect(mockManager.markRenderStart).not.toHaveBeenCalled();
    expect(mockManager.markMounted).not.toHaveBeenCalled();
  });

  it('should pass viewProps and onLayout to the View', () => {
    mockManager.isFeatureEnabled.mockReturnValue(false);
    const onLayout = jest.fn();

    render(
      <LuciqCaptureAppLaunch testID="launch-view" onLayout={onLayout}>
        <Text>App</Text>
      </LuciqCaptureAppLaunch>,
    );

    const view = screen.getByTestId('launch-view');
    expect(view).toBeTruthy();
    expect(view.props.onLayout).toBe(onLayout);
  });
});
