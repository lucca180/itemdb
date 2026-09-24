import { useSyncExternalStore } from 'react';

const REFRESH_MS = 60_000;

let clientNow: number | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  clientNow = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    // First subscriber after an idle period: refresh so remounts don't reuse an old value.
    clientNow = Date.now();
    timer = setInterval(tick, REFRESH_MS);
  }

  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return (clientNow ??= Date.now());
}

function getServerSnapshot() {
  return null;
}

/**
 * Wall-clock for time-derived UI (stale badges, discounts, restock profit) in Client Components.
 * `null` on the server and during hydration, so SSR/prerenders never read the clock (which aborts
 * the surrounding boundary under Cache Components); the real value arrives right after hydration.
 * Shared by every consumer and refreshed once a minute.
 */
export function useClientNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
