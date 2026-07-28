import { normalizeIP } from '@utils/api/api-utils';
import { redis } from '@utils/api/redis';

export const LOGIN_RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_SECONDS: 15 * 60,
} as const;

export type LoginRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const keyForIp = (ip: string) => `loginrl:${ip}`;

/**
 * Consumes one login/sendLink attempt for the given IP.
 * Fail-open when Redis is unavailable or IP is missing (e.g. local dev).
 */
export async function consumeLoginRateLimit(
  ip: string | null | undefined
): Promise<LoginRateLimitResult> {
  const unlimited: LoginRateLimitResult = {
    allowed: true,
    remaining: LOGIN_RATE_LIMIT.MAX_ATTEMPTS,
    retryAfterSeconds: LOGIN_RATE_LIMIT.WINDOW_SECONDS,
  };

  if (!redis || !ip) return unlimited;

  const normalized = normalizeIP(ip);
  if (!normalized) return unlimited;

  const key = keyForIp(normalized);

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, LOGIN_RATE_LIMIT.WINDOW_SECONDS);
    }

    const ttl = await redis.ttl(key);
    const retryAfterSeconds = ttl > 0 ? ttl : LOGIN_RATE_LIMIT.WINDOW_SECONDS;
    const remaining = Math.max(0, LOGIN_RATE_LIMIT.MAX_ATTEMPTS - count);

    return {
      allowed: count <= LOGIN_RATE_LIMIT.MAX_ATTEMPTS,
      remaining,
      retryAfterSeconds,
    };
  } catch (e) {
    console.error('login rate limit error', e);
    return unlimited;
  }
}
