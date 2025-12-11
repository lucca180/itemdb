// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  Sentry.init({
    dsn:
      SENTRY_DSN ||
      'https://d093bca7709346a6a45966764e1b1988@o1042114.ingest.us.sentry.io/4504761196216321',
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.2,
    profileSessionSampleRate: 0.2,
    // ...
    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
