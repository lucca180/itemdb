import { unstable_cache } from 'next/cache';
import { getSimilarItems } from '@pages/api/v1/items/[id_name]/similar';
import type { ItemData } from '@types';

const loadSimilarItemDataCached = unstable_cache(
  async (internalId: number, itemName: string): Promise<ItemData[]> => {
    return getSimilarItems({ internal_id: internalId, name: itemName } as ItemData);
  },
  ['similar-items'],
  { revalidate: 60 * 60 }
);

/** Cached ItemData[] of items similar to the current item (for ItemCard grid). */
export function loadSimilarItemData(item: ItemData): Promise<ItemData[]> {
  return loadSimilarItemDataCached(item.internal_id, item.name);
}
