/**
 * Shared options for @trieb.work/nextjs-turbo-redis-cache handlers.
 *
 * Used by:
 * - cache/components-handler.cjs → cacheHandlers.default ('use cache')
 *
 * Reuses existing env: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD.
 * Redis server must have: notify-keyspace-events Exe
 *
 * Logical DBs on this host:
 * - 0 — API rate limiting / bans (ioredis)
 * - 1 — ItemV2 HTTP cache + auth (ioredis redisCache)
 * - 2 — Next.js Cache Components handler (this package)
 */

/** @returns {string | undefined} */
function buildRedisUrl() {
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASSWORD;

  if (!host || !password) {
    return undefined;
  }

  return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
}

/**
 * @returns {import('@trieb.work/nextjs-turbo-redis-cache').CreateRedisStringsHandlerOptions}
 */
function getRedisCacheHandlerOptions() {
  const redisUrl = buildRedisUrl();

  if (!redisUrl) {
    throw new Error(
      '[cache] Redis cache handler enabled but REDIS_HOST / REDIS_PASSWORD is missing'
    );
  }

  const timeoutMs = Number.parseInt(process.env.REDIS_COMMAND_TIMEOUT_MS || '', 10);

  return {
    redisUrl,
    database: 2,
    keyPrefix: 'itemdb:cc:',
    getTimeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 750,
    revalidateTagQuerySize: 250,
    sharedTagsKey: '__sharedTags__',
    avgResyncIntervalMs: 60 * 60 * 1_000,
    redisGetDeduplication: true,
    inMemoryCachingTime: 10_000,
    defaultStaleAge: 1209600,
    estimateExpireAge: (staleAge) => staleAge * 2,
    clientOptions: {
      password: process.env.REDIS_PASSWORD,
    },
    killContainerOnErrorThreshold: 0,
  };
}

module.exports = {
  buildRedisUrl,
  getRedisCacheHandlerOptions,
};
