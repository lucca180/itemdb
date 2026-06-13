import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { getItemDrops, SKIP_ITEMS } from '@pages/api/v1/items/[id_name]/drops';
import { getManyItems } from '@pages/api/v1/items/many';
import { applyItemSectionCacheTags } from '@utils/applyItemCacheTags';
import type { ItemData, ItemOpenable } from '@types';

/**
 * Loaders for the item page drops card.
 *
 * Two layers of data:
 * - ItemOpenable: openable metadata (pools, odds, drop rates) — no full item records
 * - ItemData[]: full item records for each drop, used to render ItemCard
 */

export type ItemDropsCardData = {
  itemOpenable: ItemOpenable;
  dropItemData: ItemData[];
};

async function fetchManyItemDataByIids(internalIds: number[]): Promise<ItemData[]> {
  if (internalIds.length === 0) return [];
  const items = await getManyItems({ id: internalIds.map(String) });
  return Object.values(items);
}

export const loadItemOpenableMeta = cache(async (item: ItemData): Promise<ItemOpenable | null> => {
  'use cache';
  applyItemSectionCacheTags(item.internal_id, 'drops');
  cacheLife('itemFast');
  if (item.useTypes.canOpen === 'false') return null;
  if (SKIP_ITEMS.includes(item.internal_id)) return null;
  return getItemDrops(item.internal_id);
});

export const loadDropItemCardData = cache(
  async (parentInternalId: number, dropInternalIds: number[]): Promise<ItemData[]> => {
    'use cache';
    applyItemSectionCacheTags(parentInternalId, 'drop-items');
    cacheLife('itemFast');
    if (dropInternalIds.length === 0) return [];
    const sortedIds = [...dropInternalIds].sort((a, b) => a - b);
    return fetchManyItemDataByIids(sortedIds);
  }
);

export async function loadItemDropsCardData(item: ItemData): Promise<ItemDropsCardData | null> {
  const itemOpenable = await loadItemOpenableMeta(item);
  if (!itemOpenable) return null;

  const dropItemData = await loadDropItemCardData(
    item.internal_id,
    Object.keys(itemOpenable.drops).map(Number)
  );

  return { itemOpenable, dropItemData };
}
