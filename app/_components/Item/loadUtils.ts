import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getLebronItemData } from '@pages/api/v1/items/[id_name]/[tradings]';
import { getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import { getItemPrices } from '@pages/api/v1/items/[id_name]/prices';
import { getPetpetData } from '@pages/api/v1/items/[id_name]/petpet';
import { getNCTradeInsights } from '@pages/api/v1/mall/[iid]/insights';
import { getItemNCMall } from '@pages/api/v1/items/[id_name]/ncmall';
import { getLastSeen } from '@pages/api/v1/prices/stats';
import { getPriceStatus } from '@pages/api/v1/prices/[iid]/status';
import { applyItemSectionCacheTags } from '@utils/applyItemCacheTags';
import { shouldShowTradeLists } from '@utils/utils';
import type {
  InsightsResponse,
  ItemData,
  ItemEffect,
  ItemPetpetData,
  LebronTrade,
  NCMallData,
  UserList,
  WearableData,
} from '@types';
import { getItemEffects } from '@pages/api/v1/items/[id_name]/effects';
import { getSingleItemColor } from '@pages/api/v1/items/[id_name]/colors';
import { getWearableData } from '@pages/api/v1/items/[id_name]/wearable';

export const getCachedItem = cache(async (id_name: number | string, flags = false) => {
  'use cache';
  cacheLife('itemFast');
  const item = await getItem(id_name, flags);
  if (!item) return null;

  applyItemSectionCacheTags(item.internal_id);
  return item;
});

export function hasNCTradeInsights(insights: InsightsResponse | null | undefined) {
  if (!insights) return false;
  return insights.releases.length > 0 || insights.ncEvents.length > 0;
}

async function loadItemListCollectionsCached(internalId: number, includeTrade: boolean) {
  'use cache';
  if (includeTrade) {
    applyItemSectionCacheTags(internalId, 'lists', 'trade-lists');
  } else {
    applyItemSectionCacheTags(internalId, 'lists');
  }
  cacheLife('itemSection');
  return getItemLists(internalId, { includeOfficial: true, includeTrade });
}

const loadItemListCollections = cache((internalId: number, includeTrade: boolean) =>
  loadItemListCollectionsCached(internalId, includeTrade)
);

export const getOfficialItemLists = cache(async (internalId: number, includeTrade = false) => {
  const { official } = await loadItemListCollections(internalId, includeTrade);
  return official;
});

export const loadItemPageLists = cache(
  async (internalId: number, includeTrade = false): Promise<UserList[]> =>
    (await getOfficialItemLists(internalId, includeTrade)).filter(
      (list) => !list.officialTag.includes('Avatar')
    )
);

async function loadItemEffectsCached(
  internalId: number,
  itemSnapshot: ItemData
): Promise<ItemEffect[]> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'effects');
  cacheLife('homeSlow');
  const fresh = await getCachedItem(internalId, true);
  return getItemEffects(fresh ?? itemSnapshot);
}

export async function loadItemEffects(item: ItemData): Promise<ItemEffect[]> {
  return loadItemEffectsCached(item.internal_id, item);
}

async function loadItemColorsCached(
  internalId: number
): Promise<Awaited<ReturnType<typeof getSingleItemColor>>> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'colors');
  cacheLife('homeSlow');
  const fresh = await getCachedItem(internalId, true);
  return getSingleItemColor(fresh ?? ({ internal_id: internalId } as ItemData));
}

export async function loadItemColors(item: ItemData) {
  return loadItemColorsCached(item.internal_id);
}

async function loadItemWearableDataCached(internalId: number): Promise<WearableData> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'wearable');
  cacheLife('homeSlow');
  return getWearableData(internalId) as Promise<WearableData>;
}

export async function loadItemWearableData(internalId: number): Promise<WearableData> {
  return loadItemWearableDataCached(internalId);
}

async function loadNPPricesCached(internalId: number) {
  'use cache';
  applyItemSectionCacheTags(internalId, 'np-prices');
  cacheLife('itemFast');
  return getItemPrices({ iid: internalId, includeUnconfirmed: true, limit: -1 });
}

export const loadNPPrices = cache((internalId: number) => loadNPPricesCached(internalId));

async function loadLastSeenCached(internalId: number) {
  'use cache';
  applyItemSectionCacheTags(internalId, 'last-seen');
  cacheLife('itemFast');
  return getLastSeen({ item_iid: internalId });
}

export async function loadLastSeen(internalId: number) {
  return loadLastSeenCached(internalId);
}

export const loadPriceStatus = cache((internalId: number, userId?: string) =>
  getPriceStatus(internalId, userId)
);

export const loadTradeLists = cache(async (item: ItemData) => {
  if (!shouldShowTradeLists(item)) return [];
  const { trade } = await loadItemListCollections(item.internal_id, true);
  return trade;
});

async function loadPetpetDataCached(internalId: number): Promise<ItemPetpetData | null> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'petpet');
  cacheLife('homeSlow');
  const cachedItem = await getCachedItem(internalId, true);
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
}

export async function loadPetpetData(internalId: number): Promise<ItemPetpetData | null> {
  return loadPetpetDataCached(internalId);
}

async function loadNCTradeInsightsCached(internalId: number): Promise<InsightsResponse | null> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'nc-insights');
  cacheLife('homeFast');
  return getNCTradeInsights(internalId);
}

export async function loadNCTradeInsights(internalId: number): Promise<InsightsResponse | null> {
  return loadNCTradeInsightsCached(internalId);
}

async function loadNCMallDataCached(internalId: number): Promise<NCMallData | null> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'nc-mall');
  cacheLife('itemSection');
  return getItemNCMall(internalId);
}

export const loadNCMallData = cache((internalId: number) => loadNCMallDataCached(internalId));

async function loadLebronTradeHistoryCached(
  internalId: number,
  itemName: string
): Promise<LebronTrade[]> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'lebron');
  cacheLife('homeFast');
  const data = await getLebronItemData(itemName);
  return data?.reports ?? [];
}

export async function loadLebronTradeHistory(
  internalId: number,
  itemName: string
): Promise<LebronTrade[]> {
  return loadLebronTradeHistoryCached(internalId, itemName);
}
