import type { ItemData } from '@types';
import {
  needsDrops,
  needsDye,
  needsLebronTradeHistory,
  needsMME,
  needsNCMall,
  needsNCTrade,
  needsNPPrices,
  needsOutfitSection,
  needsPetpet,
  needsRecipes,
  needsRestockLastSeen,
  needsAuctionCard,
  needsTradeCard,
  needsTradeLists,
  needsWearableData,
} from '@app/_components/Item/itemPageGates';
import { loadItemOpenableMeta } from '@app/_components/Item/Drops/loadItemDrops';
import {
  loadAvyData,
  loadDyeData,
  loadItemColors,
  loadItemEffects,
  getOfficialItemLists,
  loadItemParentData,
  loadItemRecipes,
  loadItemAuctions,
  loadItemTrades,
  loadItemWearableData,
  loadLastSeen,
  loadLebronTradeHistory,
  loadMMEData,
  loadNCMallData,
  loadNCTradeInsights,
  loadNPPrices,
  loadPetpetData,
  loadTradeLists,
} from '@app/_components/Item/loadUtils';
import { loadSimilarItemData } from '@app/_components/Item/SimilarItems/loadSimilarItems';

function preload(promise: Promise<unknown>) {
  void promise;
}

/** Starts item-page data fetches early; sections reuse the same cached loaders. */
export function preloadItemPageData(item: ItemData): void {
  const includeTrade = needsTradeLists(item);

  preload(getOfficialItemLists(item.internal_id, includeTrade));
  preload(loadItemEffects(item));
  preload(loadItemColors(item));

  if (needsNPPrices(item)) {
    preload(loadNPPrices(item.internal_id));
  }

  if (needsNCTrade(item)) {
    preload(loadNCTradeInsights(item.internal_id));
    if (includeTrade) preload(loadTradeLists(item));
    if (needsLebronTradeHistory(item)) {
      preload(loadLebronTradeHistory(item.internal_id, item.name));
    }
  }

  if (needsNCMall(item)) {
    preload(loadNCMallData(item.internal_id));
  }

  if (needsDrops(item) || needsOutfitSection(item)) {
    preload(loadItemOpenableMeta(item));
  }

  if (needsPetpet(item)) preload(loadPetpetData(item.internal_id));
  if (needsRecipes(item)) preload(loadItemRecipes(item.internal_id));
  if (needsDye(item)) preload(loadDyeData(item.internal_id));
  if (needsMME(item)) preload(loadMMEData(item.internal_id));
  if (needsAuctionCard(item)) preload(loadItemAuctions(item.internal_id));
  if (needsTradeCard(item)) preload(loadItemTrades(item.internal_id));
  if (needsRestockLastSeen(item)) preload(loadLastSeen(item.internal_id));
  if (needsWearableData(item)) preload(loadItemWearableData(item.internal_id));

  preload(loadSimilarItemData(item));
  preload(loadItemParentData(item.internal_id));
  preload(loadAvyData(item.internal_id, includeTrade));
}
