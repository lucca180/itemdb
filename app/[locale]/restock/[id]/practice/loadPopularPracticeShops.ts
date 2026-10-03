import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { getTrendingShops } from '@pages/api/v1/beta/trending';
import type { ShopInfo } from '@types';

const POPULAR_SHOPS_LIMIT = 6;

/** Same ranking as the restock hub's "Popular Shops", minus the shop being practiced. */
export async function getPopularPracticeShops(currentShopId: string): Promise<ShopInfo[]> {
  const shops = await loadTrendingShops();

  return shops
    .filter((shop) => shop.id !== currentShopId && Number(shop.id) >= 0)
    .slice(0, POPULAR_SHOPS_LIMIT);
}

// One cached ranking shared by every shop page (+1 so excluding the current shop still fills the list)
async function loadTrendingShops(): Promise<ShopInfo[]> {
  'use cache';
  cacheTag('restock-index');
  cacheLife({ stale: 86400, revalidate: 86400, expire: 172800 });

  return getTrendingShops(POPULAR_SHOPS_LIMIT + 1).catch(() => []);
}
