import { cacheLife } from 'next/cache';
import { getSimilarItems } from '@pages/api/v1/items/[id_name]/similar';
import { applyItemSectionCacheTags } from '@utils/applyItemCacheTags';
import type { ItemData } from '@types';

async function loadSimilarItemDataCached(
  internalId: number,
  itemName: string
): Promise<ItemData[]> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'similar');
  cacheLife('itemMedium');
  return getSimilarItems({ internal_id: internalId, name: itemName } as ItemData);
}

/** Cached ItemData[] of items similar to the current item (for ItemCard grid). */
export function loadSimilarItemData(item: ItemData): Promise<ItemData[]> {
  return loadSimilarItemDataCached(item.internal_id, item.name);
}
