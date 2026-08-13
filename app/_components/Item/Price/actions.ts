'use server';

import {
  getCachedItem,
  loadItemPriceMarkers,
  loadNPPrices,
  loadTradeLists,
} from '@app/_components/Item/loadUtils';
import {
  labelMatchTableLastSeen,
  toMatchTableRows,
  type MatchTableLabeledRow,
} from '@app/_components/Item/NCTrade/matchTableView';
import {
  filterNPSeekingLists,
  filterNPTradingLists,
} from '@app/_components/Item/Price/itemPriceUtils';
import { getCachedNow } from '@utils/getCachedNow';
import { shouldShowTradeLists } from '@utils/utils';
import { getLocale } from 'next-intl/server';
import type { PriceData, PriceMarker } from '@types';

export type ItemPriceHistory = {
  prices: PriceData[];
  markers: PriceMarker[];
};

export async function loadItemPriceHistory(internalId: number): Promise<ItemPriceHistory> {
  const item = await getCachedItem(internalId);
  if (!item) return { prices: [], markers: [] };

  const [prices, markers] = await Promise.all([
    loadNPPrices(internalId),
    loadItemPriceMarkers(
      internalId,
      item.firstSeen,
      shouldShowTradeLists(item, await getCachedNow())
    ),
  ]);

  return { prices, markers };
}

export type ItemTradeListTables = {
  seeking: MatchTableLabeledRow[];
  trading: MatchTableLabeledRow[];
};

export async function loadItemTradeLists(internalId: number): Promise<ItemTradeListTables> {
  const [lists, locale] = await Promise.all([loadTradeLists(internalId), getLocale()]);
  const [seeking, trading] = await Promise.all([
    labelMatchTableLastSeen(toMatchTableRows(filterNPSeekingLists(lists)), locale),
    labelMatchTableLastSeen(toMatchTableRows(filterNPTradingLists(lists)), locale),
  ]);
  return { seeking, trading };
}
