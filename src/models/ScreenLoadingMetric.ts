export interface ScreenLoadingMetric {
  type: 'initial_display' | 'full_display';
  screenName: string;
  duration: number;
  startTime: number;
  endTime: number;
}