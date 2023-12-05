import { Redis } from 'ioredis';

export const redis = new Redis({
  port: 6379,
  host: '127.0.0.1',
  password: process.env.REDIS_PASSWORD,
});
