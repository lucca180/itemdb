import { unstable_cache } from 'next/cache';
import { getItemDrops, SKIP_ITEMS } from '@pages/api/v1/items/[id_name]/drops';
import { getManyItems } from '@pages/api/v1/items/many';
import type { ItemData, ItemOpenable } from '@types';

/**
 * Loaders for the item page drops card.
 *
 * Two layers of data:
 * - ItemOpenable: openable metadata (pools, odds, drop rates) — no full item records
 * - ItemData[]: full item records for each drop, used to render ItemCard
 */

/** Combined openable meta + drop item records for the drops card. */
export type ItemDropsCardData = {
  itemOpenable: ItemOpenable;
  dropItemData: ItemData[];
};

/** Uncached fetch of full ItemData rows by internal_id (used inside drop-item cache). */
async function fetchManyItemDataByIids(internalIds: number[]): Promise<ItemData[]> {
  if (internalIds.length === 0) return [];
  const items = await getManyItems({ id: internalIds.map(String) });
  return Object.values(items);
}

/** Cached ItemOpenable lookup by capsule internal_id. */
const loadItemOpenableMetaCached = unstable_cache(
  async (internalId: number, isNC: boolean): Promise<ItemOpenable | null> => {
    if (SKIP_ITEMS.includes(internalId)) return null;
    return getItemDrops(internalId, isNC);
  },
  ['item-openable'],
  { revalidate: 60 }
);

/**
 * Returns ItemOpenable for an item (pools, odds, drop iids).
 * Returns null when the item cannot open or has no drop data.
 */
export async function loadItemOpenableMeta(item: ItemData): Promise<ItemOpenable | null> {
  if (item.useTypes.canOpen === 'false') return null;
  return loadItemOpenableMetaCached(item.internal_id, item.isNC);
}

/** Cached ItemData[] lookup for a set of drop internal_ids. */
const loadDropItemCardDataCached = unstable_cache(
  async (internalIdsKey: string): Promise<ItemData[]> => {
    if (!internalIdsKey) return [];
    const internalIds = internalIdsKey.split(',').map(Number);
    return fetchManyItemDataByIids(internalIds);
  },
  ['item-drop-items'],
  { revalidate: 60 * 2 }
);

/**
 * Returns full ItemData for each drop internal_id (ItemCard rendering).
 * Input ids come from ItemOpenable.drops keys.
 */
export async function loadDropItemCardData(dropInternalIds: number[]): Promise<ItemData[]> {
  if (dropInternalIds.length === 0) return [];
  const internalIdsKey = [...dropInternalIds].sort((a, b) => a - b).join(',');
  return loadDropItemCardDataCached(internalIdsKey);
}

/** Loads both ItemOpenable meta and drop ItemData in one call. */
export async function loadItemDropsCardData(item: ItemData): Promise<ItemDropsCardData | null> {
  const itemOpenable = await loadItemOpenableMeta(item);
  if (!itemOpenable) return null;

  const dropItemData = await loadDropItemCardData(Object.keys(itemOpenable.drops).map(Number));

  return { itemOpenable, dropItemData };
}
