import 'server-only';

import { ItemService } from '@services/ItemService';
import type { ItemV2For } from '@types';
import prisma from '@utils/prisma';

/**
 * Shared hub/API loader: canonical items whose selected field is null,
 * hydrated as ItemV2 `card`.
 */
export async function getMissingInfoItemsPage(options: {
  field: string;
  page: number;
  limit: number;
}): Promise<ItemV2For<'card'>[]> {
  const { field, page, limit } = options;

  const itemIds = await prisma.items.findMany({
    where: {
      [field]: null,
      canonical_id: null,
    },
    select: { internal_id: true },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { name: 'asc' },
  });

  if (!itemIds.length) return [];

  const items = await ItemService.getManyItems(
    { type: 'id', data: itemIds.map((item) => item.internal_id) },
    { intent: 'card', limit }
  );

  return Object.values(items).sort((a, b) => a.name.localeCompare(b.name));
}
