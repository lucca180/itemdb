import prisma from '@utils/prisma';
import type { ListItemInfo } from '@types';
import {
  buildListPriceHistory,
  LIST_PRICE_HISTORY_PERIOD_DAYS,
  LIST_PRICE_HISTORY_YEARS,
  MAX_ITEMS_LIST_PRICE,
  type ListPriceHistoryResult,
  type ListPricePoint,
} from '@utils/list/listPriceHistory';

/**
 * Price history of a list's visible NP items. `rows` must already be authorized and
 * exclude hidden items (same rows as the header's NP total).
 */
export async function getListPriceHistory(
  rows: readonly Pick<ListItemInfo, 'item_iid' | 'amount' | 'isHidden'>[]
): Promise<ListPriceHistoryResult> {
  const amounts = new Map<number, number>();
  for (const row of rows) {
    if (row.isHidden) continue;
    amounts.set(row.item_iid, (amounts.get(row.item_iid) ?? 0) + row.amount);
  }

  if (amounts.size === 0) return { status: 'ok', points: [], totalItems: 0 };

  const npItems = await prisma.items.findMany({
    where: { internal_id: { in: [...amounts.keys()] }, type: { not: 'nc' } },
    select: { internal_id: true },
  });

  if (npItems.length > MAX_ITEMS_LIST_PRICE) {
    return { status: 'too-many', max: MAX_ITEMS_LIST_PRICE };
  }

  const npAmounts = new Map<number, number>();
  for (const item of npItems) npAmounts.set(item.internal_id, amounts.get(item.internal_id)!);

  if (npAmounts.size === 0) return { status: 'ok', points: [], totalItems: 0 };

  const since = new Date();
  since.setUTCFullYear(since.getUTCFullYear() - LIST_PRICE_HISTORY_YEARS);
  since.setUTCHours(0, 0, 0, 0);

  // Confirmed prices only, same as the item page history. The full history is needed so every
  // point carries each item's real last price; only the returned points are cut at `since`.
  const pricesRaw = await prisma.itemPrices.findMany({
    where: { item_iid: { in: [...npAmounts.keys()] }, manual_check: null },
    select: { item_iid: true, price: true, addedAt: true },
    orderBy: { addedAt: 'asc' },
  });

  const prices: ListPricePoint[] = [];
  for (const price of pricesRaw) {
    if (!price.item_iid) continue;
    prices.push({
      item_iid: price.item_iid,
      value: price.price.toNumber(),
      addedAt: price.addedAt,
    });
  }

  return {
    status: 'ok',
    points: buildListPriceHistory(npAmounts, prices, LIST_PRICE_HISTORY_PERIOD_DAYS, since),
    totalItems: npAmounts.size,
  };
}
