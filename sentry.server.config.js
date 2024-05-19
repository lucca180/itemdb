// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

const isProd = process.env.NODE_ENV === 'production';
if (isProd)
  Sentry.init({
    dsn:
      SENTRY_DSN ||
      'https://d093bca7709346a6a45966764e1b1988@o1042114.ingest.sentry.io/4504761196216321',
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,
    integrations: [
      Sentry.captureConsoleIntegration({
        // array of methods that should be captured
        // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
        levels: ['error', 'warn'],
      }),
    ],
  });
