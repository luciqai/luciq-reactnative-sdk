import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useContext,
  useCallback,
} from 'react';
import { View, ViewProps } from 'react-native';
import { ScreenLoadingManager } from '../modules/apm/ScreenLoadingManager';
import { Logger } from '../utils/logger';
import { nowMicros, toEpochMicros } from '../utils/LuciqUtils';

// Context to handle nested components
const ScreenLoadingContext = React.createContext<boolean>(false);

export interface LuciqScreenLoadingProps extends ViewProps {
  screenName: string;
  record?: boolean;
  onMeasured?: (ttid: number) => void;
}

export function LuciqCaptureScreenLoading(props: LuciqScreenLoadingProps) {
  const { screenName, record, onMeasured, onLayout, children, ...viewProps } = props;

  const isNested = useContext(ScreenLoadingContext);

  // Refs for timestamps (these don't need to trigger re-renders)
  const constructorTimestampRef = useRef<number>(nowMicros()); // microseconds
  const renderStartTimestampRef = useRef<number | undefined>(undefined);
  const renderEndTimestampRef = useRef<number | undefined>(undefined);
  const mountTimestampRef = useRef<number | undefined>(undefined);

  // Guards to ensure single execution
  const initializedRef = useRef(false);
  const hasFirstRenderCompletedRef = useRef(false);
  const attributesRecordedRef = useRef(false);
  const initialSpanIdRef = useRef<string | null>(null);

  // Capture render start timestamp ONLY on first render
  if (!hasFirstRenderCompletedRef.current) {
    renderStartTimestampRef.current = nowMicros();
  }

  // Initialize span - runs once like constructor (lazy initialization)
  if (!initializedRef.current) {
    initializedRef.current = true;
    // Initialize span if conditions are met
    if (record !== false && ScreenLoadingManager.isFeatureEnabled()) {
      const span = ScreenLoadingManager.createSpan(screenName, true);
      if (span) {
        initialSpanIdRef.current = span.spanId;
        Logger.log(`[LuciqScreenLoading] Span ${span.spanId} created in constructor`);
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

  // Handle nested component detection
  useEffect(() => {
    // Check if we're nested and should ignore this component
    if (isNested && initialSpanIdRef.current) {
      Logger.log(
        `[LuciqScreenLoading] Nested component detected, ignoring span ${initialSpanIdRef.current}`,
      );
      // Cancel the span
      setSpanId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = componentDidMount

  // Record lifecycle timestamps after first render completes (synchronous)
  // useLayoutEffect fires synchronously after DOM mutations but before browser paint
  useLayoutEffect(() => {
    // Skip if no span, already recorded, or nested
    if (!spanId || attributesRecordedRef.current || isNested) {
      return;
    }

    attributesRecordedRef.current = true;
    mountTimestampRef.current = nowMicros();

    // Record all timestamps
    ScreenLoadingManager.addSpanAttribute(
      spanId,
      'cnst_mus_st',
      toEpochMicros(constructorTimestampRef.current),
    );

    if (renderStartTimestampRef.current) {
      ScreenLoadingManager.addSpanAttribute(
        spanId,
        'rnd_mus_st',
        toEpochMicros(renderStartTimestampRef.current),
      );
    }

    ScreenLoadingManager.addSpanAttribute(
      spanId,
      'mnt_mus_st',
      toEpochMicros(mountTimestampRef.current),
    );

    // Record all durations
    if (renderStartTimestampRef.current) {
      // Constructor duration: time from component init to first render start
      const constructorDuration = renderStartTimestampRef.current - constructorTimestampRef.current;
      ScreenLoadingManager.addSpanAttribute(spanId, 'cnst_mus', constructorDuration);
    }

    if (renderEndTimestampRef.current && renderStartTimestampRef.current) {
      // Render duration: time spent creating JSX
      const renderDuration = renderEndTimestampRef.current - renderStartTimestampRef.current;
      ScreenLoadingManager.addSpanAttribute(spanId, 'rnd_mus', renderDuration);
    }

    if (mountTimestampRef.current && renderEndTimestampRef.current) {
      // Mount duration: time from render complete to effect execution
      const mountDuration = mountTimestampRef.current - renderEndTimestampRef.current;
      ScreenLoadingManager.addSpanAttribute(spanId, 'mnt_mus', mountDuration);
    }

    Logger.log(`[LuciqScreenLoading] Lifecycle measurements for span ${spanId}:`, {
      constructor_us: renderStartTimestampRef.current
        ? renderStartTimestampRef.current - constructorTimestampRef.current
        : undefined,
      render_us:
        renderEndTimestampRef.current && renderStartTimestampRef.current
          ? renderEndTimestampRef.current - renderStartTimestampRef.current
          : undefined,
      mount_us:
        mountTimestampRef.current && renderEndTimestampRef.current
          ? mountTimestampRef.current - renderEndTimestampRef.current
          : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spanId]); // Run when spanId is set

  // componentWillUnmount equivalent
  useEffect(() => {
    return () => {
      // Cleanup on unmount if not measured
      if (spanIdRef.current && !isMeasuredRef.current) {
        ScreenLoadingManager.endSpan(spanIdRef.current).catch((error) => {
          Logger.warn('[LuciqScreenLoading] Failed to end span on unmount:', error);
        });
      }
    };
  }, []); // Empty deps = only runs cleanup on unmount

  const handleLayout = useCallback(
    async (event: any) => {
      if (spanIdRef.current && !isMeasuredRef.current) {
        const layoutTimestamp = nowMicros();
        setIsMeasured(true);

        // Record layout timestamp
        ScreenLoadingManager.addSpanAttribute(
          spanIdRef.current,
          'lyt_mus_st',
          toEpochMicros(layoutTimestamp),
        );

        // Calculate layout duration (time from mount to layout)
        if (mountTimestampRef.current) {
          const layoutDuration = layoutTimestamp - mountTimestampRef.current;
          ScreenLoadingManager.addSpanAttribute(spanIdRef.current, 'lyt_mus', layoutDuration);
        }

        // Small delay to ensure frame is actually rendered
        setTimeout(async () => {
          const currentSpanId = spanIdRef.current;
          if (currentSpanId) {
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

  // Create the JSX result
  const result = (
    <ScreenLoadingContext.Provider value={spanId !== null}>
      <View {...viewProps} onLayout={handleLayout}>
        {children}
      </View>
    </ScreenLoadingContext.Provider>
  );

  // Capture render end timestamp ONLY on first render (after JSX creation)
  if (!hasFirstRenderCompletedRef.current) {
    renderEndTimestampRef.current = nowMicros();
    hasFirstRenderCompletedRef.current = true;
  }

  return result;
}
