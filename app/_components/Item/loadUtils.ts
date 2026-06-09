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
  AvyData,
  InsightsResponse,
  ItemData,
  ItemEffect,
  ItemMMEData,
  ItemPetpetData,
  ItemRecipe,
  LebronTrade,
  NCMallData,
  UserList,
  WearableData,
} from '@types';
import { getItemEffects } from '@pages/api/v1/items/[id_name]/effects';
import { getSingleItemColor } from '@pages/api/v1/items/[id_name]/colors';
import { getWearableData } from '@pages/api/v1/items/[id_name]/wearable';
import { getMMEData, isMME } from '@pages/api/v1/items/[id_name]/mme';
import { getDyeworksData, type DyeworksData } from '@pages/api/v1/items/[id_name]/dyeworks';
import { getItemRecipes } from '@pages/api/v1/items/[id_name]/recipes';
import { getItemTrades } from '@pages/api/v1/trades';
import { getItemParent } from '@pages/api/v1/items/[id_name]/drops';
import { getAvyData } from '@pages/api/v1/items/[id_name]/avys';

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

async function loadMMEDataCached(internalId: number): Promise<ItemMMEData | null> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'mme');
  cacheLife('itemMedium');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem || !isMME(cachedItem.name)) return null;
  return getMMEData(cachedItem);
}

export async function loadMMEData(internalId: number): Promise<ItemMMEData | null> {
  return loadMMEDataCached(internalId);
}

async function loadDyeDataCached(internalId: number): Promise<DyeworksData | null> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'dye');
  cacheLife('itemSection');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem?.isNC || !cachedItem.isWearable) return null;
  return getDyeworksData(cachedItem);
}

export async function loadDyeData(internalId: number): Promise<DyeworksData | null> {
  return loadDyeDataCached(internalId);
}

async function loadItemRecipesCached(internalId: number): Promise<ItemRecipe[]> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'recipes');
  cacheLife('itemMedium');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem || cachedItem.isNC) return [];
  return getItemRecipes(cachedItem.internal_id);
}

export async function loadItemRecipes(internalId: number): Promise<ItemRecipe[]> {
  return loadItemRecipesCached(internalId);
}

async function loadItemTradesCached(internalId: number) {
  'use cache';
  applyItemSectionCacheTags(internalId, 'trade');
  cacheLife('itemSection');
  return getItemTrades({ item_iid: internalId });
}

export async function loadItemTrades(internalId: number) {
  return loadItemTradesCached(internalId);
}

async function loadItemParentDataCached(internalId: number): Promise<ItemData[]> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'parent');
  cacheLife('itemMedium');
  const { itemData } = await getItemParent(internalId);
  if (itemData.length === 0) return [];
  return [...itemData].sort((a, b) => (b.item_id ?? b.internal_id) - (a.item_id ?? a.internal_id));
}

export async function loadItemParentData(internalId: number): Promise<ItemData[]> {
  return loadItemParentDataCached(internalId);
}

async function loadAvyDataCached(
  internalId: number,
  includeTrade: boolean
): Promise<AvyData[] | null> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'avy', 'lists');
  cacheLife('itemSection');
  const officialLists = await getOfficialItemLists(internalId, includeTrade);
  return getAvyData(internalId, officialLists);
}

export async function loadAvyData(
  internalId: number,
  includeTrade: boolean
): Promise<AvyData[] | null> {
  return loadAvyDataCached(internalId, includeTrade);
}
