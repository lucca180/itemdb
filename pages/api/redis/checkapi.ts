import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from 'ioredis';

const LIMIT_COUNT = 15000;
const LIMIT_BAN = 2 * 60 * 60 * 1000;
const skipAPIMiddleware = process.env.SKIP_API_MIDDLEWARE === 'true';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const ip = req.headers['x-forwarded-for'] as string;

  if (!ip) return res.status(200).json('ok');

  const rawItemsCount = await redis.get(ip);
  if (!rawItemsCount) return res.status(200).json('ok');

  const itemsRequested = Number(rawItemsCount);

  if (itemsRequested >= LIMIT_COUNT) {
    redis.pexpire(ip, LIMIT_BAN);
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
  if (skipAPIMiddleware || !ip || !itemCount) return;
  console.log(ip, itemCount, skipAPIMiddleware);
  await redis.incrby(ip, itemCount);
  await redis.pexpire(ip, LIMIT_BAN);
};
