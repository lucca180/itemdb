import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { doSearchV2 } from '@app/server/search/searchV2';
import { getSearchStats } from '@pages/api/v1/search/stats';
import type { ItemV2For, SearchFilters, SearchStats, ShopInfo } from '@types';
import { fitCacheTag } from '@utils/appCacheTags';
import { getRestockProfitV2 } from '@utils/item/v2';
import { removeOutliers, restockShopInfo, shopIDToCategory } from '@utils/utils';
import { INITIAL_MIN_PROFIT, RESTOCK_FILTER } from '@utils/restock-filters';
import { mean } from 'simple-statistics';

/** Items shipped in the SSR payload; the rest streams in via server action (tier 3). */
export const RESTOCK_PRELOAD_LIMIT = 32;

export type RestockShopData = {
  totalItems: number;
  profitableCount: number;
  profitMean: number;
  similarShops: ShopInfo[];
  fullItems: ItemV2For<'card'>[];
};

/**
 * Full profitable item list + header counts for a restock shop.
 * Cached so the SSR preload and the client `loadRestockShopItems` action share
 * a single `doSearchV2` run.
 */
export async function getRestockShopData(shopInfo: ShopInfo): Promise<RestockShopData> {
  'use cache';
  cacheTag(fitCacheTag(`restock-shop-${shopInfo.id}`));
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const filters: SearchFilters = RESTOCK_FILTER(shopInfo.id);
  filters.restockProfit = '';
  const result = await doSearchV2('', filters, { intent: 'card' });

  const fullItems = result.content
    .filter((item) => (getRestockProfitV2(item) ?? 0) >= INITIAL_MIN_PROFIT)
    .sort((a, b) => sortItemsByPriceDesc(a, b));

  return {
    totalItems: result.content.length,
    profitableCount: fullItems.length,
    profitMean: computeProfitMean(fullItems),
    similarShops: getSimilarShops(shopInfo),
    fullItems,
  };
}

/** Facet stats for the filter modal — mirrors `/api/v1/search/stats?isRestock=true`. */
export async function getRestockShopStats(shopInfo: ShopInfo): Promise<SearchStats> {
  return getSearchStats('', {
    forceCategory: shopIDToCategory[shopInfo.id],
    isRestock: true,
  }) as Promise<SearchStats>;
}

function sortItemsByPriceDesc(a: ItemV2For<'card'>, b: ItemV2For<'card'>) {
  const aPrice = a.price?.type === 'np' ? a.price.value : null;
  const bPrice = b.price?.type === 'np' ? b.price.value : null;
  return (
    (bPrice || Infinity) - (aPrice || Infinity) ||
    (b.ncValue?.minValue || Infinity) - (a.ncValue?.minValue || Infinity)
  );
}

function computeProfitMean(items: ItemV2For<'card'>[]) {
  const profits = items
    .map((item) => getRestockProfitV2(item, true))
    .filter((profit): profit is number => profit !== null);

  const cleanProfit = removeOutliers(profits, 1.75);
  if (!cleanProfit.length) return 0;
  return Math.round(mean(cleanProfit));
}

function getSimilarShops(shopInfo: ShopInfo, limit = 3) {
  return Object.values(restockShopInfo)
    .filter((shop) => shop.id !== shopInfo.id && shop.category === shopInfo.category)
    .slice(0, limit);
}
