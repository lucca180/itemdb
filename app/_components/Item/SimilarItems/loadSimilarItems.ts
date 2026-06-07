import { unstable_cache } from 'next/cache';
import { getSimilarItems } from '@pages/api/v1/items/[id_name]/similar';
import { itemSectionCacheTags } from '@utils/appCacheTags';
import type { ItemData } from '@types';

/** Cached ItemData[] of items similar to the current item (for ItemCard grid). */
export function loadSimilarItemData(item: ItemData): Promise<ItemData[]> {
  return unstable_cache(
    async () => getSimilarItems({ internal_id: item.internal_id, name: item.name } as ItemData),
    ['similar-items', String(item.internal_id), item.name],
    { revalidate: 60 * 60, tags: [...itemSectionCacheTags(item.internal_id, 'similar')] }
  )();
}
