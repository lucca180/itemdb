'use server';

import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  getAuctionHistory,
  getRestockHistory,
  getTradeHistory,
  type AuctionHistoryData,
  type RestockHistoryData,
  type SeenHistoryResult,
  type TradeHistoryData,
} from '@app/server/items/seenHistory';
import { shouldGateAuctionRelisting } from '@app/server/items/relistingGate';

export type {
  AuctionHistoryData,
  RestockHistoryData,
  SeenHistoryResult,
  TradeHistoryData,
} from '@app/server/items/seenHistory';

/** Site adapter: session cookie → shared seen-history service. */
export async function loadTradeHistory(
  itemName: string,
  onlyPriced = false
): Promise<SeenHistoryResult<TradeHistoryData>> {
  const { user } = await getServerCurrentUser();
  return getTradeHistory(itemName, { onlyPriced, userId: user?.id });
}

/** Site adapter: session cookie → shared seen-history service. */
export async function loadAuctionHistory(
  itemName: string,
  onlySold = false
): Promise<SeenHistoryResult<AuctionHistoryData>> {
  const { user } = await getServerCurrentUser();
  const result = await getAuctionHistory(itemName, {
    onlySold,
    userId: user?.id,
    collapseRelistings: true,
  });
  if (result.ok) return result;

  return {
    ok: false,
    wall: { ...result.wall, gatesRelisting: await shouldGateAuctionRelisting() },
  };
}

/** Site adapter for restock history (no auth). */
export async function loadRestockHistory(itemName: string): Promise<RestockHistoryData> {
  return getRestockHistory(itemName);
}
