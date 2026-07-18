import { getItemV2, getManyItemsV2, type FindManyItemsV2Query } from '@app/server/items/v2';
import { getCachedItemV2, getCachedManyItemsV2 } from '@app/server/items/itemV2Cache';
import { getLatestItemsV2 } from '@services/item/latestItems';
import { getTrendingItemsV2 } from '@services/item/trendingItems';
import { getNCMallItemsDataV2 } from '@services/item/mallItems';
import { getLatestPricedItemsV2 } from '@services/item/latestPricedItems';
import type { ItemIntent, ItemV2For } from '@types';

/** Engine default when no `limit` is provided (mirrors `getManyItemsV2`). */
const DEFAULT_MANY_LIMIT = 60_000;

/** Options for reading a single item through the ItemService facade. */
type GetItemOpts<I extends ItemIntent> = {
  /**
   * Field/JOIN preset returned (`minimal` | `card` | `pricer` | `full`).
   * Determines the shape of `ItemV2For<I>`. Defaults to `'full'`.
   */
  intent?: I;
  /**
   * Whether to go through the Redis cache layer (`getCachedItemV2`).
   * - `false` (default): pure engine (direct Prisma). Never reads nor writes Redis.
   * - `true`: reads from Redis; on a miss, hits Prisma and schedules a Redis write via `after()`.
   */
  cached?: boolean;
  /**
   * Only has effect when `cached: true`. Skips the Redis READ, forces Prisma and
   * REWRITES Redis (warms the cache). Ignored when `cached: false`.
   */
  fresh?: boolean;
};

/** Options for reading many items; same as GetItemOpts plus a row limit. */
type GetManyOpts<I extends ItemIntent> = GetItemOpts<I> & {
  /** Max number of items the query returns. Engine default: 60000. */
  limit?: number;
};

/**
 * Server-side facade for the V2 items API.
 *
 * Consolidates the engine (`getItemV2`/`getManyItemsV2`), the cache layer
 * (`itemV2Cache`) and the home loaders (latest/trending/mall/prices) into a
 * single, typed surface. Server-only (RSC / Route Handlers): it imports
 * Prisma/Redis and must not reach the browser bundle.
 *
 * Quota note: `trackItemQuota` lives only in the HTTP routes; calls through
 * ItemService (even with `cached: true`) do NOT consume quota.
 */
export class ItemService {
  // Loader passthroughs are lazy wrappers (not direct field captures): the
  // loaders import ItemService back, so resolving them at call time via live
  // bindings keeps this robust against module evaluation order.

  /** Most recently added items (intent `card`). Delegates to `getLatestItemsV2`. */
  static getLatest: typeof getLatestItemsV2 = (...args) => getLatestItemsV2(...args);
  /** Trending items by Umami pageviews (intent `card`). Delegates to `getTrendingItemsV2`. */
  static getTrending: typeof getTrendingItemsV2 = (...args) => getTrendingItemsV2(...args);
  /** Items arriving/leaving the NC Mall (intent `card`). Delegates to `getNCMallItemsDataV2`. */
  static getMall: typeof getNCMallItemsDataV2 = (...args) => getNCMallItemsDataV2(...args);
  /** Recently repriced items (intent `card`). Delegates to `getLatestPricedItemsV2`. */
  static getLatestPriced: typeof getLatestPricedItemsV2 = (...args) =>
    getLatestPricedItemsV2(...args);

  /**
   * Route-oriented cache-aside for a SINGLE item.
   *
   * Unlike {@link ItemService.getItem}, this returns the raw cache envelope
   * (`status` + pre-serialized JSON `body`) instead of a parsed object, so HTTP
   * handlers can stream `body` without re-stringifying. Callers own the HTTP
   * concerns: quota on `status === 'miss'`, `Cache-Control`, and the 404 on
   * `status === 'not_found'`. Delegates to `getCachedItemV2`.
   */
  static getCachedItem = getCachedItemV2;

  /**
   * Route-oriented cache-aside for MANY items.
   *
   * Unlike {@link ItemService.getManyItems}, this returns the pre-joined JSON
   * `body` plus `dbCount` (distinct Prisma-backed items on this request, used
   * for API quota) instead of a parsed map. Callers own the HTTP concerns
   * (quota when `dbCount > 0`, `Cache-Control`). Delegates to `getCachedManyItemsV2`.
   */
  static getCachedManyItems = getCachedManyItemsV2;

  /**
   * Fetches a SINGLE item by `internal_id` (number), `slug` or `name`.
   *
   * `cached` × `fresh` combos:
   * - `cached:false` (default) → direct Prisma, never touches Redis. `fresh` is ignored.
   * - `cached:true, fresh:false` → reads Redis; on a miss hits Prisma and warms Redis.
   * - `cached:true, fresh:true` → skips the Redis read, forces Prisma and warms Redis.
   *
   * @returns the item shaped by `intent`, or `null` when it does not exist.
   */
  static async getItem<I extends ItemIntent = 'full'>(
    idName: number | string,
    opts: GetItemOpts<I> = {}
  ): Promise<ItemV2For<I> | null> {
    const { intent = 'full' as I, cached = false, fresh = false } = opts;
    if (!cached) return getItemV2(idName, { intent });

    const res = await getCachedItemV2(idName, { intent, fresh });
    if (res.status === 'not_found') return null;
    return JSON.parse(res.body) as ItemV2For<I>;
  }

  /**
   * Fetches MANY items by a lookup type (`id` | `item_id` | `name_image_id`
   * | `image_id` | `name` | `slug`).
   *
   * `cached` × `fresh` combos: identical to {@link ItemService.getItem}.
   * Above `ITEM_CACHE_BATCH_MAX` the cache layer falls back to direct Prisma.
   *
   * @returns a `{ [lookupKey]: ItemV2For<I> }` map (only the items found).
   */
  static async getManyItems<I extends ItemIntent = 'full'>(
    query: FindManyItemsV2Query,
    opts: GetManyOpts<I> = {}
  ): Promise<Record<string, ItemV2For<I>>> {
    const { intent = 'full' as I, cached = false, fresh = false, limit } = opts;
    if (!cached) return getManyItemsV2(query, { intent, limit });

    const res = await getCachedManyItemsV2(query, {
      intent,
      fresh,
      limit: limit ?? DEFAULT_MANY_LIMIT,
    });
    return JSON.parse(res.body) as Record<string, ItemV2For<I>>;
  }
}
