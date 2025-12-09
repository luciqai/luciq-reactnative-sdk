import React, { JSX, useRef } from 'react';
import { requireNativeComponent, ViewStyle } from 'react-native';
import type {
  NativeScreenLoadingViewProps,
  ScreenLoadingEvent,
} from '../native/NativeScreenLoadingView';
import * as APM from '../modules/APM';

const NativeScreenLoadingView =
  requireNativeComponent<NativeScreenLoadingViewProps>('LCQScreenLoadingView');

interface ScreenLoadingProps {
  record?: boolean;
  screenName?: string;
  children?: React.ReactNode;
  onMeasured?: (duration: number) => void;
}

/**
 * Component for measuring Time To Initial Display (TTID)
 * Place this at the top of your screen component
 */
export function InitialDisplay({
  record = true,
  screenName,
  children,
  onMeasured,
}: ScreenLoadingProps): JSX.Element {
  const hasReported = useRef(false);

  const handleDisplay = (event: { nativeEvent: ScreenLoadingEvent }) => {
    if (!hasReported.current) {
      hasReported.current = true;

      // Report to APM module
      APM._reportScreenLoadingMetric({
        type: 'initial_display',
        screenName: screenName || '',
        duration: event.nativeEvent.duration,
        startTime: event.nativeEvent.startTime,
        endTime: event.nativeEvent.endTime,
      });

      onMeasured?.(event.nativeEvent.duration);
    }
  };

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
        screenName={screenName}
        onDisplay={handleDisplay}
      />
      {children}
    </>
  );
}

/**
 * Component for measuring Time To Full Display (TTFD)
 * Place this where your screen is fully loaded (e.g., after async data)
 */
export function FullDisplay({
  record = true,
  screenName,
  children,
  onMeasured,
}: ScreenLoadingProps): JSX.Element {
  const hasReported = useRef(false);

  const handleDisplay = (event: { nativeEvent: ScreenLoadingEvent }) => {
    if (!hasReported.current) {
      hasReported.current = true;

      // Check if TTID exists for this screen
      if (!APM._hasInitialDisplayForScreen(screenName)) {
        console.warn(
          `[LuciqScreenLoading] No initial display found for screen "${screenName}". ` +
            'TTFD requires TTID to be measured first.',
        );
        return;
      }

      APM._reportScreenLoadingMetric({
        type: 'full_display',
        screenName: screenName || '',
        duration: event.nativeEvent.duration,
        startTime: event.nativeEvent.startTime,
        endTime: event.nativeEvent.endTime,
      });

      onMeasured?.(event.nativeEvent.duration);
    }
  };

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
        screenName={screenName}
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
