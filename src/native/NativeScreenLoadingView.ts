import type { ViewProps } from 'react-native';

export interface ScreenLoadingEvent {
  type: 0 | 1; // 0 = initial display, 1 = full display
  screenName: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface NativeScreenLoadingViewProps extends ViewProps {
  displayType: 'initialDisplay' | 'fullDisplay';
  record: boolean;
  screenName?: string;
  onDisplay?: (event: { nativeEvent: ScreenLoadingEvent }) => void;
}