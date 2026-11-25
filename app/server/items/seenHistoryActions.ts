'use server';

import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { withActionQuota, type ActionRateLimited } from '@utils/api/actionQuota';
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

/** Walls carry no item data, so they don't count. */
function countRecent(result: SeenHistoryResult<{ recent: unknown[] }>) {
  return result.ok ? result.data.recent.length : 0;
}

/** Site adapter: session cookie → shared seen-history service. */
export async function loadTradeHistory(
  itemName: string,
  onlyPriced = false
): Promise<SeenHistoryResult<TradeHistoryData> | ActionRateLimited> {
  return withActionQuota(async () => {
    const { user } = await getServerCurrentUser();
    return getTradeHistory(itemName, { onlyPriced, userId: user?.id });
  }, countRecent);
}

/** Site adapter: session cookie → shared seen-history service. */
export async function loadAuctionHistory(
  itemName: string,
  onlySold = false
): Promise<SeenHistoryResult<AuctionHistoryData> | ActionRateLimited> {
  return withActionQuota<SeenHistoryResult<AuctionHistoryData>>(async () => {
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
  }, countRecent);
}

/** Site adapter for restock history (no auth). */
export async function loadRestockHistory(
  itemName: string
): Promise<{ ok: true; data: RestockHistoryData } | ActionRateLimited> {
  return withActionQuota(
    async () => ({ ok: true as const, data: await getRestockHistory(itemName) }),
    countRecent
  );
}
