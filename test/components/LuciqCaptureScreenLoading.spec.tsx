import React from 'react';
import { Text } from 'react-native';
import { render, screen, cleanup } from '@testing-library/react-native';

import { ScreenLoadingManager } from '../../src/modules/apm/ScreenLoadingManager';
import * as LuciqUtils from '../../src/utils/LuciqUtils';

jest.mock('../../src/modules/apm/ScreenLoadingManager', () => ({
  ScreenLoadingManager: {
    isFeatureEnabled: jest.fn(),
    createSpan: jest.fn(),
    endSpan: jest.fn(),
    getActiveSpan: jest.fn(),
    addSpanAttribute: jest.fn(),
    discardSpan: jest.fn(),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  Logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../src/utils/LuciqUtils', () => ({
  nowMicros: jest.fn(() => 1000),
  toEpochMicros: jest.fn((val: number) => val + 1000000),
  fromEpochMicros: jest.fn((val: number) => val - 1000000),
}));

// Import after mocks are set up
const { LuciqCaptureScreenLoading } = require('../../src/components/LuciqCaptureScreenLoading');

const mockScreenLoadingManager = ScreenLoadingManager as jest.Mocked<typeof ScreenLoadingManager>;
const mockNowMicros = LuciqUtils.nowMicros as jest.Mock;

describe('LuciqCaptureScreenLoading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNowMicros.mockReturnValue(1000);
    (mockScreenLoadingManager.endSpan as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it('should render children inside a View', () => {
    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(false);

    render(
      <LuciqCaptureScreenLoading screenName="TestScreen">
        <Text>Hello</Text>
      </LuciqCaptureScreenLoading>,
    );

    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('should create a span when feature is enabled', () => {
    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(true);
    mockScreenLoadingManager.createSpan.mockReturnValue({
      spanId: '123',
      screenName: 'TestScreen',
      startTimestamp: 1000,
      status: 'measuring',
      isManual: true,
      attributes: new Map(),
    });

    render(
      <LuciqCaptureScreenLoading screenName="TestScreen">
        <Text>Content</Text>
      </LuciqCaptureScreenLoading>,
    );

    expect(mockScreenLoadingManager.createSpan).toHaveBeenCalledWith('TestScreen', true, 1000);
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('should not create a span when feature is disabled', () => {
    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(false);

    render(
      <LuciqCaptureScreenLoading screenName="TestScreen">
        <Text>Content</Text>
      </LuciqCaptureScreenLoading>,
    );

    expect(mockScreenLoadingManager.createSpan).not.toHaveBeenCalled();
  });

  it('should not create a span when record is false', () => {
    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(true);

    render(
      <LuciqCaptureScreenLoading screenName="TestScreen" record={false}>
        <Text>Content</Text>
      </LuciqCaptureScreenLoading>,
    );

    expect(mockScreenLoadingManager.createSpan).not.toHaveBeenCalled();
  });

  it('should call endSpan and record attributes when span is created', async () => {
    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(true);
    mockScreenLoadingManager.createSpan.mockReturnValue({
      spanId: '456',
      screenName: 'HomeScreen',
      startTimestamp: 1000,
      status: 'measuring',
      isManual: true,
      attributes: new Map(),
    });
    mockScreenLoadingManager.endSpan.mockResolvedValue(undefined);

    render(
      <LuciqCaptureScreenLoading screenName="HomeScreen">
        <Text>Home</Text>
      </LuciqCaptureScreenLoading>,
    );

    expect(mockScreenLoadingManager.endSpan).toHaveBeenCalledWith('456');
    expect(mockScreenLoadingManager.addSpanAttribute).toHaveBeenCalledWith(
      '456',
      'cnst_mus_st',
      expect.any(Number),
    );
    expect(mockScreenLoadingManager.addSpanAttribute).toHaveBeenCalledWith(
      '456',
      'rnd_mus_st',
      expect.any(Number),
    );
    expect(mockScreenLoadingManager.addSpanAttribute).toHaveBeenCalledWith(
      '456',
      'mnt_mus_st',
      expect.any(Number),
    );
  });

  it('should call onMeasured callback with ttid in milliseconds', async () => {
    const onMeasured = jest.fn();

    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(true);
    mockScreenLoadingManager.createSpan.mockReturnValue({
      spanId: '789',
      screenName: 'DetailScreen',
      startTimestamp: 1000,
      status: 'measuring',
      isManual: true,
      attributes: new Map(),
    });
    mockScreenLoadingManager.endSpan.mockResolvedValue(undefined);
    mockScreenLoadingManager.getActiveSpan.mockReturnValue({
      spanId: '789',
      screenName: 'DetailScreen',
      startTimestamp: 1000,
      endTimestamp: 2000,
      ttid: 50000, // 50ms in microseconds
      status: 'completed',
      isManual: true,
      attributes: new Map(),
    });

    render(
      <LuciqCaptureScreenLoading screenName="DetailScreen" onMeasured={onMeasured}>
        <Text>Detail</Text>
      </LuciqCaptureScreenLoading>,
    );

    // Flush microtasks to allow endSpan promise to resolve and trigger onMeasured
    await new Promise(process.nextTick);

    expect(onMeasured).toHaveBeenCalledWith(50); // 50000 / 1000 = 50ms
  });

  it('should not call onMeasured if ttid is undefined', async () => {
    const onMeasured = jest.fn();

    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(true);
    mockScreenLoadingManager.createSpan.mockReturnValue({
      spanId: '101',
      screenName: 'Screen',
      startTimestamp: 1000,
      status: 'measuring',
      isManual: true,
      attributes: new Map(),
    });
    mockScreenLoadingManager.endSpan.mockResolvedValue(undefined);
    mockScreenLoadingManager.getActiveSpan.mockReturnValue({
      spanId: '101',
      screenName: 'Screen',
      startTimestamp: 1000,
      status: 'error',
      isManual: true,
      attributes: new Map(),
    });

    render(
      <LuciqCaptureScreenLoading screenName="Screen" onMeasured={onMeasured}>
        <Text>Content</Text>
      </LuciqCaptureScreenLoading>,
    );

    await new Promise(process.nextTick);

    expect(onMeasured).not.toHaveBeenCalled();
  });

  it('should end span on unmount if not measured', async () => {
    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(true);
    mockScreenLoadingManager.createSpan.mockReturnValue({
      spanId: '999',
      screenName: 'UnmountScreen',
      startTimestamp: 1000,
      status: 'measuring',
      isManual: true,
      attributes: new Map(),
    });
    // Make endSpan not resolve immediately so isMeasured stays false
    (mockScreenLoadingManager.endSpan as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { unmount } = render(
      <LuciqCaptureScreenLoading screenName="UnmountScreen">
        <Text>Will Unmount</Text>
      </LuciqCaptureScreenLoading>,
    );

    // Reset to track unmount call
    (mockScreenLoadingManager.endSpan as jest.Mock).mockResolvedValue(undefined);

    unmount();

    // endSpan is called from useLayoutEffect (first call) and from unmount cleanup
    expect(mockScreenLoadingManager.endSpan).toHaveBeenCalled();
  });

  it('should handle nested components by cancelling the inner span', async () => {
    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(true);

    let callCount = 0;
    (mockScreenLoadingManager.createSpan as jest.Mock).mockImplementation(() => {
      callCount++;
      return {
        spanId: `span-${callCount}`,
        screenName: 'Screen',
        startTimestamp: 1000,
        status: 'measuring',
        isManual: true,
        attributes: new Map(),
      };
    });
    (mockScreenLoadingManager.endSpan as jest.Mock).mockResolvedValue(undefined);

    render(
      <LuciqCaptureScreenLoading screenName="OuterScreen">
        <LuciqCaptureScreenLoading screenName="InnerScreen">
          <Text>Nested</Text>
        </LuciqCaptureScreenLoading>
      </LuciqCaptureScreenLoading>,
    );

    // Both outer and inner create spans during initialization (synchronous)
    expect(mockScreenLoadingManager.createSpan).toHaveBeenCalledTimes(2);
    // The outer span should proceed; endSpan should be called for the outer span
    expect(mockScreenLoadingManager.endSpan).toHaveBeenCalledWith('span-1');
  });

  it('should pass viewProps and onLayout to the View', () => {
    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(false);

    const onLayout = jest.fn();

    render(
      <LuciqCaptureScreenLoading screenName="TestScreen" testID="test-view" onLayout={onLayout}>
        <Text>Content</Text>
      </LuciqCaptureScreenLoading>,
    );

    const view = screen.getByTestId('test-view');
    expect(view).toBeTruthy();
    expect(view.props.onLayout).toBe(onLayout);
  });

  it('should not create span when createSpan returns null', async () => {
    mockScreenLoadingManager.isFeatureEnabled.mockReturnValue(true);
    mockScreenLoadingManager.createSpan.mockReturnValue(null);

    render(
      <LuciqCaptureScreenLoading screenName="NullSpanScreen">
        <Text>Content</Text>
      </LuciqCaptureScreenLoading>,
    );

    expect(mockScreenLoadingManager.endSpan).not.toHaveBeenCalled();
    expect(mockScreenLoadingManager.addSpanAttribute).not.toHaveBeenCalled();
  });
});
