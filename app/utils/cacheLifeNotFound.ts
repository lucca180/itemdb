import { cacheLife } from 'next/cache';

/**
 * Call instead of the normal `cacheLife` when a `'use cache'` scope resolves to "not found", so a
 * 404 is never served from cache and the next request queries the source again.
 * `expire: 1` instead of 0 because the Redis handler stores `expire` as the key TTL (EX 0 is invalid).
 */
export function cacheLifeNotFound() {
  cacheLife({ stale: 0, revalidate: 0, expire: 1 });
}
