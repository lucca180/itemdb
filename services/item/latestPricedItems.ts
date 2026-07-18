import prisma from '@utils/prisma';
import { ItemService } from '@services/ItemService';
import type { ItemV2For } from '@types';

export async function getLatestPricedItemsV2(
  limit: number,
  includeCount = false
): Promise<ItemV2For<'card'>[] | { count: number | null; items: ItemV2For<'card'>[] }> {
  const [pricesRaw, priceCount] = await Promise.all([
    prisma.itemPrices.findMany({
      where: {
        manual_check: null,
        price: {
          gt: 0,
        },
      },
      orderBy: { processedAt: 'desc' },
      take: limit,
    }),
    includeCount
      ? prisma.itemPrices.count({
          where: {
            processedAt: {
              gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
            },
            manual_check: null,
          },
        })
      : null,
  ]);

  const ids = pricesRaw.map((p) => p.item_iid?.toString()) as string[];

  const items = await ItemService.getManyItems(
    {
      type: 'id',
      data: ids,
    },
    { intent: 'card' }
  );

  const sortedItems = Object.values(items).sort(
    (a, b) => ids.indexOf(a.internal_id.toString()) - ids.indexOf(b.internal_id.toString())
  );

  if (includeCount) {
    return {
      count: priceCount,
      items: sortedItems,
    };
  }

  return sortedItems;
}
