'use client';

import { useEffect } from 'react';

// Umami loads with `lazyOnload`, so it may not exist yet when this mounts.
const UMAMI_RETRY_MS = 500;
const UMAMI_MAX_RETRIES = 20;

// last value sent in this page load, so remounts and client navigations don't resend it
let lastSent: boolean | undefined;

type UmamiSessionDataProps = {
  /** `undefined` while auth is still resolving. */
  loggedIn: boolean | undefined;
};

/**
 * Saves anonymous session data in Umami so reports can be segmented by logged-in state.
 *
 * `umami.identify` gets only a data object without an `id` key, so no Distinct ID is set and
 * sessions stay anonymous. Never add `id` or anything else that identifies the user here.
 */
export function UmamiSessionData({ loggedIn }: UmamiSessionDataProps) {
  useEffect(() => {
    if (loggedIn === undefined || loggedIn === lastSent) return;

    let timeout: ReturnType<typeof setTimeout>;
    const send = (retries: number) => {
      if (window.umami) {
        lastSent = loggedIn;
        return void window.umami.identify({ loggedIn });
      }
      if (retries > 0) timeout = setTimeout(() => send(retries - 1), UMAMI_RETRY_MS);
    };

    send(UMAMI_MAX_RETRIES);
    return () => clearTimeout(timeout);
  }, [loggedIn]);

  return null;
}
