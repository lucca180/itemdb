/**
 * Legacy Next.js cache handler (cacheHandler singular).
 * ISR, fetch cache, Pages Router on-demand revalidation, image optimization.
 *
 * Routes APP_ROUTE / APP_PAGE / FETCH to Redis (shared across PM2 workers).
 * Routes PAGES / REDIRECT / IMAGE to Next.js FileSystemCache (Pages Router SSG).
 */
const { RedisStringsHandler } = require('@trieb.work/nextjs-turbo-redis-cache');
const FileSystemCache = require('next/dist/server/lib/incremental-cache/file-system-cache')
  .default;
const { getRedisCacheHandlerOptions } = require('./redis-cache-options.cjs');

const REDIS_KINDS = new Set(['APP_ROUTE', 'APP_PAGE', 'FETCH']);

/** @type {RedisStringsHandler | undefined} */
let cachedRedisHandler;

function getRedisHandler() {
  if (!cachedRedisHandler) {
    cachedRedisHandler = new RedisStringsHandler(getRedisCacheHandlerOptions());
  }
  return cachedRedisHandler;
}

function isRedisKind(kind) {
  return REDIS_KINDS.has(kind);
}

module.exports = class ItemdbIncrementalCacheHandler {
  /** @param {ConstructorParameters<typeof FileSystemCache>[0]} ctx */
  constructor(ctx) {
    this.fsHandler = new FileSystemCache(ctx);
  }

  get(key, ctx) {
    if (isRedisKind(ctx?.kind)) {
      return getRedisHandler().get(key, ctx);
    }
    return this.fsHandler.get(key, ctx);
  }

  set(key, data, ctx) {
    if (isRedisKind(data?.kind)) {
      return getRedisHandler().set(key, data, ctx);
    }
    return this.fsHandler.set(key, data, ctx);
  }

  async revalidateTag(tags, durations) {
    await Promise.all([
      getRedisHandler().revalidateTag(tags, durations),
      this.fsHandler.revalidateTag(tags, durations),
    ]);
  }

  resetRequestCache() {
    getRedisHandler().resetRequestCache();
    this.fsHandler.resetRequestCache();
  }
};
