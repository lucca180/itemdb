import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { getAllNeopetsColors } from '@app/server/petColors';
import { PET_COLORS_CACHE_TAG } from '@utils/pet-utils';
import {
  getPetColorDataStr,
  getSpeciesInfo,
  listCombosByColor,
  listCombosBySpecies,
  listRecentlyReleasedCombos,
  type PetColorData,
  type RainbowPoolComboTile,
  type SpeciesInfo,
} from '@utils/petColorTool';
import { getComboPbOutfit } from '@utils/pbOutfits';
import { findPetColorId, getSpeciesId } from '@utils/pet-utils';
import type { ItemData } from '@types';

export type { PetColorData, RainbowPoolComboTile, SpeciesInfo };

export async function loadRainbowPoolCombo(
  color: string | undefined,
  species: string | undefined
): Promise<PetColorData | null> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  try {
    return await getPetColorDataStr(color, species);
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'error' in err &&
      (err as { error: unknown }).error === 'pet_color_not_found'
    ) {
      return null;
    }
    throw err;
  }
}

export async function loadSpeciesInfo(species: string): Promise<SpeciesInfo | null> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife('homeSlow');
  return getSpeciesInfo(species);
}

export async function loadCombosBySpeciesSlug(
  speciesSlug: string
): Promise<RainbowPoolComboTile[] | null> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const speciesId = getSpeciesId(speciesSlug);
  if (!speciesId) return null;
  const colors = await getAllNeopetsColors();
  return listCombosBySpecies(speciesId, colors);
}

export async function loadCombosByColorSlug(
  colorSlug: string
): Promise<RainbowPoolComboTile[] | null> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const colors = await getAllNeopetsColors();
  const colorId = findPetColorId(colorSlug, colors);
  if (!colorId) return null;
  return listCombosByColor(colorId, colors);
}

export async function loadRecentlyReleasedCombos(limit = 16): Promise<RainbowPoolComboTile[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const colors = await getAllNeopetsColors();
  return listRecentlyReleasedCombos(colors, limit);
}

export async function resolveSlugKind(slug: string): Promise<'species' | 'color' | null> {
  if (getSpeciesId(slug)) return 'species';
  const colors = await getAllNeopetsColors();
  if (findPetColorId(slug, colors)) return 'color';
  return null;
}

export async function loadComboPbOutfit(
  colorName: string,
  speciesName: string
): Promise<ItemData[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  return getComboPbOutfit(colorName, speciesName);
}
