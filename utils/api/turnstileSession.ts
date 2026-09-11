import { getCookie } from 'cookies-next/client';
import axios from 'axios';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TOKEN_TIMEOUT_MS = 30_000;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      appearance?: 'always' | 'execute' | 'interaction-only';
      theme?: 'auto' | 'light' | 'dark';
      action?: string;
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      'timeout-callback'?: () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('turnstile-ssr'));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  const pending = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
    );

    const onLoad = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }
      reject(new Error('turnstile-missing'));
    };

    if (existing) {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', () => reject(new Error('turnstile-script')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', () => reject(new Error('turnstile-script')), {
      once: true,
    });
    document.head.appendChild(script);
  });

  scriptPromise = pending;
  return pending.catch((error: unknown): never => {
    if (scriptPromise === pending) scriptPromise = null;
    throw error;
  });
}

async function getTurnstileToken(siteKey: string): Promise<string> {
  const turnstile = await loadTurnstile();
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647';
  document.body.appendChild(host);

  return new Promise((resolve, reject) => {
    let widgetId: string | undefined;
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('turnstile-timeout'));
    }, TOKEN_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      if (widgetId !== undefined) {
        try {
          turnstile.remove(widgetId);
        } catch {}
      }
      host.remove();
    };

    try {
      widgetId = turnstile.render(host, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        theme: 'auto',
        action: 'get-session',
        callback: (token) => {
          cleanup();
          resolve(token);
        },
        'error-callback': () => {
          cleanup();
          reject(new Error('turnstile-error'));
        },
        'timeout-callback': () => {
          cleanup();
          reject(new Error('turnstile-timeout'));
        },
      });
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

let bootstrapPromise: Promise<void> | null = null;

/** Issues `idb-session-id` after a Turnstile token (skipped in local/dev without a site key). */
export function bootstrapApiSession(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!navigator.cookieEnabled) return Promise.resolve();
  if (getCookie('idb-session-exp')) return Promise.resolve();
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const body: { token?: string } = {};

    if (siteKey && process.env.NODE_ENV === 'production') {
      body.token = await getTurnstileToken(siteKey);
    }

    await axios.post('/api/v1/users/getSession', body);
  })().catch((error) => {
    bootstrapPromise = null;
    throw error;
  });

  return bootstrapPromise;
}
