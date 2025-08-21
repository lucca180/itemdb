import { Redis as RedisRaw } from 'ioredis';
import { Chance } from 'chance';
import { NextApiRequest } from 'next/types';

const chance = new Chance();

const LIMIT_COUNT = 20000;
const LIMIT_BAN = 6 * 60 * 60 * 1000;
const skipAPIMiddleware =
  process.env.SKIP_API_MIDDLEWARE === 'true' || process.env.NODE_ENV === 'development';

export let redis: RedisRaw;

if (
  process.env.NODE_ENV === 'production' &&
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

export const getSession = async (sessionToken?: string, checkOnly = false) => {
  const sessionData = sessionToken ? await redis.get(sessionToken) : null;
  if (sessionData) return sessionToken as string;

  if (checkOnly) return false;

  const newSessionId = chance.guid({ version: 5 });
  await redis.set(newSessionId, 'true', 'EX', 20 * 60);

  return newSessionId;
};

export const checkRedis = async (ip: string, sessionId: string) => {
  const isValidSession = sessionId ? await getSession(sessionId, true) : false;
  if (isValidSession) return false;

  const rawItemsCount = await redis.get(ip);
  if (!rawItemsCount) return false;

  const itemsRequested = Number(rawItemsCount);

  if (itemsRequested >= LIMIT_COUNT) {
    return true;
  }
};

export const redis_setItemCount = async (
  ip: string | null | undefined,
  itemCount: number,
  req: NextApiRequest
) => {
  try {
    if (skipAPIMiddleware || !ip || !itemCount || !redis) return;

    const skipRedis = req.headers['idb-skip-redis'] as string | undefined;
    if (skipRedis && skipRedis === process.env.SKIP_REDIS_KEY) return;

    const sessionId = req.cookies['idb-session-id'] || '';
    const isValidSession = await getSession(sessionId, true);

    if (isValidSession) return;

    const newVal = await redis.incrby(ip, itemCount);

    if (newVal >= LIMIT_COUNT) {
      console.error('Banning IP:', ip);
      await redis.pexpire(ip, LIMIT_BAN);
      return;
    }

    await redis.pexpire(ip, 30 * 60 * 1000);
  } catch (e) {
    console.error('redis_setItemCount error', e);
  }
};
