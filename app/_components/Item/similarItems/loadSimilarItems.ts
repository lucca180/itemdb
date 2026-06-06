import { unstable_cache } from 'next/cache';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getSimilarItems } from '@pages/api/v1/items/[id_name]/similar';
import type { ItemData } from '@types';

/** Cached ItemData[] of items similar to the current item (for ItemCard grid). */
export const loadSimilarItemData = unstable_cache(
  async (internalId: number): Promise<ItemData[]> => {
    const item = await getItem(internalId, true);
    if (!item) return [];
    return getSimilarItems(item);
  },
  ['similar-items'],
  { revalidate: 60 * 60 }
);
