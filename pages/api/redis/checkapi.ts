import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from 'ioredis';

const LIMIT_PERIOD = 30 * 1000;
const LIMIT_COUNT = 30;
const LIMIT_BAN = 2 * 60 * 1000;

let redis: Redis;

type IPHistory = {
  ignores?: ('all' | 'price' | 'info')[];
};

const defaultIPHistory: IPHistory = {
  ignores: [],
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const ip = req.headers['x-forwarded-for'] as string;

  const { isInfo, pathname } = req.body;

  if (!redis) {
    redis = new Redis({
      port: 6379,
      host: '127.0.0.1',
      password: process.env.REDIS_PASSWORD,
      enableAutoPipelining: true,
    });
  }

  if (!ip) return res.status(200).json('ok');

  const ipKey = `key_` + ip;

  if (isInfo) {
    const ipStr = (await redis.get(ipKey)) ?? JSON.stringify(defaultIPHistory);
    const ipHistory: IPHistory = JSON.parse(ipStr);

    if (!ipHistory.ignores) return res.status(200).json('ok');

    if (ipHistory.ignores.includes('all')) {
      return res.status(429).json('Too many requests');
    }

    if (ipHistory.ignores.includes('info') && pathname.includes('items')) {
      return res.status(429).json('Too many requests');
    }

    if (ipHistory.ignores.includes('price') && pathname.includes('price')) {
      return res.status(429).json('Too many requests');
    }

    if (ipHistory.ignores.includes('price') && pathname.includes('trades')) {
      return res.status(429).json('Too many requests');
    }

    return res.status(200).json('ok');
  }

  const requests = await redis.incr(ip);
  if (requests === 1) await redis.pexpire(ip, LIMIT_PERIOD);

  if (requests > LIMIT_COUNT) {
    return res.status(429).json('Too many requests');
  }

  if (requests + 1 >= LIMIT_COUNT) {
    await redis.pexpire(ip, LIMIT_BAN);
    console.error(`Banned IP ${ip} for ${LIMIT_BAN}ms`);
    return res.status(429).json('Too many requests');
  }

  res.status(200).json('ok');
}
