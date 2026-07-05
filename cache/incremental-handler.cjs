/**
 * Legacy Next.js cache handler (cacheHandler singular).
 * ISR, fetch cache, Pages Router on-demand revalidation, image optimization.
 */
const { RedisStringsHandler } = require('@trieb.work/nextjs-turbo-redis-cache');
const { getRedisCacheHandlerOptions } = require('./redis-cache-options.cjs');

/** @type {RedisStringsHandler | undefined} */
let cachedHandler;

module.exports = class ItemdbIncrementalCacheHandler {
  constructor() {
    if (!cachedHandler) {
      cachedHandler = new RedisStringsHandler(getRedisCacheHandlerOptions());
    }
  }

  get(...args) {
    return cachedHandler.get(...args);
  }

  set(...args) {
    return cachedHandler.set(...args);
  }

  revalidateTag(...args) {
    return cachedHandler.revalidateTag(...args);
  }

  resetRequestCache(...args) {
    return cachedHandler.resetRequestCache(...args);
  }
};
