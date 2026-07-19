/**
 * Redis cache for a list's member item ids (used by `/api/v2/lists/.../itemdata`).
 *
 * We cache only the ORDERED `internal_id`s of a list — not the item payloads.
 * The payloads are served by the shared item cache (`ItemService.getCachedManyItems`),
 * so the steady state is "id-cache hit + item-cache hits = no heavy query".
 *
 * The id list is cached only for the public view (no hidden items): hidden
 * items are owner/admin-specific and must never leak across viewers, so those
 * requests always recompute the ids and skip this cache.
 *
 * TTL-only (no active invalidation) — consistent with the Phase 3 item cache.
 * A membership change (add/remove/hide/reorder) may take up to the TTL to show.
 */
import { after } from 'next/server';
import { redisCache } from '@utils/api/redis';

/** Longer TTL for official lists (they change rarely); shorter for user lists. */
const LIST_IDS_TTL = { official: 60 * 60, regular: 5 * 60 } as const;

/** Fail-open: a slow Redis read must not stall the request. */
const READ_TIMEOUT_MS = 150;

const listIdsKey = (listId: number) => `iv2:list:ids:${listId}`;

/** Race a Redis promise against a timeout; any failure resolves to `null`. */
async function withTimeout<T>(promise: Promise<T>): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), READ_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.error('listItemsV2Cache redis error', error);
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** Returns the cached ordered ids for a list, or `null` on miss/error/no-redis. */
export async function readListItemIds(listId: number): Promise<number[] | null> {
  if (!redisCache) return null;
  const raw = await withTimeout(redisCache.get(listIdsKey(listId)));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as number[]) : null;
  } catch {
    return null;
  }
}

/** Schedules a Redis write of the ordered ids (off the hot path via `after()`). */
export function scheduleListItemIdsWrite(listId: number, ids: number[], official: boolean): void {
  if (!redisCache) return;

  const ttl = official ? LIST_IDS_TTL.official : LIST_IDS_TTL.regular;
  after(async () => {
    try {
      if (!redisCache) return;
      await redisCache.set(listIdsKey(listId), JSON.stringify(ids), 'EX', ttl);
    } catch (error) {
      console.error('listItemsV2Cache write error', error);
    }
  });
}
