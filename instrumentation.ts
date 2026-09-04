import * as Sentry from '@sentry/nextjs';

const ignoreErrors = [
  'MaxListenersExceededWarning',
  // Stale hashed assets after deploy (ITEMDB-7XS)
  "The requested resource isn't a valid image",
  // Redis Cache Components command timeout (ITEMDB-7RN)
  'The command was aborted',
];

function stringifyConsoleArg(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value) {
    return String((value as { message: unknown }).message);
  }
  return '';
}

/** captureConsoleIntegration stores args in extra; ignoreErrors may miss those. */
function beforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  const extraArgs = event.extra?.arguments;
  const haystack = [
    event.message ?? '',
    ...(Array.isArray(extraArgs) ? extraArgs.map(stringifyConsoleArg) : []),
  ].join(' ');

  if (
    haystack.includes("The requested resource isn't a valid image") ||
    haystack.includes('The command was aborted')
  ) {
    return null;
  }

  return event;
}

export function register() {
  const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) return;
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      Sentry.init({
        dsn:
          SENTRY_DSN ||
          'https://d093bca7709346a6a45966764e1b1988@o1042114.ingest.us.sentry.io/4504761196216321',
        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: 0.12,
        profilesSampleRate: 0.12,
        ignoreErrors,
        beforeSend,
        integrations: [
          Sentry.prismaIntegration(),
          Sentry.captureConsoleIntegration({
            // array of methods that should be captured
            // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
            levels: ['error'],
          }),
        ],
      });
    } else {
      Sentry.init({
        dsn:
          SENTRY_DSN ||
          'https://d093bca7709346a6a45966764e1b1988@o1042114.ingest.us.sentry.io/4504761196216321',
        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: 0.12,
        profilesSampleRate: 0.12,
        ignoreErrors,
        beforeSend,
        integrations: [
          Sentry.captureConsoleIntegration({
            // array of methods that should be captured
            // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
            levels: ['error'],
          }),
        ],
      });
    }
  } catch (error) {
    console.error('Error initializing Sentry:', error);
  }
}

export const onRequestError = Sentry.captureRequestError;
