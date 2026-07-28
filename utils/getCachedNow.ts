import { cacheLife } from 'next/cache';

/** Wall-clock "now" shared across prerenders for the cache window. */
export async function getCachedNow() {
  'use cache';
  cacheLife('itemFast');
  return Date.now();
}
