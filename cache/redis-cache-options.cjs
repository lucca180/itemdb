/**
 * Shared options for @trieb.work/nextjs-turbo-redis-cache handlers.
 *
 * Used by:
 * - cache/incremental-handler.cjs  → cacheHandler (ISR, fetch cache, Pages Router)
 * - cache/components-handler.cjs   → cacheHandlers.default ('use cache')
 *
 * Reuses existing env: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, BUILD_ID.
 * Redis server must have: notify-keyspace-events Exe
 */

/** @returns {boolean} */
function isRedisCacheHandlerEnabled() {
  return (
    process.env.NODE_ENV !== 'development' &&
    Boolean(process.env.REDIS_HOST && process.env.REDIS_PASSWORD)
  );
}

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

  const buildId = process.env.BUILD_ID || 'dev';

  return {
    redisUrl,
    database: 1,
    keyPrefix: `itemdb:${buildId}:`,
    getTimeoutMs: 500,
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
  isRedisCacheHandlerEnabled,
  getRedisCacheHandlerOptions,
};
