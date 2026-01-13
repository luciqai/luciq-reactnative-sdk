import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { View, ViewProps } from 'react-native';
import { ScreenLoadingManager } from '../modules/apm/ScreenLoadingManager';

// Context to handle nested components
const ScreenLoadingContext = React.createContext<boolean>(false);

export interface LuciqScreenLoadingProps extends ViewProps {
  screenName: string;
  record?: boolean;
  onMeasured?: (ttid: number) => void;
}

export function LuciqScreenLoading(props: LuciqScreenLoadingProps) {
  const { screenName, record, onMeasured, onLayout, children, ...viewProps } = props;

  const isNested = useContext(ScreenLoadingContext);

  // Refs for timestamps (these don't need to trigger re-renders)
  const constructorTimestampRef = useRef<number>(Date.now() * 1000); // microseconds
  const componentDidMountTimestampRef = useRef<number | undefined>(undefined);
  const renderStartTimestampRef = useRef<number | undefined>(undefined);
  const renderEndTimestampRef = useRef<number | undefined>(undefined);

  // Initialize span - runs once like constructor (lazy initialization)
  const initializedRef = useRef(false);
  const initialSpanIdRef = useRef<string | null>(null);

  if (!initializedRef.current) {
    initializedRef.current = true;
    // Initialize span if conditions are met
    if (record !== false && ScreenLoadingManager.isFeatureEnabled()) {
      const span = ScreenLoadingManager.createSpan(screenName, true);
      if (span) {
        initialSpanIdRef.current = span.spanId;
        ScreenLoadingManager.addSpanAttribute(span.spanId, 'component', 'LuciqScreenLoading');
        console.log(`[LuciqScreenLoading] Span ${span.spanId} created in constructor`);
      }
    }
  }

  const [spanId, setSpanId] = useState<string | null>(initialSpanIdRef.current);
  const [isMeasured, setIsMeasured] = useState(false);

  // Refs to track latest values for cleanup (componentWillUnmount)
  const spanIdRef = useRef<string | null>(spanId);
  const isMeasuredRef = useRef(isMeasured);

  // Keep refs in sync with state
  useEffect(() => {
    spanIdRef.current = spanId;
  }, [spanId]);

  useEffect(() => {
    isMeasuredRef.current = isMeasured;
  }, [isMeasured]);

  // componentDidMount equivalent
  useEffect(() => {
    componentDidMountTimestampRef.current = Date.now() * 1000;

    // Check if we're nested and should ignore this component
    if (isNested && initialSpanIdRef.current) {
      console.log(
        `[LuciqScreenLoading] Nested component detected, ignoring span ${initialSpanIdRef.current}`,
      );
      // Cancel the span
      setSpanId(null);
      return;
    }

    // Calculate and add lifecycle durations
    if (initialSpanIdRef.current) {
      const constructorDuration =
        (componentDidMountTimestampRef.current - constructorTimestampRef.current) / 1000; // ms

      ScreenLoadingManager.addSpanAttribute(initialSpanIdRef.current, 'lifecycle_durations', {
        constructor_ms: constructorDuration,
        componentDidMount_timestamp_us: componentDidMountTimestampRef.current,
      });

      console.log(
        `[LuciqScreenLoading] Lifecycle measurements for span ${initialSpanIdRef.current}:`,
        {
          constructor_ms: constructorDuration,
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = componentDidMount

  // componentWillUnmount equivalent
  useEffect(() => {
    return () => {
      // Cleanup on unmount if not measured
      if (spanIdRef.current && !isMeasuredRef.current) {
        ScreenLoadingManager.endSpan(spanIdRef.current).catch((error) => {
          console.warn('[LuciqScreenLoading] Failed to end span on unmount:', error);
        });
      }
    };
  }, []); // Empty deps = only runs cleanup on unmount

  const handleLayout = useCallback(
    async (event: any) => {
      if (spanIdRef.current && !isMeasuredRef.current) {
        setIsMeasured(true);

        // Small delay to ensure frame is actually rendered
        setTimeout(async () => {
          const currentSpanId = spanIdRef.current;
          if (currentSpanId) {
            // Add final render timestamp
            const layoutTimestamp = Date.now() * 1000;
            ScreenLoadingManager.addSpanAttribute(
              currentSpanId,
              'layout_timestamp_us',
              layoutTimestamp,
            );

            // Calculate render duration if we have the timestamps
            if (renderStartTimestampRef.current && renderEndTimestampRef.current) {
              const renderDuration =
                (renderEndTimestampRef.current - renderStartTimestampRef.current) / 1000; // ms

              // Update lifecycle durations with render time
              const span = ScreenLoadingManager.getActiveSpan(currentSpanId);
              if (span?.attributes.lifecycle_durations) {
                span.attributes.lifecycle_durations.render_ms = renderDuration;
              }
            }

            await ScreenLoadingManager.endSpan(currentSpanId);

            // Get the completed span to retrieve TTID
            const span = ScreenLoadingManager.getActiveSpan(currentSpanId);
            if (span?.ttid && onMeasured) {
              onMeasured(span.ttid / 1000); // Convert to milliseconds for callback
            }
          }
        }, 0);
      }

      // Call original onLayout if provided
      if (onLayout) {
        onLayout(event);
      }
    },
    [onLayout, onMeasured],
  );

  // Track render start
  renderStartTimestampRef.current = Date.now() * 1000;

  const result = (
    <ScreenLoadingContext.Provider value={spanId !== null}>
      <View {...viewProps} onLayout={handleLayout}>
        {children}
      </View>
    </ScreenLoadingContext.Provider>
  );

  // Track render end
  renderEndTimestampRef.current = Date.now() * 1000;

  // Calculate render duration
  if (spanId && renderStartTimestampRef.current && renderEndTimestampRef.current) {
    const renderDuration = (renderEndTimestampRef.current - renderStartTimestampRef.current) / 1000; // ms

    // Store render duration
    ScreenLoadingManager.addSpanAttribute(spanId, 'lifecycle_durations', {
      ...ScreenLoadingManager.getActiveSpan(spanId)?.attributes.lifecycle_durations,
      render_ms: renderDuration,
    });
  }

  return result;
}
