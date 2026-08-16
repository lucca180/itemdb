import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { getItemDrops, SKIP_ITEMS } from '@pages/api/v1/items/[id_name]/drops';
import { getManyItems } from '@pages/api/v1/items/many';
import { applyItemSectionCacheTags } from '@utils/item/applyItemCacheTags';
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
  return Object.values(items).sort((a, b) => a.internal_id - b.internal_id);
}

export const loadItemOpenableMeta = cache(
  async (internalId: number, canOpen: string): Promise<ItemOpenable | null> => {
    'use cache';
    applyItemSectionCacheTags(internalId, 'drops');
    cacheLife('itemFast');
    if (canOpen === 'false') return null;
    if (SKIP_ITEMS.includes(internalId)) return null;
    return getItemDrops(internalId);
  }
);

export const loadDropItemCardData = cache(
  async (parentInternalId: number, dropInternalIds: number[]): Promise<ItemData[]> => {
    'use cache';
    applyItemSectionCacheTags(parentInternalId, 'drop-items');
    cacheLife('itemFast');
    if (dropInternalIds.length === 0) return [];
    // Caller must pass IDs already sorted — order is part of the cache key.
    return fetchManyItemDataByIids(dropInternalIds);
  }
);

/**
 * True when the item page actually renders the drops card (accepted drops exist).
 * Cached hard — this boolean rarely flips. Drops-section tags still bust it on openings.
 */
export const hasDisplayedDrops = cache(
  async (internalId: number, canOpen: string): Promise<boolean> => {
    'use cache';
    applyItemSectionCacheTags(internalId, 'drops');
    cacheLife('days');
    const itemOpenable = await loadItemOpenableMeta(internalId, canOpen);
    return Boolean(itemOpenable && Object.keys(itemOpenable.drops).length > 0);
  }
);

export async function loadItemDropsCardData(item: ItemData): Promise<ItemDropsCardData | null> {
  const itemOpenable = await loadItemOpenableMeta(item.internal_id, item.useTypes.canOpen);
  if (!itemOpenable) return null;

  const dropInternalIds = Object.keys(itemOpenable.drops)
    .map(Number)
    .sort((a, b) => a - b);
  const dropItemData = await loadDropItemCardData(item.internal_id, dropInternalIds);

  return { itemOpenable, dropItemData };
}
