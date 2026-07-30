import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@utils/prisma';
import { PET_COLORS_CACHE_TAG, type PetColorsCatalog } from '@utils/pet-utils';

/** Uncached DB read — use from Pages Router / pages API routes. */
export async function fetchAllNeopetsColors(): Promise<PetColorsCatalog> {
  const rows = await prisma.petColor.findMany();
  const colors: PetColorsCatalog = {};
  for (const row of rows) {
    colors[String(row.id)] = row.name;
  }
  return colors;
}

/** App Router cached catalog (`'use cache'`). Do not call from Pages Router. */
export async function getAllNeopetsColors(): Promise<PetColorsCatalog> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife('homeSlow');
  return fetchAllNeopetsColors();
}
