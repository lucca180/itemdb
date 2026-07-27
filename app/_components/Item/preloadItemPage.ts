import type { ItemData } from '@types';
import {
  // needsDrops,
  // needsDye,
  needsLebronTradeHistory,
  // needsMME,
  needsNCMall,
  needsNCTrade,
  needsNPPrices,
  // needsOutfitSection,
  // needsPetpet,
  // needsRecipes,
  needsRestockLastSeen,
  // needsAuctionCard,
  // needsTradeCard,
  needsTradeLists,
  needsWearableData,
} from '@app/_components/Item/itemPageGates';
// import { shouldShowTradeRelisting } from '@utils/item/tradeRelisting';
// import { loadItemOpenableMeta } from '@app/_components/Item/Drops/loadItemDrops';
import {
  // loadAvyData,
  // loadDyeData,
  loadItemColors,
  // loadItemEffects,
  getOfficialItemLists,
  // loadItemParentData,
  // loadItemRecipes,
  // loadItemAuctions,
  // loadItemTrades,
  loadItemWearableData,
  loadLastSeen,
  loadLebronTradeHistory,
  // loadMMEData,
  loadNCMallData,
  loadNCTradeInsights,
  loadNPPrices,
  // loadPetpetData,
  loadTradeLists,
} from '@app/_components/Item/loadUtils';
// import { loadSimilarItemData } from '@app/_components/Item/SimilarItems/loadSimilarItems';
import pMap from 'p-map';

const ITEM_PAGE_PRELOAD_CONCURRENCY = 3;

/**
 * Starts item-page data fetches early; sections reuse the same cached loaders.
 * Below-fold preloads are commented out so Suspense sections fetch without
 * competing for DB/CPU on first paint — uncomment to restore eager warm-up.
 */
export async function preloadItemPageData(item: ItemData): Promise<void> {
  const tasks: Array<() => Promise<unknown>> = [];
  const preload = (task: () => Promise<unknown>) => {
    tasks.push(task);
  };

  const includeTrade = await needsTradeLists(item);

  preload(() => getOfficialItemLists(item.internal_id, includeTrade));
  preload(() => loadItemColors(item.internal_id));

  if (needsNPPrices(item)) {
    preload(() => loadNPPrices(item.internal_id));
  }

  if (needsNCMall(item)) {
    preload(() => loadNCMallData(item.internal_id));
  }

  // preload(() => loadAvyData(item.internal_id, includeTrade));
  // preload(() => loadItemEffects(item.internal_id));
  // preload(() => loadSimilarItemData(item.internal_id, item.name));

  if (needsNCTrade(item)) {
    preload(() => loadNCTradeInsights(item.internal_id));
    if (includeTrade) preload(() => loadTradeLists(item.internal_id));
    if (needsLebronTradeHistory(item)) {
      preload(() => loadLebronTradeHistory(item.internal_id, item.name));
    }
  }

  // if (needsAuctionCard(item)) preload(() => loadItemAuctions(item.internal_id));
  // if (needsTradeCard(item)) {
  //   preload(() => loadItemTrades(item.internal_id, shouldShowTradeRelisting(item)));
  // }

  // if (needsPetpet(item)) preload(() => loadPetpetData(item.internal_id));
  // if (needsRecipes(item)) preload(() => loadItemRecipes(item.internal_id));
  // if (needsDye(item)) preload(() => loadDyeData(item.internal_id));
  // if (needsMME(item)) preload(() => loadMMEData(item.internal_id));

  if (needsRestockLastSeen(item)) preload(() => loadLastSeen(item.internal_id));
  if (needsWearableData(item)) preload(() => loadItemWearableData(item.internal_id));

  // if (needsDrops(item) || needsOutfitSection(item)) {
  //   preload(() => loadItemOpenableMeta(item.internal_id, item.useTypes.canOpen));
  // }

  // preload(() => loadItemParentData(item.internal_id));

  void pMap(tasks, (task) => task(), { concurrency: ITEM_PAGE_PRELOAD_CONCURRENCY });
}
