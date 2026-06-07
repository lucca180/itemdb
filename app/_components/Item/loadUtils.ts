import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getLebronItemData } from '@pages/api/v1/items/[id_name]/[tradings]';
import { getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import { getItemPrices } from '@pages/api/v1/items/[id_name]/prices';
import { getPetpetData } from '@pages/api/v1/items/[id_name]/petpet';
import { getNCTradeInsights } from '@pages/api/v1/mall/[iid]/insights';
import { getLastSeen } from '@pages/api/v1/prices/stats';
import { getPriceStatus } from '@pages/api/v1/prices/[iid]/status';
import { shouldShowTradeLists } from '@utils/utils';
import type {
  InsightsResponse,
  ItemData,
  ItemEffect,
  ItemPetpetData,
  LebronTrade,
  UserList,
  WearableData,
} from '@types';
import { getItemEffects } from '@pages/api/v1/items/[id_name]/effects';
import { getSingleItemColor } from '@pages/api/v1/items/[id_name]/colors';
import { getWearableData } from '@pages/api/v1/items/[id_name]/wearable';

export function hasNCTradeInsights(insights: InsightsResponse | null | undefined) {
  if (!insights) return false;
  return insights.releases.length > 0 || insights.ncEvents.length > 0;
}

export const getOfficialItemLists = cache((internalId: number) => getItemLists(internalId, true));

export const loadItemPageLists = cache(
  async (internalId: number): Promise<UserList[]> =>
    (await getOfficialItemLists(internalId)).filter((list) => !list.officialTag.includes('Avatar'))
);

export const loadItemEffects = cache(
  (item: ItemData): Promise<ItemEffect[]> => getItemEffects(item)
);

export const loadItemColors = cache((item: ItemData) => getSingleItemColor(item));

export const loadItemWearableData = cache(
  (internalId: number): Promise<WearableData> =>
    getWearableData(internalId) as Promise<WearableData>
);

export const loadNPPrices = cache((internalId: number) =>
  getItemPrices({ iid: internalId, includeUnconfirmed: true })
);

export const loadLastSeen = unstable_cache(
  (internal_id: number) => getLastSeen({ item_iid: internal_id }),
  ['item-last-seen'],
  { revalidate: 60 }
);

export const loadPriceStatus = cache((internalId: number, userId?: string) =>
  getPriceStatus(internalId, userId)
);

export const loadTradeLists = cache(async (item: ItemData) => {
  if (!shouldShowTradeLists(item)) return [];
  return getItemLists(item.internal_id, false);
});

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
  { revalidate: 60 }
);

export const loadLebronTradeHistory = unstable_cache(
  async (itemName: string): Promise<LebronTrade[]> => {
    const data = await getLebronItemData(itemName);
    return data?.reports ?? [];
  },
  ['item-lebron-trade-history'],
  { revalidate: 60 * 2 }
);
