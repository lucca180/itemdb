/* eslint-disable no-console -- intentional structured timing output */

/**
 * Lightweight request-scoped timing for server loaders and API handlers.
 *
 * ## When to use
 *
 * Wrap slow server paths (loaders, Prisma queries, auth) to see per-step
 * durations in the terminal during development or when explicitly enabled in production.
 *
 * ## Enable / disable
 *
 * - **Development** (`NODE_ENV !== 'production'`): enabled by default.
 * - **Production**: disabled unless `PROFILE_LOADER_TIMING=1` (or `true`) is set.
 * - Force off in dev: `PROFILE_LOADER_TIMING=0`.
 *
 * ## Basic usage
 *
 * ```ts
 * import { createRequestTimer } from '@utils/perf/requestTiming';
 *
 * export async function loadSomething(id: string) {
 *   const timer = createRequestTimer('my-loader', { id });
 *
 *   const user = await timer.measure('auth', () => getCurrentUser());
 *   const rows = await timer.measure('query', () => prisma.item.findMany({ where: { id } }));
 *
 *   timer.flush({ rowCount: rows.length });
 *   return rows;
 * }
 * ```
 *
 * Output (stderr/stdout):
 * `[request-timing] my-loader total=42ms {"id":"abc","rowCount":3} | auth=5ms, query=35ms`
 *
 * ## Nested steps
 *
 * Pass the timer into helpers and wrap their work with `timer.measure(label, fn)`.
 * All steps are recorded in order and included in the final `flush()` summary.
 *
 * ## Server-Timing header
 *
 * Use `toServerTimingHeader(report)` if you need a `Server-Timing` response header
 * (build the report manually or from `timer.steps` + elapsed total).
 *
 * ## Inspecting without logging
 *
 * `createRequestTimer` returns `{ measure, flush, steps }`. Read `steps` after
 * `measure` calls for assertions in tests, or call `logRequestTiming` directly
 * with a custom `RequestTimingReport`.
 */

export type RequestTimingStep = {
  label: string;
  dur: number;
};

export type RequestTimingReport = {
  scope: string;
  context?: Record<string, string | number | boolean | null | undefined>;
  steps: RequestTimingStep[];
  total: number;
};

/** Whether `[request-timing]` logs are emitted. See module doc for env flags. */
export function isProfileLoaderTimingEnabled() {
  const flag = process.env.PROFILE_LOADER_TIMING;

  if (flag === '1' || flag === 'true') return true;
  if (flag === '0' || flag === 'false') return false;

  return process.env.NODE_ENV !== 'production';
}

/**
 * Creates a timer for a single request/loader scope.
 * Call `flush()` once at the end to log the summary (no-op when disabled).
 */
export function createRequestTimer(scope: string, context?: RequestTimingReport['context']) {
  const startedAt = performance.now();
  const steps: RequestTimingStep[] = [];

  const measure = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    const stepStart = performance.now();

    try {
      return await fn();
    } finally {
      steps.push({
        label,
        dur: Math.round(performance.now() - stepStart),
      });
    }
  };

  const flush = (extraContext?: RequestTimingReport['context']) => {
    if (!isProfileLoaderTimingEnabled()) return;

    const report: RequestTimingReport = {
      scope,
      context: extraContext ? { ...context, ...extraContext } : context,
      steps,
      total: Math.round(performance.now() - startedAt),
    };

    logRequestTiming(report);
  };

  return { measure, flush, steps };
}

export function logRequestTiming(report: RequestTimingReport) {
  const contextSuffix = report.context ? ` ${JSON.stringify(report.context)}` : '';

  const stepSummary = report.steps.map((step) => `${step.label}=${step.dur}ms`).join(', ');

  console.info(
    `[request-timing] ${report.scope} total=${report.total}ms${contextSuffix} | ${stepSummary}`
  );
}

export function toServerTimingHeader(report: RequestTimingReport) {
  const parts = report.steps.map((step) => `${step.label};dur=${step.dur}`);
  parts.push(`total;dur=${report.total}`);
  return parts.join(', ');
}
