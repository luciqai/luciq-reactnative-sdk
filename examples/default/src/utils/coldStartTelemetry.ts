/**
 * Telemetry for the Android cold-start JS-interceptor race repro
 * (INSD-14886 / Discogs).
 *
 * On Android, before the fix in src/modules/Luciq.ts, the JS XHR interceptor
 * was only enabled when the native `LCQ_ON_FEATURES_UPDATED_CALLBACK` event
 * arrived. Any HTTP requests fired between `Luciq.init()` returning and that
 * async callback firing would bypass the interceptor and never reach APM
 * (BR/SR still see them via the native auto-instrumented HTTP interceptor).
 *
 * This module records the URLs fired during the simulated cold-start burst
 * and the URLs that were captured by the obfuscation handler (which only
 * fires for requests the JS interceptor saw). The reproduction screen
 * subscribes to the telemetry and surfaces fired vs captured counts.
 */

export type ColdStartEntry = {
  url: string;
  firedAt: number;
  capturedAt: number | null;
};

type Listener = (entries: ColdStartEntry[]) => void;

let entries: ColdStartEntry[] = [];
const listeners = new Set<Listener>();

function notify() {
  const snapshot = entries.slice();
  listeners.forEach((l) => l(snapshot));
}

export const ColdStartTelemetry = {
  recordFired(url: string) {
    entries.push({ url, firedAt: Date.now(), capturedAt: null });
    notify();
  },

  recordCaptured(url: string) {
    // Match the earliest fired entry for this URL that hasn't been marked
    // captured yet. This handles duplicate URLs being fired in a burst.
    const target = entries.find((e) => e.url === url && e.capturedAt === null);
    if (target) {
      target.capturedAt = Date.now();
      notify();
    }
  },

  reset() {
    entries = [];
    notify();
  },

  snapshot(): ColdStartEntry[] {
    return entries.slice();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/**
 * URLs that mimic the Discogs cold-start REST burst: identity, settings,
 * user data, content feeds — the kind of calls a real app fires immediately
 * after init while the user is still on the splash screen.
 */
export const COLD_START_BURST_URLS = [
  'https://jsonplaceholder.typicode.com/users/1',
  'https://jsonplaceholder.typicode.com/users/2',
  'https://jsonplaceholder.typicode.com/posts/1',
  'https://jsonplaceholder.typicode.com/posts/2',
  'https://jsonplaceholder.typicode.com/comments/1',
  'https://jsonplaceholder.typicode.com/comments/2',
  'https://jsonplaceholder.typicode.com/albums/1',
  'https://jsonplaceholder.typicode.com/todos/1',
];

/**
 * Fires the cold-start burst. Each request is recorded as "fired" in
 * telemetry; the obfuscation handler installed in App.tsx records the
 * matching "captured" entry if the JS interceptor saw it.
 *
 * Errors are swallowed — we only care about whether the interceptor
 * observed the open/send, not whether the request succeeded.
 */
export function fireColdStartBurst(urls: string[] = COLD_START_BURST_URLS) {
  urls.forEach((url) => {
    ColdStartTelemetry.recordFired(url);
    fetch(url).catch(() => {
      // ignore network errors — telemetry tracks interceptor visibility
    });
  });
}

let hasFiredColdStartOnce = false;

/**
 * App.tsx's useEffect has no deps array, so it runs on every render. Wrap
 * the cold-start burst so it only fires once per JS context — otherwise
 * "fired" inflates and stops matching the real cold-start window.
 */
export function fireColdStartBurstOnce(urls?: string[]) {
  if (hasFiredColdStartOnce) {
    return;
  }
  hasFiredColdStartOnce = true;
  fireColdStartBurst(urls);
}
