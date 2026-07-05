import React, { useLayoutEffect, useRef } from 'react';
import { View, ViewProps } from 'react-native';

import { AppLaunchStagesManager } from '../modules/apm/AppLaunchStagesManager';
import { Logger } from '../utils/logger';
import { LuciqDebugTags } from '../constants/DebugTags';
import { nowMicros } from '../utils/LuciqUtils';

const TAG = LuciqDebugTags.APM_APP_LAUNCH;

export interface LuciqAppLaunchProps extends ViewProps {
  /**
   * Set to `false` to skip capturing app launch stages for this mount.
   * Defaults to `true`.
   */
  record?: boolean;
}

/**
 * Wraps the app's root component to capture the JS-side app launch stages
 * (render start + mount). Combined with `APM.endAppLaunch()` (interactive) and
 * the native process-start timestamp, this splits the cold-launch duration into
 * named stages.
 *
 * @example
 * ```tsx
 * export default function Root() {
 *   return (
 *     <LuciqCaptureAppLaunch>
 *       <App />
 *     </LuciqCaptureAppLaunch>
 *   );
 * }
 * ```
 */
export function LuciqCaptureAppLaunch(props: LuciqAppLaunchProps) {
  const { record, onLayout, children, ...viewProps } = props;

  const renderMarkedRef = useRef(false);
  const mountMarkedRef = useRef(false);

  // Capture render start once, on the first render (before JSX is created).
  if (!renderMarkedRef.current) {
    renderMarkedRef.current = true;
    try {
      if (record !== false && AppLaunchStagesManager.isFeatureEnabled()) {
        AppLaunchStagesManager.markRenderStart(nowMicros());
      }
    } catch (error) {
      Logger.error(TAG, 'markRenderStart failed', {
        message: (error as Error)?.message,
        name: (error as Error)?.name,
      });
    }
  }

  // Capture mount once, after the first commit but before paint.
  useLayoutEffect(() => {
    if (mountMarkedRef.current) {
      return;
    }
    mountMarkedRef.current = true;
    try {
      if (record !== false && AppLaunchStagesManager.isFeatureEnabled()) {
        AppLaunchStagesManager.markMounted(nowMicros());
      }
    } catch (error) {
      Logger.error(TAG, 'markMounted failed', {
        message: (error as Error)?.message,
        name: (error as Error)?.name,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View {...viewProps} onLayout={onLayout}>
      {children}
    </View>
  );
}
