import { ItemService } from '@services/ItemService';
import type { ItemIntent, ItemV2For, UserList } from '@types';
import { defaultFilters } from '@utils/parseFilters';
import { readListItemIds, scheduleListItemIdsWrite } from '@services/list/listItemsV2Cache';

/** Matches the v1 `getListItems` behaviour: fetch every member item. */
const LIST_ITEMS_LIMIT = 100000;

export type FetchListItemsV2Opts<I extends ItemIntent> = {
  /** Whether the viewer (owner/admin) may see hidden items. Disables the id cache. */
  includeHidden: boolean;
  /** Response preset for the item payloads. */
  intent: I;
  /** `true` → keyed by `internal_id`; `false` → array (preserves id order). */
  asObject: boolean;
  /** Bypass both the id cache and the item cache. */
  fresh: boolean;
};

export type FetchListItemsV2Result<I extends ItemIntent> = {
  data: ItemV2For<I>[] | Record<string, ItemV2For<I>>;
  /** Distinct items loaded from Prisma on this request — used for API quota. */
  dbCount: number;
};

/**
 * Fetches a list's items as `ItemV2` (data layer for the v2 itemdata endpoint).
 *
 * Two cache layers, both accessed through `ItemService`:
 * 1. Ordered member ids — Redis (`listItemsV2Cache`), only for the public
 *    (non-hidden) view; on a miss they come from `ItemService.search`.
 * 2. Item payloads — the shared per-item cache via `ItemService.getCachedManyItems`.
 *
 * The `list` must already be resolved and authorized by the caller
 * (`ListService.getListItemsV2` owns resolution, visibility and the search-list guard).
 */
export async function fetchListItemsV2<I extends ItemIntent>(
  list: UserList,
  opts: FetchListItemsV2Opts<I>
): Promise<FetchListItemsV2Result<I>> {
  const { includeHidden, intent, asObject, fresh } = opts;

  // 1. Ordered ids. The id cache is skipped for the owner/admin (hidden) view
  //    and when `fresh` is requested.
  const useIdCache = !includeHidden && !fresh;

  let ids = useIdCache ? await readListItemIds(list.internal_id) : null;

  if (!ids) {
    // `search` always does `SELECT *`, so `minimal` here only means "map the
    // membership rows cheaply" — we just need the ordered internal_ids.
    const { content } = await ItemService.search(
      '',
      { ...defaultFilters, limit: LIST_ITEMS_LIMIT },
      { intent: 'minimal', list: { id: list.internal_id, includeHidden } }
    );
    ids = content.map((item) => item.internal_id);

    // Never cache ids that include hidden items.
    if (!includeHidden) scheduleListItemIdsWrite(list.internal_id, ids, !!list.official);
  }

  // 2. Payloads via the shared item cache. Returns `{ body, dbCount }` so quota
  //    still counts only Prisma-backed items.
  const { body, dbCount } = await ItemService.getCachedManyItems(
    { type: 'id', data: ids.map(String) },
    { intent, limit: LIST_ITEMS_LIMIT, fresh }
  );
  const itemsById = JSON.parse(body) as Record<string, ItemV2For<I>>;

  if (asObject) return { data: itemsById, dbCount };

  // Array response preserves the id order and drops any id that no longer resolves.
  const data = ids.map((id) => itemsById[id]).filter(Boolean) as ItemV2For<I>[];
  return { data, dbCount };
}
