/**
 * Redis + CDN cache-aside for public ItemV2 HTTP routes.
 *
 * Design notes:
 * - Redis stores per-item JSON; responses are assembled with JSON.stringify.
 * - Cache key segments are lowercased; HTTP response keys stay DB-canonical.
 * - Keys include lookup type so `id=42` never collides with `item_id=42`.
 * - Reads happen in-request; writes are scheduled with Next.js `after()`.
 * - TTL comes from `itemIntents[intent].ttlSeconds` (see `@types`).
 *
 * Used by `/api/v2/items/[id_name]` and `/api/v2/items/many`.
 */
import { after } from 'next/server';
import {
  encodeNameImageKey,
  getItemV2,
  getManyItemsV2,
  type FindManyItemsV2Query,
  type FindManyItemsV2Type,
} from '@app/server/items/v2';
import { redis } from '@utils/api/redis';
import { getIntentTtl, type ItemIntent, type ItemV2 } from '@types';

/** Which identifier field the request used — mirrors `resolveLookup` in v2.ts. */
export type ItemCacheType =
  | FindManyItemsV2Type
  /** Ambiguous path param on `/items/[id_name]` (slug or name LIKE). */
  | 'id_name';

type ItemRecord = Pick<ItemV2, 'internal_id'> & Record<string, unknown>;

/** One Redis write unit: lookup key + JSON (+ optional id alias). */
export type ItemCacheEntry = { key: string; json: string; internalId?: number };

export type CachedItemResult =
  | { status: 'hit'; body: string }
  | { status: 'miss'; body: string }
  | { status: 'not_found' };

export type CachedManyResult = {
  /** Full JSON object string ready for `new Response(body)`. */
  body: string;
  /** Distinct items loaded from Prisma on this request — used for API quota. */
  dbCount: number;
};

/** Above this size, `many` skips Redis (mget cost can beat a single SQL). */
export const ITEM_CACHE_BATCH_MAX = 1000;
/** Fail-open: slow Redis must not stall the request longer than this. */
export const ITEM_CACHE_TIMEOUT_MS = 150;

/** `iv2:item:{type}:{key}:{intent}` — key is always lowercased. */
export function itemCacheKey(type: ItemCacheType, key: string, intent: ItemIntent): string {
  return `iv2:item:${type}:${key.toLowerCase()}:${intent}`;
}

export function canCacheMany(keyCount: number): boolean {
  return keyCount > 0 && keyCount <= ITEM_CACHE_BATCH_MAX;
}

function uniqueLower(values: string[]): string[] {
  return [...new Set(values.map((v) => String(v).toLowerCase()))];
}

/** `?fresh=1` bypasses Redis read and forces `Cache-Control: no-store`. */
export function wantsFresh(url: string): boolean {
  try {
    return new URL(url).searchParams.get('fresh') === '1';
  } catch {
    return false;
  }
}

/**
 * CDN / browser cache header.
 * GET uses the same TTL as Redis; POST is Redis-only (bodies aren't CDN-cacheable).
 */
export function itemCacheControl(
  intent: ItemIntent,
  opts: { fresh?: boolean; method: 'GET' | 'POST' }
): string {
  if (opts.fresh) return 'no-store';
  if (opts.method === 'POST') return 'private, no-cache';

  const ttl = getIntentTtl(intent);
  return `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 4}`;
}

// ── Lookup resolution (must stay aligned with resolveLookup in v2.ts) ──

/**
 * Maps a `{ type, data }` many-query onto Redis key material.
 * Lookup keys are lowercased; HTTP response keys still come from `getManyItemsV2` (DB).
 */
export function toManyCacheKeys(query: FindManyItemsV2Query): {
  type: FindManyItemsV2Type;
  keys: string[];
  /** Kept so miss queries can rebuild `[name, image_id]` pairs. */
  nameImagePairs?: [string, string][];
} | null {
  if (!query.data.length) return null;

  switch (query.type) {
    case 'id':
      return { type: 'id', keys: uniqueLower(query.data.map(String)) };
    case 'item_id':
      return { type: 'item_id', keys: uniqueLower(query.data.map(String)) };
    case 'name_image_id': {
      const pairsByKey = new Map<string, [string, string]>();
      for (const [name, imageId] of query.data) {
        const pair: [string, string] = [String(name), String(imageId)];
        const key = encodeNameImageKey(pair[0], pair[1]).toLowerCase();
        if (!pairsByKey.has(key)) pairsByKey.set(key, pair);
      }
      return {
        type: 'name_image_id',
        keys: [...pairsByKey.keys()],
        nameImagePairs: [...pairsByKey.values()],
      };
    }
    case 'image_id':
      return { type: 'image_id', keys: uniqueLower(query.data.map(String)) };
    case 'name':
      return { type: 'name', keys: uniqueLower(query.data.map(String)) };
    case 'slug':
      return { type: 'slug', keys: uniqueLower(query.data.map(String)) };
  }
}

/** Numeric path → type `id` (shared with `many?type=id&data[]=`). Otherwise opaque `id_name`. */
export function resolveSinglePathParam(idName: string): { type: ItemCacheType; key: string } {
  if (!Number.isNaN(Number(idName)) && idName.trim() !== '') {
    return { type: 'id', key: String(Number(idName)) };
  }
  return { type: 'id_name', key: idName.toLowerCase() };
}

/** Builds a `{ type, data }` Prisma query containing only the cache misses. */
export function toMissQuery(
  type: FindManyItemsV2Type,
  missKeys: string[],
  opts?: { nameImagePairs?: [string, string][] }
): FindManyItemsV2Query {
  switch (type) {
    case 'id':
      return { type: 'id', data: missKeys };
    case 'item_id':
      return { type: 'item_id', data: missKeys };
    case 'image_id':
      return { type: 'image_id', data: missKeys };
    case 'name':
      return { type: 'name', data: missKeys };
    case 'slug':
      return { type: 'slug', data: missKeys };
    case 'name_image_id': {
      const pairByKey = new Map(
        (opts?.nameImagePairs ?? []).map((pair) => [
          encodeNameImageKey(pair[0], pair[1]).toLowerCase(),
          pair,
        ])
      );
      const nameImagePairs = missKeys
        .map((key) => pairByKey.get(key))
        .filter((pair): pair is [string, string] => !!pair);
      return { type: 'name_image_id', data: nameImagePairs };
    }
  }
}

function parseCachedItem(value: string): ItemRecord | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as ItemRecord;
    }
  } catch {
    // Corrupt Redis value — treat as miss.
  }
  return null;
}

/** Race Redis against a short timeout; null means treat as total miss. */
async function withRedisTimeout<T>(promise: Promise<T>): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), ITEM_CACHE_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.error('itemV2Cache redis error', error);
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function toCacheEntries(items: Record<string, ItemRecord>): ItemCacheEntry[] {
  return Object.entries(items).map(([key, item]) => ({
    key,
    json: JSON.stringify(item),
    internalId: item.internal_id,
  }));
}

// ── Redis I/O ──

/** In-request mget. Returns Map of lookup-key → parsed item. */
export async function readItemCache(
  type: ItemCacheType,
  keys: string[],
  intent: ItemIntent
): Promise<Map<string, ItemRecord>> {
  const hits = new Map<string, ItemRecord>();
  if (!redis || keys.length === 0) return hits;

  const redisKeys = keys.map((key) => itemCacheKey(type, key, intent));
  const values = await withRedisTimeout(redis.mget(...redisKeys));
  if (!values) return hits;

  for (let i = 0; i < keys.length; i++) {
    const value = values[i];
    if (typeof value !== 'string') continue;
    const item = parseCachedItem(value);
    if (item) hits.set(keys[i], item);
  }
  return hits;
}

/**
 * SET EX for each entry. Also writes `id:{internalId}` alias so
 * `/items/42` and `many?type=id&data[]=42` share the same payload.
 * Call only from `after()` — never await on the hot path.
 */
export async function writeItemCache(
  type: ItemCacheType,
  intent: ItemIntent,
  entries: ItemCacheEntry[]
): Promise<void> {
  if (!redis || entries.length === 0) return;

  const ttl = getIntentTtl(intent);
  const pipeline = redis.pipeline();
  const seen = new Set<string>();

  for (const entry of entries) {
    const primary = itemCacheKey(type, entry.key, intent);
    if (!seen.has(primary)) {
      pipeline.set(primary, entry.json, 'EX', ttl);
      seen.add(primary);
    }

    if (entry.internalId != null) {
      const alias = itemCacheKey('id', String(entry.internalId), intent);
      if (!seen.has(alias)) {
        pipeline.set(alias, entry.json, 'EX', ttl);
        seen.add(alias);
      }
    }
  }

  await pipeline.exec();
}

/** Fire-and-forget write after the response is sent (same pattern as getItemForPage). */
export function scheduleItemCacheWrite(
  type: ItemCacheType,
  intent: ItemIntent,
  entries: ItemCacheEntry[]
): void {
  if (!redis || entries.length === 0) return;

  after(async () => {
    try {
      await writeItemCache(type, intent, entries);
    } catch (error) {
      console.error('scheduleItemCacheWrite error', error);
    }
  });
}

// ── Orchestrators (used by route handlers) ──

/**
 * Cache-aside for `/items/many`.
 *
 * 1. Batch too large → Prisma only (no Redis).
 * 2. `fresh` → Prisma + schedule write (skip read).
 * 3. Else mget → Prisma only misses → merge → JSON.stringify.
 *
 * Response keys are whatever `getManyItemsV2` returns (DB-canonical).
 * Redis keys are lowercased via `itemCacheKey`.
 */
export async function getCachedManyItemsV2(
  query: FindManyItemsV2Query,
  opts: { intent: ItemIntent; limit: number; fresh: boolean }
): Promise<CachedManyResult> {
  const resolved = toManyCacheKeys(query);
  if (!resolved) return { body: '{}', dbCount: 0 };

  const { type, keys, nameImagePairs } = resolved;
  const { intent, limit, fresh } = opts;

  if (!canCacheMany(keys.length) || fresh) {
    const items = await getManyItemsV2(query, { intent, limit });
    if (fresh && canCacheMany(keys.length)) {
      scheduleItemCacheWrite(type, intent, toCacheEntries(items));
    }
    return { body: JSON.stringify(items), dbCount: Object.keys(items).length };
  }

  const hits = await readItemCache(type, keys, intent);
  const missKeys = keys.filter((key) => !hits.has(key));

  const result: Record<string, ItemRecord> = Object.fromEntries(hits);
  let dbCount = 0;

  if (missKeys.length > 0) {
    const missQuery = toMissQuery(type, missKeys, { nameImagePairs });
    const items = await getManyItemsV2(missQuery, { intent, limit });
    dbCount = Object.keys(items).length;
    Object.assign(result, items);
    scheduleItemCacheWrite(type, intent, toCacheEntries(items));
  }

  return { body: JSON.stringify(result), dbCount };
}

/**
 * Cache-aside for `/items/[id_name]`.
 * On miss also warms `id` alias (+ `slug` when the path was a non-numeric id_name).
 * Non-numeric reads also check the `slug` bucket (warmed by `many?type=slug`).
 */
export async function getCachedItemV2(
  idName: string | number,
  opts: { intent: ItemIntent; fresh: boolean }
): Promise<CachedItemResult> {
  const idNameStr = String(idName);
  const { type, key } = resolveSinglePathParam(idNameStr);
  const { intent, fresh } = opts;

  if (!fresh) {
    const hits = await readItemCache(type, [key], intent);
    const cached = hits.get(key);
    if (cached) return { status: 'hit', body: JSON.stringify(cached) };

    if (type === 'id_name') {
      const slugHits = await readItemCache('slug', [key], intent);
      const cachedSlug = slugHits.get(key);
      if (cachedSlug) return { status: 'hit', body: JSON.stringify(cachedSlug) };
    }
  }

  const lookup = Number.isNaN(Number(idNameStr)) ? idNameStr : Number(idNameStr);
  const item = await getItemV2(lookup, { intent });
  if (!item) return { status: 'not_found' };

  const json = JSON.stringify(item);

  if (redis) {
    after(async () => {
      try {
        await writeItemCache(type, intent, [{ key, json, internalId: item.internal_id }]);
        if (type === 'id_name' && item.slug) {
          await writeItemCache('slug', intent, [
            { key: item.slug, json, internalId: item.internal_id },
          ]);
        }
      } catch (error) {
        console.error('scheduleItemCacheWrite error', error);
      }
    });
  }

  return { status: 'miss', body: json };
}
