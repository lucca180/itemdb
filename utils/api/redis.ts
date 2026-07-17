import { Redis as RedisRaw } from 'ioredis';
import { NextApiRequest } from 'next/types';
import { NextRequest } from 'next/server';
import {
  generateSessionToken,
  normalizeIP,
  verifySessionToken,
  verifySiteProof,
} from './api-utils';
import jwt from 'jsonwebtoken';
import requestIp from 'request-ip';

const API_CONST = {
  MIN_LIMIT_COUNT: 5000, // maximum items allowed before banning
  LOGGED_LIMIT: 10000, // above but for logged users
  SESSION_EXPIRE: 7 * 24 * 60 * 60, // how many seconds before session expires for non-logged users
  SESSION_EXPIRE_LOGGED: 24 * 24 * 60 * 60, // same but for logged users
  INITIAL_BAN_SECONDS: 5 * 60, // how many seconds the first ban should last
  MAX_BAN_SECONDS: 3 * 60 * 60, // maximum ban duration in seconds
  BAN_COUNT_RESET_DAYS: 5, // after how many days the ban count should reset
} as const;

export const API_ERROR_CODES = {
  noRedis: 'no-redis',
  invalidKey: 'invalid-key',
  limitExceeded: 'limit-exceeded',
} as const;

// Next.js may bundle this module into separate server chunks; globalThis keeps
// one ioredis connection per logical DB per process (same pattern as prisma.ts).
const globalForRedis = globalThis as unknown as {
  redis: RedisRaw | undefined;
  redisCache: RedisRaw | undefined;
};

const redisOpts =
  process.env.NODE_ENV !== 'development' &&
  process.env.REDIS_PORT &&
  process.env.REDIS_HOST &&
  process.env.REDIS_PASSWORD
    ? {
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        enableAutoPipelining: true,
      }
    : null;

export const redis =
  globalForRedis.redis ??
  (redisOpts ? (globalForRedis.redis = new RedisRaw(redisOpts)) : undefined);

/** ItemV2 HTTP cache — same Redis host, logical DB 1 (rate limit stays on DB 0). */
export const redisCache =
  globalForRedis.redisCache ??
  (redisOpts ? (globalForRedis.redisCache = new RedisRaw({ ...redisOpts, db: 1 })) : undefined);

export const createSession = (logged = false) => {
  const { LOGGED_LIMIT, MIN_LIMIT_COUNT, SESSION_EXPIRE, SESSION_EXPIRE_LOGGED } = API_CONST;

  const limit = logged ? LOGGED_LIMIT : MIN_LIMIT_COUNT;
  const expires = logged ? SESSION_EXPIRE_LOGGED : SESSION_EXPIRE;

  const session = generateSessionToken(limit, expires);

  return {
    session: session,
    expires: expires,
    limit: limit,
  };
};

export const checkSession = (sessionToken: string) => {
  const payload = verifySessionToken(sessionToken);
  if (!payload || !payload.sub) return false;

  return payload.sub;
};

export const checkBan = async (ip?: string) => {
  if (!redis) return;
  ip = ip ? normalizeIP(ip) : undefined;
  if (!ip) return;
  const isBanned = await redis.get(`ban:${ip}`);

  if (isBanned) throw API_ERROR_CODES.limitExceeded;

  return;
};

export const getBanTTL = async (ip: string) => {
  if (!redis) return 0;
  const ttl = await redis.ttl(`ban:${ip}`);
  return ttl > 0 ? ttl : 0;
};

/** v1 Pages Router entry — increments the per-IP / API-key item quota. */
export const redis_setDataCount = async (count: number, req: NextApiRequest) => {
  const ip = requestIp.getClientIp(req);
  return redis_setItemCount(ip, count, req);
};

/**
 * v2 App Router quota entry (same rules as `redis_setDataCount`).
 * Call only for Prisma-backed items — cache hits should pass count=0 / skip.
 */
export async function trackItemQuota(count: number, request: NextRequest): Promise<void> {
  // Same extraction as `proxy.ts` for App Router / Edge requests.
  const ip =
    requestIp.getClientIp(request as any) ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    null;

  return redis_setItemCount(ip, count, request);
}

function pathnameFromUrl(url: string | undefined): string {
  if (!url) return '/';
  try {
    return new URL(url, 'https://itemdb.com.br').pathname;
  } catch {
    return url.split('?')[0] || '/';
  }
}

/** `NextRequest` (App Router / Edge) already parses headers/cookies/URL — `NextApiRequest` (Pages) hasn't. */
function isNextRequest(req: NextApiRequest | NextRequest): req is NextRequest {
  return req.headers instanceof Headers;
}

export const redis_setItemCount = async (
  ip: string | null | undefined,
  itemCount: number,
  req: NextApiRequest | NextRequest
) => {
  try {
    if (!ip || !itemCount || !redis) return;

    const edge = isNextRequest(req);
    const pathname = edge ? req.nextUrl.pathname : pathnameFromUrl(req.url);
    const itemdbProof = edge
      ? (req.headers.get('x-itemdb-proof') ?? undefined)
      : firstHeaderValue(req.headers['x-itemdb-proof']);

    const isValidProof =
      itemdbProof &&
      verifySiteProof(itemdbProof, 0, {
        method: req.method,
        pathname,
      });

    if (isValidProof) return;

    const apiToken = edge
      ? (req.headers.get('x-itemdb-token') ?? undefined)
      : firstHeaderValue(req.headers['x-itemdb-token']);
    if (apiToken) return incrementApiKey(apiToken, itemCount);

    let limit = API_CONST.MIN_LIMIT_COUNT as number;

    const sessionCookie = edge
      ? req.cookies.get('idb-session-id')?.value
      : req.cookies['idb-session-id'];

    ip = normalizeIP(ip);

    if (!ip) return;
    const banCount = Number((await redis.get(`bCount:${ip}`)) || '0');

    if (sessionCookie) {
      const sessionData = verifySessionToken(sessionCookie);

      if (sessionData && sessionData.limit) {
        limit = Math.max(sessionData.limit, limit);
      }

      // reduce limit based on ban count
      if (banCount > 0) {
        const ratio = Math.max(0.4, 1 - (banCount / 13) ** 2);
        limit = Math.max(Math.floor(limit * ratio), 1);
      }
    }

    const newVal = await redis.incrby(ip, itemCount);

    if (newVal >= limit) {
      const isBanned = await redis.get(`ban:${ip}`);
      if (isBanned) return;

      const base = Number(banCount + 1) ** 2 * API_CONST.INITIAL_BAN_SECONDS;
      const jitter = Math.floor(base * (0.8 + Math.random() * 0.4));

      const ttl = Math.min(jitter, API_CONST.MAX_BAN_SECONDS);

      await redis
        .multi()
        .set(`ban:${ip}`, newVal, 'EX', ttl)
        .incr(`bCount:${ip}`)
        .expire(`bCount:${ip}`, API_CONST.BAN_COUNT_RESET_DAYS * 24 * 60 * 60)
        .expire(ip, Math.min(ttl, 30 * 60))
        .exec();

      return;
    }

    await redis.expire(ip, 30 * 60);
  } catch (e) {
    console.error('redis_setItemCount error', e);
  }
};

// ------- api token ------- //

export const checkApiToken = async (token: string) => {
  if (!redis) throw API_ERROR_CODES.noRedis;
  if (!token) throw API_ERROR_CODES.invalidKey;

  // we already validated the token in middleware,
  // so we can just decode it here
  const payload = jwt.decode(token) as jwt.JwtPayload | null;

  if (!payload || !payload.sub || payload.limit === undefined || payload.limit === null)
    throw API_ERROR_CODES.invalidKey;

  const keyId = payload.sub;
  const limit = Number(payload.limit);

  if (Number.isNaN(limit)) throw API_ERROR_CODES.invalidKey;

  if (limit === -1) return true; // unlimited key

  const keyData = await redis.get(`apiKey:${keyId}`);

  if (keyData && !isNaN(Number(keyData))) {
    if (Number(keyData) >= limit) {
      throw API_ERROR_CODES.limitExceeded;
    }

    return true;
  }

  await redis.set(`apiKey:${keyId}`, 0, 'EX', 30 * 60);

  return true;
};

const incrementApiKey = async (token: string | null | undefined, incrementBy: number) => {
  if (!token || !redis) return;

  const payload = jwt.decode(token) as jwt.JwtPayload | null;
  if (!payload || !payload.sub || payload.limit === undefined || payload.limit === null) {
    throw API_ERROR_CODES.invalidKey;
  }
  const keyId = payload.sub;
  const limit = Number(payload.limit);

  if (Number.isNaN(limit)) {
    throw API_ERROR_CODES.invalidKey;
  }

  await redis
    .multi()
    .incrby(`apiKey:${keyId}`, incrementBy)
    .expire(`apiKey:${keyId}`, 120 * 60)
    .exec();

  return;
};

export const getKeyTTL = async (token: string) => {
  if (!token || !redis) return 0;
  const payload = jwt.decode(token) as jwt.JwtPayload | null;
  if (!payload || !payload.sub) return 0;
  const keyId = payload.sub;
  const ttl = await redis.ttl(`apiKey:${keyId}`);
  return ttl > 0 ? ttl : 0;
};

/** `NextApiRequest` headers can be a single value or an array (multi-value headers). */
function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
