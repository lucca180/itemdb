import * as Sentry from '@sentry/nextjs';
import type { TransactionEvent } from '@sentry/core';
import { getMariaDbPoolStats } from '@utils/mariadbAdapter';

function attachMariaDbPoolToTransaction(
  event: TransactionEvent
  // _hint: EventHint
): TransactionEvent {
  const hasDbSpan = event.spans?.some((span) => span.op === 'db');
  if (!hasDbSpan) return event;

  const pool = getMariaDbPoolStats();
  if (!pool) return event;

  event.contexts = {
    ...event.contexts,
    mariadb_pool: {
      ...pool,
      summary: `${pool.active} active ${pool.queued} queued ${pool.max} max`,
    },
  };
  event.tags = {
    ...event.tags,
    'mariadb.pool.active': String(pool.active),
    'mariadb.pool.idle': String(pool.idle),
    'mariadb.pool.queued': String(pool.queued),
    'mariadb.pool.total': String(pool.total),
    'mariadb.pool.max': String(pool.max),
  };

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
        integrations: [
          Sentry.prismaIntegration(),
          Sentry.captureConsoleIntegration({
            // array of methods that should be captured
            // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
            levels: ['error'],
          }),
        ],
        beforeSendTransaction: attachMariaDbPoolToTransaction,
      });
    } else {
      Sentry.init({
        dsn:
          SENTRY_DSN ||
          'https://d093bca7709346a6a45966764e1b1988@o1042114.ingest.us.sentry.io/4504761196216321',
        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: 0.12,
        profilesSampleRate: 0.12,
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
