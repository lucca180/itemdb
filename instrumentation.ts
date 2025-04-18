import * as Sentry from '@sentry/nextjs';

export function register() {
  const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) return;

  Sentry.init({
    dsn:
      SENTRY_DSN ||
      'https://d093bca7709346a6a45966764e1b1988@o1042114.ingest.us.sentry.io/4504761196216321',
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.3,
    profilesSampleRate: 0.5,
    integrations: [
      // Sentry.captureConsoleIntegration({
      //   // array of methods that should be captured
      //   // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
      //   levels: ['error', 'warn'],
      // }),
    ],
  });
}

export const onRequestError = Sentry.captureRequestError;
