import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { ItemService } from '@services/ItemService';
import { PET_COLORS_CACHE_TAG } from '@utils/pet-utils';
import { colorNameSearchTerms, textHasColorToken } from '@utils/petStyles';
import prisma from '@utils/prisma';
import type { ItemV2For } from '@types';
import type { Prisma } from '@prisma/generated/client';

export type ComboPetStyleGroup = {
  series: string;
  items: ItemV2For<'card'>[];
};

type StyleRow = {
  item_iid: number;
  series: string;
  isPrismatic: boolean;
  prismaticVariant: string | null;
};

function groupStylesBySeries(
  rows: StyleRow[],
  items: Record<string, ItemV2For<'card'>>
): ComboPetStyleGroup[] {
  const bySeries = new Map<string, StyleRow[]>();

  for (const row of rows) {
    const list = bySeries.get(row.series) ?? [];
    list.push(row);
    bySeries.set(row.series, list);
  }

  const seriesNames = [...bySeries.keys()].sort((a, b) => a.localeCompare(b));

  return seriesNames
    .map((series) => {
      const seriesRows = (bySeries.get(series) ?? []).sort((a, b) => {
        if (a.isPrismatic !== b.isPrismatic) return a.isPrismatic ? 1 : -1;
        return (a.prismaticVariant ?? '').localeCompare(b.prismaticVariant ?? '');
      });

      const groupItems = seriesRows
        .map((row) => items[String(row.item_iid)])
        .filter((item): item is ItemV2For<'card'> => item != null);

      return { series, items: groupItems };
    })
    .filter((group) => group.items.length > 0);
}

function colorStringOrFilters(terms: string[]): Prisma.PetStyleWhereInput[] {
  return terms.flatMap((term) => [
    { series: { contains: term } },
    { item: { name: { contains: term } } },
  ]);
}

/**
 * PetStyles for a Rainbow Pool combo (species × colour).
 * Matches `color_id` and/or colour name tokens in series / item name
 * (e.g. series `Baby Chocolate` on the Baby combo page).
 * Excludes needsReview; groups by series (base then prismatics).
 */
export async function loadComboPetStyles(
  speciesId: number | null | undefined,
  colorId: number | null | undefined,
  colorName?: string | null
): Promise<ComboPetStyleGroup[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  if (speciesId == null || colorId == null) return [];

  const terms = colorNameSearchTerms(colorName);
  const stringFilters = colorStringOrFilters(terms);

  const rows = await prisma.petStyle.findMany({
    where: {
      species_id: speciesId,
      needsReview: false,
      OR: [{ color_id: colorId }, ...stringFilters],
    },
    select: {
      item_iid: true,
      series: true,
      isPrismatic: true,
      prismaticVariant: true,
      color_id: true,
      item: { select: { name: true } },
    },
  });

  const matched = rows.filter(
    (row) =>
      row.color_id === colorId ||
      terms.some(
        (term) => textHasColorToken(row.series, term) || textHasColorToken(row.item.name, term)
      )
  );

  if (!matched.length) return [];

  const iids = [...new Set(matched.map((row) => row.item_iid))];
  const items = await ItemService.getManyItems(
    { type: 'id', data: iids },
    { intent: 'card', limit: iids.length }
  );

  return groupStylesBySeries(matched, items);
}
