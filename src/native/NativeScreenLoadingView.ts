import type { ViewProps } from 'react-native';

export interface ScreenLoadingEvent {
  type: 0; // 0 = initial display
  screenName: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface NativeScreenLoadingViewProps extends ViewProps {
  displayType: 'initialDisplay';
  record: boolean;
  screenName?: string;
  onDisplay?: (event: { nativeEvent: ScreenLoadingEvent }) => void;
}
