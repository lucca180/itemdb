import 'server-only';

import { formatEffect } from '@utils/item/formatEffect';
import { ItemService } from '@services/ItemService';
import type { ItemEffect, ItemV2For } from '@types';
import prisma from '@utils/prisma';
import { getAllNeopetsColors } from '@app/server/petColors';
import { getAllPetpetColors } from '@app/server/petpetCatalog';
import { petpetCatalogToNameRecord } from '@utils/petpet-catalog';

export type ItemWithEffectsCard = ItemV2For<'card'> & { effects: ItemEffect[] };

/**
 * Shared hub/API loader: items that have effects matching type/name,
 * hydrated as ItemV2 `card` plus formatted effects.
 */
export async function getItemsWithEffectsPage(options: {
  field?: string;
  name?: string;
  page: number;
  limit: number;
}): Promise<ItemWithEffectsCard[]> {
  const { field, name, page, limit } = options;

  const itemIds = await prisma.items.findMany({
    where: {
      effects: {
        some: {
          type: field || undefined,
          name: name || undefined,
        },
      },
    },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { name: 'asc' },
    select: { internal_id: true },
  });

  if (!itemIds.length) return [];

  const iids = itemIds.map((item) => item.internal_id);

  const [effectsRaw, items, colors, petpetColorEntries] = await Promise.all([
    prisma.itemEffect.findMany({ where: { item_iid: { in: iids } } }),
    ItemService.getManyItems({ type: 'id', data: iids }, { intent: 'card', limit }),
    getAllNeopetsColors(),
    getAllPetpetColors(),
  ]);

  const petpetColorNames = petpetCatalogToNameRecord(petpetColorEntries);

  return Object.values(items)
    .map((item) => ({
      ...item,
      effects: effectsRaw
        .filter((effect) => effect.item_iid === item.internal_id)
        .sort((a, b) => b.type.localeCompare(a.type))
        .map((effect) => formatEffect(effect, colors, petpetColorNames)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
