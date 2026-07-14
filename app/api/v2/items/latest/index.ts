import prisma from '@utils/prisma';
import { getManyItemsV2 } from '@app/server/items/v2';
import type { ItemV2For } from '@types';

export async function getLatestItemsV2(
  limit: number,
  skipOldIDs = false,
  onlyWearable = false
): Promise<ItemV2For<'card'>[]> {
  const result = await prisma.items.findMany({
    where: {
      canonical_id: null,
      OR: [{ item_id: null }, { item_id: { gte: skipOldIDs ? 85020 : 0 } }],
      isWearable: onlyWearable ? true : undefined,
    },
    orderBy: [
      {
        addedAt: 'desc',
      },
      {
        internal_id: 'asc',
      },
    ],
    select: {
      internal_id: true,
      addedAt: true,
    },
    take: limit,
  });

  const items = await getManyItemsV2(
    {
      id: result.map((data) => data.internal_id.toString()),
    },
    { intent: 'card' }
  );

  return Object.values(items).sort((a, b) => {
    return (
      result.findIndex((data) => data.internal_id === a.internal_id) -
      result.findIndex((data) => data.internal_id === b.internal_id)
    );
  });
}
