import { Prisma } from '@prisma/generated/client';
import prisma from '@utils/prisma';
import type { ItemPriceData } from '@types';

export type ItemPriceHistoryEntry = ItemPriceData & { item_iid: number; price_id: number };

/**
 * Full price history (newest first) for many items, grouped by `item_iid`.
 * Includes unconfirmed prices (`manual_check` set).
 */
export const getManyItemsPriceHistory = async ({
  item_iids,
  item_ids,
}: {
  item_iids?: number[];
  item_ids?: number[];
}) => {
  // Only the filters that were passed: an empty `{}` inside `OR` matches every row.
  const or: Prisma.ItemPricesWhereInput[] = [];
  if (item_iids?.length) or.push({ item_iid: { in: item_iids } });
  if (item_ids?.length) or.push({ item: { item_id: { in: item_ids } } });

  if (!or.length) return {};

  const pricesRaw = await prisma.itemPrices.findMany({
    where: { OR: or },
    orderBy: {
      addedAt: 'desc',
    },
  });

  const pricesByIid: { [iid: number]: ItemPriceHistoryEntry[] } = {};

  pricesRaw.map((price) => {
    if (!price.item_iid) return;
    if (!pricesByIid[price.item_iid]) pricesByIid[price.item_iid] = [];

    pricesByIid[price.item_iid].push({
      price_id: price.internal_id,
      value: price.price.toNumber(),
      item_iid: price.item_iid,
      addedAt: price.addedAt.toJSON(),
      inflated: !!price.noInflation_id,
    });
  });

  return pricesByIid;
};
