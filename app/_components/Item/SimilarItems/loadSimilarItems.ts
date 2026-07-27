import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { getSimilarItems } from '@pages/api/v1/items/[id_name]/similar';
import { applyItemSectionCacheTags } from '@utils/item/applyItemCacheTags';
import type { ItemData } from '@types';

export const loadSimilarItemData = cache(
  async (internalId: number, name: string): Promise<ItemData[]> => {
    'use cache';
    applyItemSectionCacheTags(internalId, 'similar');
    cacheLife('itemMedium');
    return getSimilarItems({ internal_id: internalId, name } as ItemData);
  }
);
