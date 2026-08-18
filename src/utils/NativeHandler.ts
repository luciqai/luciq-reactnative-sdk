import type { NativeEventEmitter } from 'react-native';

/**
 * @internal
 * Makes `listener` the sole JS listener for `eventName`, or tears the handler
 * down entirely when `listener` is `null`/`undefined`.
 *
 * Previous listeners are always removed first, so re-registering a handler
 * replaces it instead of stacking a second one that also fires.
 */
export const setNativeHandler = <T>(
  emitter: NativeEventEmitter,
  eventName: string,
  listener: ((payload: T) => void) | null | undefined,
  native: { set: () => void; unset: () => void },
) => {
  emitter.removeAllListeners(eventName);

  if (listener == null) {
    native.unset();
    return;
  }

  emitter.addListener(eventName, listener);
  native.set();
};
