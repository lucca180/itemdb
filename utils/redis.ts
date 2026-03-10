import { Redis as RedisRaw } from 'ioredis';
import { NextApiRequest } from 'next/types';
import { generateSessionToken, normalizeIP, verifySessionToken } from './api-utils';
import jwt from 'jsonwebtoken';

const LIMIT_COUNT = 10000;
// const LIMIT_COUNT = 1000; ---> new value after new changes
const INITIAL_BAN_MINUTES = 5;

export const SESSION_EXPIRE_LOGGED = 7 * 24 * 60 * 60; // 7 days in seconds
export const SESSION_EXPIRE = 24 * 60 * 60; // 1 day in seconds

export const API_ERROR_CODES = {
  noRedis: 'no-redis',
  invalidKey: 'invalid-key',
  limitExceeded: 'limit-exceeded',
} as const;

export let redis: RedisRaw;

if (
  // process.env.NODE_ENV === 'production' &&
  process.env.REDIS_PORT &&
  process.env.REDIS_HOST &&
  process.env.REDIS_PASSWORD
) {
  redis = new RedisRaw({
    port: Number(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    enableAutoPipelining: true,
  });
}

export const createSession = (logged = false) => {
  const limit = logged ? 10000 : 3000; // ----> change on new version
  const session = generateSessionToken(limit, logged ? SESSION_EXPIRE_LOGGED : SESSION_EXPIRE);

  return {
    session: session,
    expires: logged ? SESSION_EXPIRE_LOGGED : SESSION_EXPIRE,
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

export const redis_setItemCount = async (
  ip: string | null | undefined,
  itemCount: number,
  req: NextApiRequest
) => {
  try {
    if (!ip || !itemCount || !redis) return;

    const isValidProof = req.headers['x-itemdb-valid'] === 'true';

    if (isValidProof) return;

    if (req.headers['x-itemdb-token'])
      return incrementApiKey(req.headers['x-itemdb-token'] as string, itemCount);

    let limit = LIMIT_COUNT;

    const sessionCookie =
      req.cookies['idb-session-id'] || (req.cookies as any)?.get?.('idb-session-id');

    if (sessionCookie) {
      const sessionToken = sessionCookie.value ?? sessionCookie;
      const sessionData = verifySessionToken(sessionToken);

      if (sessionData && sessionData.limit) {
        limit = sessionData.limit;
      }
    }

    ip = normalizeIP(ip);

    if (!ip) return;

    const newVal = await redis.incrby(ip, itemCount);

    if (newVal >= limit) {
      const isBanned = await redis.get(`ban:${ip}`);
      if (isBanned) return;

      const banCount = (await redis.get(`bCount:${ip}`)) || '1';

      const base = Number(banCount) ** 2 * INITIAL_BAN_MINUTES * 60;
      const jitter = Math.floor(base * (0.8 + Math.random() * 0.4));

      const ttl = Math.min(jitter, 2 * 60 * 60); // maximum 2 hours (may change latter)

      await redis.set(`ban:${ip}`, newVal, 'EX', ttl);
      await redis.incr(`bCount:${ip}`);
      await redis.expire(`bCount:${ip}`, 15 * 24 * 60 * 60);
      await redis.expire(ip, Math.min(ttl, 30 * 60));

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

  await redis.set(`apiKey:${keyId}`, 0, 'EX', 24 * 60 * 60);

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

  const newVal = await redis.incrby(`apiKey:${keyId}`, incrementBy);
  await redis.expire(`apiKey:${keyId}`, 30 * 60);

  if (limit === -1) return; // unlimited key

  if (limit && newVal >= limit) {
    throw API_ERROR_CODES.limitExceeded;
  }

  return;
};
