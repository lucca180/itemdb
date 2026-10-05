import 'server-only';

import { ItemService } from '@services/ItemService';
import type { ShopInfo } from '@types';
import { RESTOCK_FILTER } from '@utils/restock-filters';
import { PRACTICE_POOL_VERSION, type PracticePoolPayload } from '@utils/restockPractice';

/**
 * Every item the Neopets restock algorithm can roll for a shop
 * (`obj_price > 0 AND obj_rarity BETWEEN 1 AND 100` → `estVal > 0`, rarity 1-100).
 *
 * Not cached here on purpose: the API route is cached by the CDN (Cloudflare Cache Rule),
 * so keeping these large payloads in `use cache`/Redis would only cost server memory.
 */
export async function getRestockPracticePool(shopInfo: ShopInfo): Promise<PracticePoolPayload> {
  const filters = RESTOCK_FILTER(shopInfo.id);
  filters.restockProfit = '';
  filters.rarity = ['1', '100'];

  const result = await ItemService.search('', filters, { intent: 'card' });

  const payload: PracticePoolPayload = {
    version: PRACTICE_POOL_VERSION,
    shopId: Number(shopInfo.id),
    ids: [],
    itemIds: [],
    names: [],
    slugs: [],
    imageIds: [],
    rarities: [],
    estVals: [],
    marketPrices: [],
  };

  for (const item of result.content) {
    if (!item.rarity || !item.estVal || item.estVal <= 0) continue;

    payload.ids.push(item.internal_id);
    payload.itemIds.push(item.item_id);
    payload.names.push(item.name);
    payload.slugs.push(item.slug);
    payload.imageIds.push(item.image.id);
    payload.rarities.push(item.rarity);
    payload.estVals.push(item.estVal);
    payload.marketPrices.push(item.price?.type === 'np' ? item.price.value : null);
  }

  return payload;
}
