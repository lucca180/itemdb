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
import { redisCache } from '@utils/api/redis';
import { runAfter } from '@utils/api/after';

/** Longer TTL for official lists (they change rarely); shorter for user lists. */
const LIST_IDS_TTL = { official: 60 * 60, regular: 5 * 60 } as const;

const listIdsKey = (listId: number) => `iv2:list:ids:${listId}`;

/** Returns the cached ordered ids for a list, or `null` on miss/error/no-redis. */
export async function readListItemIds(listId: number): Promise<number[] | null> {
  if (!redisCache) return null;

  let raw: string | null;
  try {
    // `commandTimeout` on redisCache enforces the fail-open latency ceiling.
    raw = await redisCache.get(listIdsKey(listId));
  } catch (error) {
    console.error('listItemsV2Cache redis error', error);
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as number[]) : null;
  } catch {
    return null;
  }
}

/** Schedules a Redis write of the ordered ids (off the hot path via `after()`). */
export async function scheduleListItemIdsWrite(
  listId: number,
  ids: number[],
  official: boolean
): Promise<void> {
  if (!redisCache) return;

  const ttl = official ? LIST_IDS_TTL.official : LIST_IDS_TTL.regular;
  await runAfter(async () => {
    try {
      if (!redisCache) return;
      await redisCache.set(listIdsKey(listId), JSON.stringify(ids), 'EX', ttl);
    } catch (error) {
      console.error('listItemsV2Cache write error', error);
    }
  });
}
