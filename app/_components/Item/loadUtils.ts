import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getLebronItemData } from '@pages/api/v1/items/[id_name]/[tradings]';
import { getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import { getPetpetData } from '@pages/api/v1/items/[id_name]/petpet';
import { getNCTradeInsights } from '@pages/api/v1/mall/[iid]/insights';
import type { InsightsResponse, ItemPetpetData, LebronTrade } from '@types';

export function hasNCTradeInsights(insights: InsightsResponse | null | undefined) {
  if (!insights) return false;
  return insights.releases.length > 0 || insights.ncEvents.length > 0;
}

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

export const loadNCTradeInsights = unstable_cache(
  async (internalId: number): Promise<InsightsResponse | null> => {
    return getNCTradeInsights(internalId);
  },
  ['item-nc-trade-insights'],
  { revalidate: 60 * 60 }
);

export const loadLebronTradeHistory = unstable_cache(
  async (itemName: string): Promise<LebronTrade[]> => {
    const data = await getLebronItemData(itemName);
    return data?.reports ?? [];
  },
  ['item-lebron-trade-history'],
  { revalidate: 60 * 5 }
);
