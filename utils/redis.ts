import { Redis as RedisRaw } from 'ioredis';
import { Chance } from 'chance';
import { NextApiRequest } from 'next/types';
import { normalizeIP } from './api-utils';
import jwt from 'jsonwebtoken';

const chance = new Chance();

const LIMIT_COUNT = 20000;
// const LIMIT_COUNT = 1000; ---> new value after new changes
const INITIAL_BAN_MINUTES = 5;
const skipAPIMiddleware =
  process.env.SKIP_API_MIDDLEWARE === 'true' || process.env.NODE_ENV === 'development';

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
    port: process.env.REDIS_PORT as unknown as number,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    enableAutoPipelining: true,
  });
}

export const createSession = async (logged = false) => {
  const newSessionId = chance.guid({ version: 5 });
  await redis.set(
    `guid:${newSessionId}`,
    'true',
    'EX',
    logged ? SESSION_EXPIRE_LOGGED : SESSION_EXPIRE
  );

  return { session: newSessionId, expires: logged ? SESSION_EXPIRE_LOGGED : SESSION_EXPIRE };
};

export const getSession = async (sessionToken?: string, checkOnly = false) => {
  if (!redis) throw 'no-redis';

  const sessionName = `guid:${sessionToken}`;
  try {
    const sessionData = sessionToken ? await redis.get(sessionName) : null;
    if (sessionData) return sessionToken as string;

    if (checkOnly) return false;

    return (await createSession()).session;
  } catch (e) {
    console.error('Error accessing Redis:', e);
    throw 'no-redis';
  }
};

export const checkBan = async (ip?: string) => {
  if (!redis) return;
  ip = ip ? normalizeIP(ip) : undefined;
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
    if (skipAPIMiddleware || !ip || !itemCount || !redis) return;

    const isValidProof = req.headers['x-itemdb-valid'] === 'true';

    if (isValidProof) return;

    if (req.headers['x-itemdb-token'])
      return incrementApiKey(req.headers['x-itemdb-token'] as string, itemCount);

    ip = normalizeIP(ip);
    const newVal = await redis.incrby(ip, itemCount);

    if (newVal >= LIMIT_COUNT) {
      const isBanned = await redis.get(`ban:${ip}`);
      if (isBanned) return;

      const banCount = (await redis.get(`bCount:${ip}`)) || '1';
      await redis.set(`ban:${ip}`, newVal, 'EX', 2 ** Number(banCount) * INITIAL_BAN_MINUTES * 60);

      await redis.incr(`bCount:${ip}`);
      await redis.expire(`bCount:${ip}`, 30 * 24 * 60 * 60);
      return;
    }

    await redis.pexpire(ip, 30 * 60 * 1000);
  } catch (e) {
    console.error('redis_setItemCount error', e);
  }
};

// ------- api token ------- //

export const checkApiToken = async (token: string) => {
  if (!redis) throw API_ERROR_CODES.noRedis;
  if (!token) return API_ERROR_CODES.invalidKey;

  const payload = jwt.decode(token) as jwt.JwtPayload | null;
  if (!payload || !payload.sub) return API_ERROR_CODES.invalidKey;
  const keyId = payload.sub;
  const limit = payload.limit;

  if (limit === -1) return true; // unlimited key

  const keyData = await redis.get(`apiKey:${keyId}`);

  if (keyData && !isNaN(Number(keyData))) {
    if (Number(keyData) >= limit) {
      throw API_ERROR_CODES.limitExceeded;
    }

    return true;
  }

  await redis.set(`apiKey:${keyId}`, 0, 'EX', 24 * 60 * 60);
};

const incrementApiKey = async (token: string | null | undefined, incrementBy: number) => {
  if (!token || !redis) return;

  const payload = jwt.decode(token) as jwt.JwtPayload | null;
  if (!payload || !payload.sub || !payload.limit) return;
  const keyId = payload.sub;
  const limit = payload.limit;

  const newVal = await redis.incrby(`apiKey:${keyId}`, incrementBy);
  await redis.expire(`apiKey:${keyId}`, 24 * 60 * 60);

  if (limit === '-1') return; // unlimited key

  if (limit && newVal >= parseInt(limit)) {
    throw API_ERROR_CODES.limitExceeded;
  }

  return;
};
