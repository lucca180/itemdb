import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import {
  buildPetpetCatalogMaps,
  fetchAllPetpetColors,
  fetchAllPetpetSpecies,
  type PetpetCatalogEntry,
  type PetpetCatalogMaps,
} from '@utils/petpet-catalog';
import { PETPET_CATALOG_CACHE_TAG } from '@utils/pet-utils';

/** App Router cached species catalog (`cache` + `'use cache'`). Do not call from Pages Router. */
export const getAllPetpetSpecies = cache(async (): Promise<PetpetCatalogEntry[]> => {
  'use cache';
  cacheTag(PETPET_CATALOG_CACHE_TAG);
  cacheLife('homeSlow');
  return fetchAllPetpetSpecies();
});

/** App Router cached color catalog (`cache` + `'use cache'`). Do not call from Pages Router. */
export const getAllPetpetColors = cache(async (): Promise<PetpetCatalogEntry[]> => {
  'use cache';
  cacheTag(PETPET_CATALOG_CACHE_TAG);
  cacheLife('homeSlow');
  return fetchAllPetpetColors();
});

/** Per-request deduped species maps. App Router only. */
export const getPetpetSpeciesMaps = cache(async (): Promise<PetpetCatalogMaps> => {
  return buildPetpetCatalogMaps(await getAllPetpetSpecies());
});

/** Per-request deduped color maps. App Router only. */
export const getPetpetColorMaps = cache(async (): Promise<PetpetCatalogMaps> => {
  return buildPetpetCatalogMaps(await getAllPetpetColors());
});
