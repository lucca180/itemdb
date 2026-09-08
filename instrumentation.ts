import * as Sentry from '@sentry/nextjs';

const DEFAULT_TRACE_RATE = 0.12;

/** Cache Components handler (node-redis). Leaves ioredis `redis-get` / `redis-set` alone. */
const IGNORE_CACHE_REDIS = [/^(HDEL|HSET|HSCAN|PUBLISH|SUBSCRIBE|UNLINK|SCAN)\b/i];

const ignoreErrors = [
  'MaxListenersExceededWarning',
  "The requested resource isn't a valid image",
  'The command was aborted',
];

function tracesSampler({
  name,
  parentSampled,
  normalizedRequest,
}: {
  name?: string;
  parentSampled?: boolean;
  normalizedRequest?: { headers?: Record<string, string> };
}) {
  if (name && IGNORE_CACHE_REDIS[0].test(name)) return 0;
  if (typeof parentSampled === 'boolean') return parentSampled;
  const headers = normalizedRequest?.headers;
  if (headers?.['x-itemdb-token'] || headers?.['X-Itemdb-Token']) return 1;
  return DEFAULT_TRACE_RATE;
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
        tracesSampler,
        profilesSampleRate: DEFAULT_TRACE_RATE,
        ignoreSpans: IGNORE_CACHE_REDIS,
        ignoreTransactions: IGNORE_CACHE_REDIS,
        ignoreErrors,
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
        tracesSampler,
        profilesSampleRate: DEFAULT_TRACE_RATE,
        ignoreSpans: IGNORE_CACHE_REDIS,
        ignoreTransactions: IGNORE_CACHE_REDIS,
        ignoreErrors,
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
