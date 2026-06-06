import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import { getPetpetData } from '@pages/api/v1/items/[id_name]/petpet';
import type { ItemPetpetData } from '@types';

export const getOfficialItemLists = cache((internalId: number) => getItemLists(internalId, true));

export const loadPetpetData = unstable_cache(
  async (internalId: number): Promise<ItemPetpetData | null> => {
    const cachedItem = await getItem(internalId, true);
    if (
      !cachedItem ||
      cachedItem.isNC ||
      cachedItem.isWearable ||
      cachedItem.isBD ||
      cachedItem.isNeohome
    ) {
      return null;
    }
    return getPetpetData(cachedItem);
  },
  ['item-petpet-data'],
  { revalidate: 60 * 60 }
);
