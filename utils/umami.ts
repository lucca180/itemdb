// Umami loads with `lazyOnload`, so events fired right after page load may run before it exists.
const UMAMI_RETRY_MS = 500;
const UMAMI_MAX_RETRIES = 20;

/**
 * Tracks an Umami event, retrying for a few seconds while the tracker is still loading.
 * Never pass personal data (emails, usernames, tokens) in `data`.
 */
export function trackEventWhenReady(
  event: string,
  data?: Record<string, string | number | boolean>,
  retries = UMAMI_MAX_RETRIES
) {
  if (typeof window === 'undefined') return;
  if (window.umami) return void window.umami.track(event, data);
  if (retries > 0) setTimeout(() => trackEventWhenReady(event, data, retries - 1), UMAMI_RETRY_MS);
}
