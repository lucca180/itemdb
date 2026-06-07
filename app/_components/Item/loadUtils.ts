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
import { itemSectionCacheTags } from '@utils/appCacheTags';
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

export const getCachedItem = cache((id_name: number | string, flags = false) =>
  getItem(id_name, flags)
);

export function hasNCTradeInsights(insights: InsightsResponse | null | undefined) {
  if (!insights) return false;
  return insights.releases.length > 0 || insights.ncEvents.length > 0;
}

export const getOfficialItemLists = cache((internalId: number) => getItemLists(internalId, true));

export const loadItemPageLists = cache(
  async (internalId: number): Promise<UserList[]> =>
    (await getOfficialItemLists(internalId)).filter((list) => !list.officialTag.includes('Avatar'))
);

export async function loadItemEffects(item: ItemData): Promise<ItemEffect[]> {
  const internalId = item.internal_id;
  return unstable_cache(
    async () => {
      const fresh = await getItem(internalId, true);
      return getItemEffects(fresh ?? item);
    },
    ['item-effects', String(internalId)],
    { revalidate: 60 * 60, tags: [...itemSectionCacheTags(internalId, 'effects')] }
  )();
}

export async function loadItemColors(item: ItemData) {
  const internalId = item.internal_id;
  return unstable_cache(
    async () => {
      const fresh = await getItem(internalId, true);
      return getSingleItemColor(fresh ?? item);
    },
    ['item-colors', String(internalId)],
    { revalidate: 60 * 60, tags: [...itemSectionCacheTags(internalId, 'colors')] }
  )();
}

export async function loadItemWearableData(internalId: number): Promise<WearableData> {
  return unstable_cache(
    async () => getWearableData(internalId) as Promise<WearableData>,
    ['item-wearable', String(internalId)],
    { revalidate: 60 * 60, tags: [...itemSectionCacheTags(internalId, 'wearable')] }
  )();
}

export const loadNPPrices = cache((internalId: number) =>
  getItemPrices({ iid: internalId, includeUnconfirmed: true })
);

export async function loadLastSeen(internalId: number) {
  return unstable_cache(
    async () => getLastSeen({ item_iid: internalId }),
    ['item-last-seen', String(internalId)],
    { revalidate: 60, tags: [...itemSectionCacheTags(internalId, 'last-seen')] }
  )();
}

export const loadPriceStatus = cache((internalId: number, userId?: string) =>
  getPriceStatus(internalId, userId)
);

export const loadTradeLists = cache(async (item: ItemData) => {
  if (!shouldShowTradeLists(item)) return [];
  return getItemLists(item.internal_id, false);
});

export async function loadPetpetData(internalId: number): Promise<ItemPetpetData | null> {
  return unstable_cache(
    async () => {
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
    ['item-petpet-data', String(internalId)],
    { revalidate: 60 * 60, tags: [...itemSectionCacheTags(internalId, 'petpet')] }
  )();
}

export async function loadNCTradeInsights(internalId: number): Promise<InsightsResponse | null> {
  return unstable_cache(
    async () => getNCTradeInsights(internalId),
    ['item-nc-trade-insights', String(internalId)],
    { revalidate: 3 * 60, tags: [...itemSectionCacheTags(internalId, 'nc-insights')] }
  )();
}

export async function loadLebronTradeHistory(
  internalId: number,
  itemName: string
): Promise<LebronTrade[]> {
  return unstable_cache(
    async () => {
      const data = await getLebronItemData(itemName);
      return data?.reports ?? [];
    },
    ['item-lebron-trade-history', String(internalId), itemName],
    { revalidate: 3 * 60, tags: [...itemSectionCacheTags(internalId, 'lebron')] }
  )();
}
