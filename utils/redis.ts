import { Redis as RedisRaw } from 'ioredis';
import { Chance } from 'chance';
import { NextApiRequest } from 'next/types';

const chance = new Chance();

const LIMIT_COUNT = 20000;
const INITIAL_BAN_HOURS = 2;
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
  const sessionName = `guid:${sessionToken}`;
  const sessionData = sessionToken ? await redis.get(sessionName) : null;
  if (sessionData) return sessionToken as string;

  if (checkOnly) return false;

  const newSessionId = chance.guid({ version: 5 });
  await redis.set(`guid:${newSessionId}`, 'true', 'EX', 20 * 60);

  return newSessionId;
};

export const checkRedis = async (ip: string, sessionId?: string) => {
  const isValidSession = sessionId ? await getSession(sessionId, true) : false;
  if (isValidSession) return false;

  const isBanned = await redis.get(`ban:${ip}`);
  if (isBanned) return true;

  return false;
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
      const isBanned = await redis.get(`ban:${ip}`);
      if (isBanned) return;

      const banCount = (await redis.get(`bCount:${ip}`)) || '0';
      await redis.set(`ban:${ip}`, newVal, 'EX', (INITIAL_BAN_HOURS + Number(banCount)) * 60 * 60);

      await redis.incr(`bCount:${ip}`);
      await redis.expire(`bCount:${ip}`, 30 * 24 * 60 * 60);
      return;
    }

    await redis.pexpire(ip, 30 * 60 * 1000);
  } catch (e) {
    console.error('redis_setItemCount error', e);
  }
};
