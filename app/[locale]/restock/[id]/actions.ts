'use server';

import { ItemService } from '@services/ItemService';
import { resolveRestockShopRoute } from '@app/utils/resolveRestockShopRoute';
import type { ItemV2For, SearchFilters, SearchStats, ShopInfo } from '@types';
import { getRestockShopData, getRestockShopStats } from './loadRestockShop';

function resolveShop(id: string, locale: string): ShopInfo | null {
  const route = resolveRestockShopRoute(id, locale);
  return route.type === 'ok' ? route.shop : null;
}

/** Tier 3: full profitable list loaded after hydration (replaces the client axios fetch). */
export async function loadRestockShopItems(
  id: string,
  locale: string
): Promise<ItemV2For<'card'>[]> {
  const shop = resolveShop(id, locale);
  if (!shop) return [];

  const data = await getRestockShopData(shop);
  return data.fullItems;
}

/** Lazy facet stats — only fetched when the filter modal opens. */
export async function loadRestockShopStats(
  id: string,
  locale: string
): Promise<SearchStats | null> {
  const shop = resolveShop(id, locale);
  if (!shop) return null;

  return getRestockShopStats(shop);
}

/** Filter modal apply — runs the search with the chosen filters server-side. */
export async function applyRestockFilters(
  id: string,
  locale: string,
  filters: SearchFilters
): Promise<ItemV2For<'card'>[]> {
  const shop = resolveShop(id, locale);
  if (!shop) return [];

  const result = await ItemService.search('', filters, { intent: 'card' });
  return result.content;
}
