import type { ActionRateLimited } from '@utils/api/actionQuota';

export class SeenHistoryRateLimitError extends Error {
  constructor(public retryAfter: number) {
    super('Seen history rate limited');
  }
}

/** SWR caches whatever the fetcher returns: throw on `rate_limited` so it stays an error. */
export async function unwrapRateLimit<T extends { ok: boolean }>(
  request: Promise<T | ActionRateLimited>
): Promise<T> {
  const result = await request;
  if (!result.ok && 'reason' in result) throw new SeenHistoryRateLimitError(result.retryAfter);
  return result as T;
}

/** The ban outlives any retry, so don't spend requests on it. */
export const SEEN_HISTORY_SWR_OPTIONS = {
  shouldRetryOnError: (error: unknown) => !(error instanceof SeenHistoryRateLimitError),
};

/** Gated data (contribute wall) is only re-checked when the modal is reopened. */
export const GATED_SWR_OPTIONS = {
  ...SEEN_HISTORY_SWR_OPTIONS,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};
