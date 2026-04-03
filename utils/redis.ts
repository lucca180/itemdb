import { Redis as RedisRaw } from 'ioredis';
import { NextApiRequest } from 'next/types';
import {
  generateSessionToken,
  normalizeIP,
  verifySessionToken,
  verifySiteProof,
} from './api-utils';
import jwt from 'jsonwebtoken';

const API_CONST = {
  MIN_LIMIT_COUNT: 5000, // maximum items allowed before banning
  LOGGED_LIMIT: 10000, // above but for logged users
  SESSION_EXPIRE: 7 * 24 * 60 * 60, // how many seconds before session expires for non-logged users
  SESSION_EXPIRE_LOGGED: 24 * 24 * 60 * 60, // same but for logged users
  INITIAL_BAN_SECONDS: 5 * 60, // how many seconds the first ban should last
  MAX_BAN_SECONDS: 2 * 60 * 60, // maximum ban duration in seconds
  BAN_COUNT_RESET_DAYS: 7, // after how many days the ban count should reset
} as const;

export const API_ERROR_CODES = {
  noRedis: 'no-redis',
  invalidKey: 'invalid-key',
  limitExceeded: 'limit-exceeded',
} as const;

export let redis: RedisRaw;

if (
  process.env.NODE_ENV !== 'development' &&
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

export const redis_setItemCount = async (
  ip: string | null | undefined,
  itemCount: number,
  req: NextApiRequest
) => {
  try {
    if (!ip || !itemCount || !redis) return;

    const isValidProof = req.headers['x-itemdb-proof'] as string | undefined;

    if (isValidProof && verifySiteProof(isValidProof)) return;

    if (req.headers['x-itemdb-token'])
      return incrementApiKey(req.headers['x-itemdb-token'] as string, itemCount);

    let limit = API_CONST.MIN_LIMIT_COUNT as number;

    const sessionCookie =
      req.cookies['idb-session-id'] || (req.cookies as any)?.get?.('idb-session-id');

    if (sessionCookie) {
      const sessionToken = sessionCookie.value ?? sessionCookie;
      const sessionData = verifySessionToken(sessionToken);

      if (sessionData && sessionData.limit) {
        limit = Math.max(sessionData.limit, limit);
      }
    }

    ip = normalizeIP(ip);

    if (!ip) return;

    const newVal = await redis.incrby(ip, itemCount);

    if (newVal >= limit) {
      const isBanned = await redis.get(`ban:${ip}`);
      if (isBanned) return;

      const banCount = (await redis.get(`bCount:${ip}`)) || '1';

      const base = Number(banCount) ** 2 * API_CONST.INITIAL_BAN_SECONDS;
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

  const newVal = await redis.incrby(`apiKey:${keyId}`, incrementBy);
  await redis.expire(`apiKey:${keyId}`, 60 * 60);

  if (limit === -1) return; // unlimited key

  if (limit && newVal >= limit) {
    await redis.expire(`apiKey:${keyId}`, 120 * 60);
    // it doesn't really matter what we return here...
    // throw API_ERROR_CODES.limitExceeded;
  }

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
