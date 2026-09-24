/**
 * Cache Components handler (cacheHandlers.default).
 * 'use cache', cacheTag(), cacheLife(), revalidateTag() from App Router.
 *
 * RedisCacheComponentsHandler connects in its constructor. Export a Proxy so
 * Next can resolve/load this module without opening Redis until the first
 * real method call. Options are applied on that first use (1.17+).
 *
 * The `has` trap must not construct the handler — `'prop' in proxy` would
 * otherwise open Redis (and reconnect forever if Redis is down).
 */
const { getRedisCacheComponentsHandler } = require('@trieb.work/nextjs-turbo-redis-cache');
const { MAX_EXPIRE_SECONDS, getRedisCacheHandlerOptions } = require('./redis-cache-options.cjs');

const options = getRedisCacheHandlerOptions();

/** @type {ReturnType<typeof getRedisCacheComponentsHandler> | undefined} */
let handler;

function getHandler() {
  if (!handler) {
    handler = getRedisCacheComponentsHandler(options);
  }
  return handler;
}

/** Methods Next.js Cache Components expects on the handler. */
const HANDLER_METHODS = new Set([
  'get',
  'set',
  'refreshTags',
  'getExpiration',
  'updateTags',
  'expireTags',
]);

/**
 * The handler stores `entry.expire` as the Redis TTL (EX) with no upper bound.
 * Clamp it, but never below `revalidate` (Next expects expire >= revalidate).
 *
 * @param {string} cacheKey
 * @param {Promise<import('next/dist/server/lib/cache-handlers/types').CacheEntry>} pendingEntry
 */
function setWithMaxExpire(cacheKey, pendingEntry) {
  const cappedEntry = pendingEntry.then((entry) => ({
    ...entry,
    expire: Math.min(entry.expire, Math.max(MAX_EXPIRE_SECONDS, entry.revalidate)),
  }));
  return getHandler().set(cacheKey, cappedEntry);
}

module.exports = new Proxy(
  {},
  {
    get(_target, prop) {
      if (typeof prop === 'symbol') {
        return undefined;
      }
      if (prop === 'set') {
        return setWithMaxExpire;
      }
      const value = getHandler()[prop];
      return typeof value === 'function' ? value.bind(getHandler()) : value;
    },
    has(_target, prop) {
      return typeof prop === 'string' && HANDLER_METHODS.has(prop);
    },
  }
);
