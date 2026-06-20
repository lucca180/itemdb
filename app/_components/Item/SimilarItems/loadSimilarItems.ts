import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { getSimilarItems } from '@pages/api/v1/items/[id_name]/similar';
import { applyItemSectionCacheTags } from '@utils/item/applyItemCacheTags';
import type { ItemData } from '@types';

export const loadSimilarItemData = cache(async (item: ItemData): Promise<ItemData[]> => {
  'use cache';
  applyItemSectionCacheTags(item.internal_id, 'similar');
  cacheLife('itemMedium');
  return getSimilarItems({ internal_id: item.internal_id, name: item.name } as ItemData);
});
