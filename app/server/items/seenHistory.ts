import 'server-only';

import { getAuctionData, getRestockData, getTradeData } from '@app/server/items/tradingHistoryData';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { contributeCheck } from '@pages/api/v1/restock/wrapped-check';
import { shouldShowTradeRelisting } from '@utils/item/tradeRelisting';
import type {
  ContributeWallData,
  ItemAuctionData,
  ItemData,
  ItemRestockData,
  TradeData,
} from '@types';

export type TradeHistoryData = {
  recent: TradeData[];
  total: number;
  uniqueOwners: number;
  priced: number;
  period: number;
};

export type AuctionHistoryData = {
  recent: ItemAuctionData[];
  item: ItemData | null;
  total: number;
  sold: number;
  uniqueOwners: number;
  priceMedian: number | null;
};

export type RestockHistoryData = {
  recent: ItemRestockData[];
  item: ItemData | null;
  appearances: number;
  totalStock: number;
  period: number;
};

export type SeenHistoryResult<T> = { ok: true; data: T } | { ok: false; wall: ContributeWallData };

const CONTRIBUTE_GOAL_MULTIPLIER = 1.5;

/**
 * Contribute gate shared by site actions and the HTTP tradings route.
 * Pass `userId` from the caller’s auth adapter (cookies / CheckAuth).
 */
export async function getSeenHistoryContributeWall(
  userId?: string | null
): Promise<ContributeWallData | null> {
  const contributeGoal = await contributeCheck(userId ?? undefined, CONTRIBUTE_GOAL_MULTIPLIER);
  if (!contributeGoal.success) return contributeGoal;
  return null;
}

/** Trade lots — `onlyPriced` requires a passing contribute gate. */
export async function getTradeHistory(
  itemName: string,
  options: { onlyPriced?: boolean; userId?: string | null } = {}
): Promise<SeenHistoryResult<TradeHistoryData>> {
  const { onlyPriced = false, userId } = options;

  if (!itemName || typeof itemName !== 'string') {
    throw new Error('Invalid item');
  }

  if (onlyPriced) {
    const wall = await getSeenHistoryContributeWall(userId);
    if (wall) return { ok: false, wall };
  }

  const item = onlyPriced ? null : await getItem(itemName);
  const includeRelisting = !!item && shouldShowTradeRelisting(item);
  const data = await getTradeData(itemName, onlyPriced, includeRelisting);

  return { ok: true, data };
}

/** Auctions — `onlySold` requires a passing contribute gate. */
export async function getAuctionHistory(
  itemName: string,
  options: { onlySold?: boolean; userId?: string | null } = {}
): Promise<SeenHistoryResult<AuctionHistoryData>> {
  const { onlySold = false, userId } = options;

  if (!itemName || typeof itemName !== 'string') {
    throw new Error('Invalid item');
  }

  if (onlySold) {
    const wall = await getSeenHistoryContributeWall(userId);
    if (wall) return { ok: false, wall };
  }

  const data = await getAuctionData(itemName, onlySold);
  return { ok: true, data };
}

/** Restocks — no contribute gate. */
export async function getRestockHistory(itemName: string): Promise<RestockHistoryData> {
  if (!itemName || typeof itemName !== 'string') {
    throw new Error('Invalid item');
  }

  return getRestockData(itemName);
}
