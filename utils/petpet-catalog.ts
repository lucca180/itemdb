import prisma from '@utils/prisma';
import {
  buildPetpetCatalogMaps,
  type PetpetCatalogEntry,
  type PetpetCatalogMaps,
} from '@utils/petpet-catalog-match';

// Pure helpers live in petpet-catalog-match (client-safe); re-exported so server imports stay put.
export * from '@utils/petpet-catalog-match';

/** Uncached DB read — safe for Pages Router / pages API routes. */
export async function fetchAllPetpetSpecies(): Promise<PetpetCatalogEntry[]> {
  const rows = await prisma.petpetSpecies.findMany({
    select: { internal_id: true, neo_id: true, map_id: true, name: true },
    orderBy: [{ map_id: 'asc' }],
  });
  return rows;
}

/** Uncached DB read — safe for Pages Router / pages API routes. */
export async function fetchAllPetpetColors(): Promise<PetpetCatalogEntry[]> {
  const rows = await prisma.petpetColorCatalog.findMany({
    select: { internal_id: true, neo_id: true, map_id: true, name: true },
    orderBy: [{ map_id: 'asc' }],
  });
  return rows;
}

export async function fetchPetpetSpeciesMaps(): Promise<PetpetCatalogMaps> {
  return buildPetpetCatalogMaps(await fetchAllPetpetSpecies());
}

export async function fetchPetpetColorMaps(): Promise<PetpetCatalogMaps> {
  return buildPetpetCatalogMaps(await fetchAllPetpetColors());
}
