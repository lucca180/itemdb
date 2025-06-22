import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@utils/redis';
import { checkSession } from './session';

const LIMIT_COUNT = 20000;
const LIMIT_BAN = 6 * 60 * 60 * 1000;
const skipAPIMiddleware =
  process.env.SKIP_API_MIDDLEWARE === 'true' || process.env.NODE_ENV === 'development';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const ip = req.headers['idb-ip-check'] as string;

  if (!ip || !redis) return res.status(200).json('ok');

  const sessionId = req.cookies['idb-session-id'] || '';
  const isValidSession = sessionId ? await checkSession(sessionId) : false;
  if (isValidSession) return res.status(200).json('ok');

  const rawItemsCount = await redis.get(ip);
  if (!rawItemsCount) return res.status(200).json('ok');

  const itemsRequested = Number(rawItemsCount);

  if (itemsRequested >= LIMIT_COUNT) {
    return res.status(429).json('Too many requests');
  }

  res.status(200).json('ok');
}

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
    const isValidSession = await checkSession(sessionId);

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
