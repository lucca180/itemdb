import prisma from '@utils/prisma';
import type { PetColorsCatalog } from '@utils/pet-utils';

/** Uncached DB read — safe for Pages Router / pages API routes. */
export async function fetchAllNeopetsColors(): Promise<PetColorsCatalog> {
  const rows = await prisma.petColor.findMany();
  const colors: PetColorsCatalog = {};
  for (const row of rows) {
    colors[String(row.id)] = row.name;
  }
  return colors;
}
