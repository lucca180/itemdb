import { getCookie } from 'cookies-next/client';

const SESSION_EXP_COOKIE = 'idb-session-exp';

let settled = false;
let resolveGate: (() => void) | null = null;
let gatePromise: Promise<void> | null = null;

function ensureGate() {
  if (!gatePromise) {
    gatePromise = new Promise<void>((resolve) => {
      resolveGate = resolve;
    });
  }
  return gatePromise;
}

/** Call after getSession succeeds, is skipped (cookie present), or fails. */
export function notifyApiSessionSettled() {
  if (settled) return;
  settled = true;
  resolveGate?.();
  resolveGate = null;
}

/**
 * Resolves once the API rate-limit session is ready (or bootstrap was attempted).
 * Safe to call from axios interceptors — getSession itself must not await this.
 */
export function waitForApiSession(): Promise<void> {
  if (typeof window === 'undefined' || settled) return Promise.resolve();

  if (getCookie(SESSION_EXP_COOKIE)) {
    notifyApiSessionSettled();
    return Promise.resolve();
  }

  return ensureGate();
}

export function hasApiSessionCookie() {
  if (typeof window === 'undefined') return false;
  return !!getCookie(SESSION_EXP_COOKIE);
}
