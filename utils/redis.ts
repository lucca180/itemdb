import { Redis as RedisRaw } from 'ioredis';
import { Chance } from 'chance';
import { NextApiRequest } from 'next/types';
import prisma from './prisma';
import { normalizeIP } from './api-utils';

const chance = new Chance();

const LIMIT_COUNT = 20000;
// const LIMIT_COUNT = 1000; ---> new value after new changes
const INITIAL_BAN_HOURS = 2;
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

    if (req.headers['x-itemdb-key'])
      return incrementApiKey(req.headers['x-itemdb-key'] as string, itemCount);

    ip = normalizeIP(ip);
    const newVal = await redis.incrby(ip, itemCount);

    if (newVal >= LIMIT_COUNT) {
      const isBanned = await redis.get(`ban:${ip}`);
      if (isBanned) return;

      const banCount = (await redis.get(`bCount:${ip}`)) || '0';
      await redis.set(
        `ban:${ip}`,
        newVal,
        'EX',
        2 ** Number(banCount) * INITIAL_BAN_HOURS * 60 * 60
      );

      await redis.incr(`bCount:${ip}`);
      await redis.expire(`bCount:${ip}`, 30 * 24 * 60 * 60);
      return;
    }

    await redis.pexpire(ip, 30 * 60 * 1000);
  } catch (e) {
    console.error('redis_setItemCount error', e);
  }
};

// ------- api key ------- //

export const checkApiKey = async (apiKey: string | null | undefined) => {
  if (!redis) throw API_ERROR_CODES.noRedis;
  if (!apiKey) return API_ERROR_CODES.invalidKey;

  const keyData = await redis.get(`apiKey:${apiKey}`);

  if (keyData && !isNaN(Number(keyData))) {
    const keyLimit = await redis.get(`apiKeyLimit:${apiKey}`);
    const limit = keyLimit ? parseInt(keyLimit) : 0;

    if (limit === -1) return true; // unlimited key

    if (Number(keyData) >= limit) {
      throw API_ERROR_CODES.limitExceeded;
    }

    return true;
  }

  const dbKey = await prisma.apiKeys.findUnique({
    where: {
      api_key: apiKey,
      active: true,
    },
  });

  if (!dbKey) throw API_ERROR_CODES.invalidKey;

  await redis.set(`apiKey:${apiKey}`, 0, 'EX', 24 * 60 * 60);
  await redis.set(`apiKeyLimit:${apiKey}`, dbKey.limit, 'EX', 24 * 60 * 60);
};

const incrementApiKey = async (apiKey: string | null | undefined, incrementBy: number) => {
  if (!apiKey || !redis) return;

  const newVal = await redis.incrby(`apiKey:${apiKey}`, incrementBy);
  await redis.expire(`apiKey:${apiKey}`, 24 * 60 * 60);
  await redis.expire(`apiKeyLimit:${apiKey}`, 24 * 60 * 60);

  const limit = await redis.get(`apiKeyLimit:${apiKey}`);

  if (limit === '-1') return; // unlimited key

  if (limit && newVal >= parseInt(limit)) {
    throw API_ERROR_CODES.limitExceeded;
  }

  return;
};
