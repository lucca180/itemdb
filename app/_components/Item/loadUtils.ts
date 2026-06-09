import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getAuctionData, getLebronItemData } from '@pages/api/v1/items/[id_name]/[tradings]';
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

const loadItemListCollections = cache(async (internalId: number, includeTrade: boolean) => {
  'use cache';
  if (includeTrade) {
    applyItemSectionCacheTags(internalId, 'lists', 'trade-lists');
  } else {
    applyItemSectionCacheTags(internalId, 'lists');
  }
  cacheLife('itemSection');
  return getItemLists(internalId, { includeOfficial: true, includeTrade });
});

export const getAllOfficialItemLists = cache(async (internalId: number, includeTrade = false) => {
  const { official } = await loadItemListCollections(internalId, includeTrade);
  return official;
});

export const getOfficialItemLists = cache(
  async (internalId: number, includeTrade = false): Promise<UserList[]> =>
    (await getAllOfficialItemLists(internalId, includeTrade)).filter(
      (list) => !list.officialTag.includes('Avatar')
    )
);

export const loadItemEffects = cache(async (item: ItemData): Promise<ItemEffect[]> => {
  'use cache';
  applyItemSectionCacheTags(item.internal_id, 'effects');
  cacheLife('homeSlow');
  const fresh = await getCachedItem(item.internal_id, true);
  return getItemEffects(fresh ?? item);
});

export const loadItemColors = cache(async (item: ItemData) => {
  'use cache';
  applyItemSectionCacheTags(item.internal_id, 'colors');
  cacheLife('homeSlow');
  const fresh = await getCachedItem(item.internal_id, true);
  return getSingleItemColor(fresh ?? ({ internal_id: item.internal_id } as ItemData));
});

export const loadItemWearableData = cache(async (internalId: number): Promise<WearableData> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'wearable');
  cacheLife('homeSlow');
  return getWearableData(internalId) as Promise<WearableData>;
});

export const loadNPPrices = cache(async (internalId: number) => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'np-prices');
  cacheLife('itemFast');
  return getItemPrices({ iid: internalId, includeUnconfirmed: true, limit: -1 });
});

export const loadLastSeen = cache(async (internalId: number) => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'last-seen');
  cacheLife('itemFast');
  return getLastSeen({ item_iid: internalId });
});

export const loadPriceStatus = cache((internalId: number, userId?: string) =>
  getPriceStatus(internalId, userId)
);

export const loadTradeLists = cache(async (item: ItemData) => {
  if (!shouldShowTradeLists(item)) return [];
  const { trade } = await loadItemListCollections(item.internal_id, true);
  return trade;
});

export const loadPetpetData = cache(async (internalId: number): Promise<ItemPetpetData | null> => {
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
});

export const loadNCTradeInsights = cache(
  async (internalId: number): Promise<InsightsResponse | null> => {
    'use cache';
    applyItemSectionCacheTags(internalId, 'nc-insights');
    cacheLife('homeFast');
    return getNCTradeInsights(internalId);
  }
);

export const loadNCMallData = cache(async (internalId: number): Promise<NCMallData | null> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'nc-mall');
  cacheLife('itemSection');
  return getItemNCMall(internalId);
});

export const loadLebronTradeHistory = cache(
  async (internalId: number, itemName: string): Promise<LebronTrade[]> => {
    'use cache';
    applyItemSectionCacheTags(internalId, 'lebron');
    cacheLife('homeFast');
    const data = await getLebronItemData(itemName);
    return data?.reports ?? [];
  }
);

export const loadMMEData = cache(async (internalId: number): Promise<ItemMMEData | null> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'mme');
  cacheLife('itemMedium');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem || !isMME(cachedItem.name)) return null;
  return getMMEData(cachedItem);
});

export const loadDyeData = cache(async (internalId: number): Promise<DyeworksData | null> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'dye');
  cacheLife('itemSection');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem?.isNC || !cachedItem.isWearable) return null;
  return getDyeworksData(cachedItem);
});

export const loadItemRecipes = cache(async (internalId: number): Promise<ItemRecipe[]> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'recipes');
  cacheLife('itemMedium');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem || cachedItem.isNC) return [];
  return getItemRecipes(cachedItem.internal_id);
});

export const loadItemAuctions = cache(async (internalId: number) => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'auction');
  cacheLife('itemSection');
  const [data, soldData] = await Promise.all([
    getAuctionData(internalId),
    getAuctionData(internalId, true),
  ]);

  return {
    recent: data.recent.slice(0, 20),
    totalSold: data.sold,
    soldMedianPrice: soldData.priceMedian,
  };
});

export const loadItemTrades = cache(async (internalId: number) => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'trade');
  cacheLife('itemSection');
  return getItemTrades({ item_iid: internalId });
});

export const loadItemParentData = cache(async (internalId: number): Promise<ItemData[]> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'parent');
  cacheLife('itemMedium');
  const { itemData } = await getItemParent(internalId);
  if (itemData.length === 0) return [];
  return [...itemData].sort((a, b) => (b.item_id ?? b.internal_id) - (a.item_id ?? a.internal_id));
});

export const loadAvyData = cache(
  async (internalId: number, includeTrade: boolean): Promise<AvyData[] | null> => {
    'use cache';
    applyItemSectionCacheTags(internalId, 'avy', 'lists');
    cacheLife('itemSection');
    const officialLists = await getAllOfficialItemLists(internalId, includeTrade);
    return getAvyData(internalId, officialLists);
  }
);
