import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { getItemForPage } from '@app/server/items';
import { getAuctionData, getTradeData } from '@app/server/items/tradingHistoryData';
import { getLebronItemData } from '@pages/api/v1/items/[id_name]/[tradings]';
import { getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import { getItemPrices } from '@pages/api/v1/items/[id_name]/prices';
import { getPetpetData } from '@pages/api/v1/items/[id_name]/petpet';
import { getNCTradeInsights } from '@pages/api/v1/mall/[iid]/insights';
import { getItemNCMall } from '@pages/api/v1/items/[id_name]/ncmall';
import { getLastSeen } from '@pages/api/v1/prices/stats';
import { getPriceStatus } from '@pages/api/v1/prices/[iid]/status';
import { applyItemSectionCacheTags } from '@utils/item/applyItemCacheTags';
import { getCachedNow } from '@utils/getCachedNow';
import { shouldShowTradeLists } from '@utils/utils';
import { getManualPriceMarkers, resolveOfficialListMarkers } from '@app/server/items/priceMarkers';
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
import { getItemParent } from '@pages/api/v1/items/[id_name]/drops';
import { getAvyData } from '@pages/api/v1/items/[id_name]/avys';
import { itemRootTag } from '@utils/appCacheTags';
import prisma from '@utils/prisma';
import { getAllNeopetsColors } from '@app/server/petColors';
import { allSpecies, findPetColorName } from '@utils/pet-utils';
import {
  PRICE_TABLE_INITIAL_LIMIT,
  toPriceSummary,
} from '@app/_components/Item/Price/itemPriceUtils';

export const getCachedItem = cache(async (id_name: number | string, flags = false) => {
  'use cache';
  cacheLife('itemFast');
  const item = await getItemForPage(id_name, flags);
  if (!item) return null;

  cacheTag(itemRootTag(item.internal_id));
  applyItemSectionCacheTags(item.internal_id);
  return item;
});

const loadItemListCollections = cache(async (internalId: number, includeTrade: boolean) => {
  if (includeTrade) {
    applyItemSectionCacheTags(internalId, 'lists', 'trade-lists');
  } else {
    applyItemSectionCacheTags(internalId, 'lists');
  }
  return getItemLists(internalId, { includeOfficial: true, includeTrade });
});

export const getAllOfficialItemLists = cache(async (internalId: number, includeTrade = false) => {
  'use cache';
  const { official } = await loadItemListCollections(internalId, includeTrade);

  cacheLife('itemSection');

  return official;
});

export const getOfficialItemLists = cache(
  async (internalId: number, includeTrade = false): Promise<UserList[]> =>
    (await getAllOfficialItemLists(internalId, includeTrade)).filter(
      (list) => !list.officialTag.includes('Avatar')
    )
);

/**
 * Presentation-ready price markers for the item page (table/chart).
 * Uses the shared official-lists cache, then resolves dates/clamping server-side.
 */
/**
 * Presentation-ready price markers for the item page (table/chart).
 * Uses the shared official-lists cache, then resolves dates/clamping server-side.
 */
export const loadItemPriceMarkers = cache(
  async (internalId: number, firstSeen: string | null, includeTrade = false) => {
    'use cache';
    applyItemSectionCacheTags(internalId, 'markers', 'lists');
    cacheLife('itemFast');
    const itemRef = { internal_id: internalId, firstSeen };
    const [lists, manual] = await Promise.all([
      getOfficialItemLists(internalId, includeTrade),
      getManualPriceMarkers(itemRef),
    ]);
    return [...resolveOfficialListMarkers(lists, itemRef), ...manual];
  }
);

export const loadItemEffects = cache(async (internalId: number): Promise<ItemEffect[]> => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'effects');
  cacheLife('homeSlow');
  const fresh = await getCachedItem(internalId, true);
  return getItemEffects(fresh ?? ({ internal_id: internalId } as ItemData));
});

export const loadItemColors = cache(async (internalId: number) => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'colors');
  cacheLife('homeSlow');
  const fresh = await getCachedItem(internalId, true);
  return getSingleItemColor(fresh ?? ({ internal_id: internalId } as ItemData));
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

export const loadNPPricesSummary = cache(async (internalId: number) => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'np-prices');
  cacheLife('itemFast');
  const prices = await getItemPrices({
    iid: internalId,
    includeUnconfirmed: true,
    limit: PRICE_TABLE_INITIAL_LIMIT + 1,
  });
  return toPriceSummary(prices, PRICE_TABLE_INITIAL_LIMIT);
});

export const loadLastSeen = cache(async (internalId: number) => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'last-seen');
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  return getLastSeen({ item_iid: internalId });
});

export const loadPriceStatus = cache((internalId: number, userId?: string) =>
  getPriceStatus(internalId, userId)
);

export const loadTradeLists = cache(async (internalId: number) => {
  'use cache';
  const item = await getCachedItem(internalId);
  if (!item || !shouldShowTradeLists(item, await getCachedNow())) {
    cacheLife('itemMedium');
    return [];
  }
  const { trade } = await loadItemListCollections(internalId, true);

  cacheLife('itemSection');

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
    cacheLife('itemSection');
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
    cacheLife('itemFast');
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
  cacheLife('itemMedium');
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

export const loadItemTrades = cache(async (internalId: number, includeRelisting: boolean) => {
  'use cache';
  applyItemSectionCacheTags(internalId, 'trade');
  cacheLife('itemSection');
  const trades = await getTradeData(internalId, false, includeRelisting);
  return trades.recent.slice(0, 20);
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
    cacheLife('itemMedium');
    const officialLists = await getAllOfficialItemLists(internalId, includeTrade);
    return getAvyData(internalId, officialLists);
  }
);

/** Displayable PetStyle row for item → Pet Styles Related Links. */
export type PetStyleLinkData = {
  speciesName: string;
  /** Null when colour-agnostic (`/{species}/unknown`). */
  colorName: string | null;
  series: string;
};

export const loadPetStyleForItem = cache(
  async (internalId: number): Promise<PetStyleLinkData | null> => {
    'use cache';
    applyItemSectionCacheTags(internalId, 'pet-style');
    cacheLife('itemSection');

    const row = await prisma.petStyle.findFirst({
      where: {
        needsReview: false,
        species_id: { not: null },
        OR: [{ item_iid: internalId }, { item: { canonical_id: internalId } }],
      },
      select: {
        species_id: true,
        color_id: true,
        series: true,
      },
    });

    if (row?.species_id == null) return null;

    const speciesName = allSpecies[String(row.species_id)];
    if (!speciesName) return null;

    if (row.color_id == null) {
      return { speciesName, colorName: null, series: row.series };
    }

    const colors = await getAllNeopetsColors();
    const colorName = findPetColorName(row.color_id, colors);
    if (!colorName) return null;

    return { speciesName, colorName, series: row.series };
  }
);
