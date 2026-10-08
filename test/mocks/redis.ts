import RedisMock from 'ioredis-mock';

/** Connection the app's Redis clients point at under test (see test/setup-redis.ts). */
export const TEST_REDIS = { host: 'localhost', port: 6379 } as const;

/**
 * Clears the in-memory data behind `redis` (db 0) and `redisCache` (db 1).
 * ioredis-mock shares data between instances with the same host/port/db.
 */
export async function flushRedisMock() {
  await Promise.all(
    [0, 1].map(async (db) => {
      const client = new RedisMock({ ...TEST_REDIS, db });
      await client.flushall();
      client.disconnect();
    })
  );
}
