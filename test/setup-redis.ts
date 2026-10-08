import { beforeAll, vi } from 'vitest';
import { TEST_REDIS, flushRedisMock } from './mocks/redis';

// Point the app at a local dummy host so a missing mock fails fast instead of reaching a real server
process.env.REDIS_HOST = TEST_REDIS.host;
process.env.REDIS_PORT = String(TEST_REDIS.port);
process.env.REDIS_PASSWORD = 'test';

vi.mock('ioredis', async () => {
  const { default: RedisMock } = await import('ioredis-mock');
  return { default: RedisMock, Redis: RedisMock };
});

// Data persists per host/port/db inside a worker; tests within a file may share state on purpose
beforeAll(flushRedisMock);
