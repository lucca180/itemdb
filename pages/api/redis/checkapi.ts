import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from 'ioredis';

const LIMIT_COUNT = 15000;
const LIMIT_BAN = 2 * 60 * 60 * 1000;
const skipAPIMiddleware = process.env.SKIP_API_MIDDLEWARE === 'true';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const ip = req.headers['idb-ip-check'] as string;

  if (!ip) return res.status(200).json('ok');

  const rawItemsCount = await redis.get(ip);
  if (!rawItemsCount) return res.status(200).json('ok');

  const itemsRequested = Number(rawItemsCount);

  if (itemsRequested >= LIMIT_COUNT) {
    return res.status(429).json('Too many requests');
  }

  res.status(200).json('ok');
}

export let redis: Redis;

if (process.env.NODE_ENV === 'production') {
  redis = new Redis({
    port: process.env.REDIS_PORT as unknown as number,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    enableAutoPipelining: true,
  });
} else {
  // @ts-expect-error global is not defined
  if (!global.redis) {
    // @ts-expect-error global is not defined
    global.redis = new Redis({
      port: process.env.REDIS_PORT as unknown as number,
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
      enableAutoPipelining: true,
    });
  }
  // @ts-expect-error global is not defined
  redis = global.redis;
}

export const redis_setItemCount = async (ip: string | null | undefined, itemCount: number) => {
  try {
    if (skipAPIMiddleware || !ip || !itemCount) return;

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
