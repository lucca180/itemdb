import 'server-only';

import { cookies, headers } from 'next/headers';
import { after } from 'next/server';
import { normalizeIP } from '@utils/api/api-utils';
import { getClientIp } from '@utils/api/clientIp';
import {
  API_ERROR_CODES,
  checkBan,
  countItems,
  getBanTTL,
  withRedisTimeout,
} from '@utils/api/redis';

export type ActionRateLimited = { ok: false; reason: 'rate_limited'; retryAfter: number };

async function isBanned(ip: string) {
  try {
    await checkBan(ip);
    return false;
  } catch (e) {
    if (e === API_ERROR_CODES.limitExceeded) return true;
    throw e;
  }
}

/**
 * Item quota for server actions: same per-IP counter and ban as the API routes (`redis_setDataCount`
 * / `trackItemQuota`), since actions never go through `apiMiddleware`.
 * Actions are not public API, so `x-itemdb-token` is never read here.
 */
export async function withActionQuota<T>(
  load: () => Promise<T>,
  countResult: (result: T) => number
): Promise<T | ActionRateLimited> {
  const clientIp = getClientIp(await headers());
  const ip = clientIp ? normalizeIP(clientIp) : null;

  // fail-open when Redis is slow or down
  if (ip && (await withRedisTimeout(isBanned(ip)))) {
    const retryAfter = (await withRedisTimeout(getBanTTL(ip))) ?? 0;
    return { ok: false, reason: 'rate_limited', retryAfter };
  }

  const sessionCookie = (await cookies()).get('idb-session-id')?.value;
  const result = await load();

  after(() => countItems(ip, countResult(result), { sessionCookie }));

  return result;
}
