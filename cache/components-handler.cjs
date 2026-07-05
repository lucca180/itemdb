/**
 * Cache Components handler (cacheHandlers.default).
 * 'use cache', cacheTag(), cacheLife(), revalidateTag() from App Router.
 */
const { getRedisCacheComponentsHandler } = require('@trieb.work/nextjs-turbo-redis-cache');
const { getRedisCacheHandlerOptions } = require('./redis-cache-options.cjs');

module.exports = getRedisCacheComponentsHandler(getRedisCacheHandlerOptions());
