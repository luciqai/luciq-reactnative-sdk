import type { Action, Middleware } from 'redux';

import { addCompletedCustomSpan } from './APM';
import { logUserEvent } from './Luciq';
import { Logger } from '../utils/logger';
import { LuciqDebugTags } from '../constants/DebugTags';

const TAG = LuciqDebugTags.APM_REDUX;

/**
 * Options for {@link createLuciqReduxMiddleware}.
 */
export interface LuciqReduxMiddlewareOptions {
  /**
   * Prefix used for span and breadcrumb names. Default `'Redux'`.
   * The final name is `"<prefix>: <action.type>"`.
   */
  namePrefix?: string;
  /**
   * Record an APM custom span per dispatch measuring its duration. Default `true`.
   */
  spans?: boolean;
  /**
   * Log a breadcrumb (user event) per dispatch carrying the action type and the
   * serialized payload size. Default `true`.
   *
   * Only the byte size of the action is captured, never its contents, so no
   * payload data leaves the device.
   */
  breadcrumbs?: boolean;
  /**
   * For async thunk dispatches that return a Promise, measure the full async
   * duration (until the Promise settles) instead of the synchronous portion.
   * Default `true`.
   */
  trackAsyncThunks?: boolean;
  /**
   * Return `false` to skip tracking a specific action. Useful for filtering out
   * noisy or high-frequency actions. Defaults to tracking every action.
   */
  actionFilter?: (action: Action) => boolean;
}

/**
 * An action is trackable only when it is a plain object with a string `type`.
 * Thunks (functions) and malformed actions are passed through untouched.
 */
const isTrackableAction = (action: unknown): action is Action => {
  return (
    typeof action === 'object' &&
    action !== null &&
    typeof (action as Action).type === 'string' &&
    (action as Action).type !== ''
  );
};

const isThenable = (value: unknown): value is Promise<unknown> => {
  return (
    value != null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as Promise<unknown>).then === 'function'
  );
};

/**
 * Best-effort serialized byte size of an action. Returns `null` if the action
 * cannot be serialized (e.g. circular references), in which case size is omitted.
 */
const getPayloadSize = (action: Action): number | null => {
  try {
    return JSON.stringify(action)?.length ?? null;
  } catch {
    return null;
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }
  return `${Math.round(bytes / (1024 * 1024))}MB`;
};

/**
 * Creates a Redux middleware that automatically tracks dispatched actions.
 *
 * For every dispatched action with a string `type`, the middleware:
 * - Records an APM custom span named `"<prefix>: <action.type>"` measuring the
 *   dispatch duration (for async thunks, the full async duration).
 * - Logs a breadcrumb with the action type and serialized payload size so state
 *   changes can be correlated with crashes (e.g. "crash after CHECKOUT_SUBMIT
 *   with a 500KB payload").
 *
 * Only the byte size of the payload is captured, never its contents. The
 * middleware never throws into the dispatch chain: tracking failures are logged
 * and the original action result is always returned.
 *
 * @param options - {@link LuciqReduxMiddlewareOptions} to customize behavior.
 * @returns A Redux-compatible middleware.
 *
 * @example
 * ```typescript
 * import { configureStore } from '@reduxjs/toolkit';
 * import * as Luciq from '@luciq/react-native';
 *
 * const store = configureStore({
 *   reducer,
 *   middleware: (getDefault) => getDefault().concat(Luciq.createLuciqReduxMiddleware()),
 * });
 * ```
 */
export const createLuciqReduxMiddleware = (
  options: LuciqReduxMiddlewareOptions = {},
): Middleware => {
  const {
    namePrefix = 'Redux',
    spans = true,
    breadcrumbs = true,
    trackAsyncThunks = true,
    actionFilter,
  } = options;

  Logger.debug(TAG, 'createLuciqReduxMiddleware', {
    namePrefix,
    spans,
    breadcrumbs,
    trackAsyncThunks,
    hasFilter: typeof actionFilter === 'function',
  });

  const finalize = (action: Action, start: Date, end: Date): void => {
    try {
      const actionType = action.type as string;
      const spanName = `${namePrefix}: ${actionType}`;

      if (breadcrumbs) {
        const size = getPayloadSize(action);
        const eventName = size != null ? `${spanName} (${formatBytes(size)})` : spanName;
        logUserEvent(eventName);
      }

      if (spans) {
        // addCompletedCustomSpan requires end > start; instantaneous synchronous
        // dispatches resolve to the same millisecond, so guarantee a 1ms minimum.
        const safeEnd = end.getTime() > start.getTime() ? end : new Date(start.getTime() + 1);
        addCompletedCustomSpan(spanName, start, safeEnd).catch((error) => {
          Logger.error(TAG, 'addCompletedCustomSpan failed', {
            message: (error as Error)?.message,
            name: (error as Error)?.name,
          });
        });
      }
    } catch (error) {
      Logger.error(TAG, 'finalize failed', {
        message: (error as Error)?.message,
        name: (error as Error)?.name,
      });
    }
  };

  return () => (next) => (action) => {
    let shouldTrack = false;
    try {
      shouldTrack = isTrackableAction(action) && (!actionFilter || actionFilter(action) !== false);
    } catch (error) {
      Logger.error(TAG, 'actionFilter failed', {
        message: (error as Error)?.message,
        name: (error as Error)?.name,
      });
      shouldTrack = false;
    }

    if (!shouldTrack) {
      return next(action);
    }

    const trackedAction = action as Action;
    const start = new Date();
    let result: unknown;
    try {
      result = next(action);
    } catch (error) {
      // Dispatch threw: record the span up to the failure point, then rethrow.
      finalize(trackedAction, start, new Date());
      throw error;
    }

    if (trackAsyncThunks && isThenable(result)) {
      const settle = () => finalize(trackedAction, start, new Date());
      result.then(settle, settle);
    } else {
      finalize(trackedAction, start, new Date());
    }

    return result;
  };
};
