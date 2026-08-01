import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { getAllNeopetsColors } from '@app/server/petColors';
import { getPetColorComboV2FromQuery, type PetColorComboV2 } from '@app/server/petColorCombo';
import { ItemService } from '@services/ItemService';
import { PET_COLORS_CACHE_TAG } from '@utils/pet-utils';
import {
  getSpeciesInfo,
  listCombosByColor,
  listCombosBySpecies,
  listRecentlyReleasedCombos,
  type RainbowPoolComboTile,
  type SpeciesInfo,
} from '@utils/petColorTool';
import { getComboPbOutfitIds } from '@utils/pbOutfits';
import { findPetColorId, getSpeciesId } from '@utils/pet-utils';
import type { ItemV2For } from '@types';

export type { RainbowPoolComboTile, SpeciesInfo, PetColorComboV2 };

/** @deprecated Prefer PetColorComboV2 — alias kept for combo page props. */
export type RainbowPoolComboData = PetColorComboV2;

export async function loadRainbowPoolCombo(
  color: string | undefined,
  species: string | undefined
): Promise<PetColorComboV2 | null> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  const result = await getPetColorComboV2FromQuery(color, species);
  if (!result.ok) {
    if (result.error === 'pet_color_not_found') return null;
    throw new Error(result.error);
  }
  return result.data;
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
): Promise<ItemV2For<'card'>[]> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const ids = await getComboPbOutfitIds(colorName, speciesName);
  if (!ids.length) return [];

  const items = await ItemService.getManyItems(
    { type: 'id', data: ids },
    { intent: 'card', limit: ids.length }
  );
  return Object.values(items).sort((a, b) => a.name.localeCompare(b.name));
}
