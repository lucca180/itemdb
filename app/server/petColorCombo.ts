import 'server-only';

import { ItemService } from '@services/ItemService';
import { getAllNeopetsColors } from '@app/server/petColors';
import { checkPetColorExists } from '@utils/petColorTool';
import { getNpPriceValue } from '@utils/item/v2';
import {
  allSpecies,
  findPetColorId,
  findPetColorName,
  getSpeciesId,
  petColorSlug,
  type PetColorsCatalog,
} from '@utils/pet-utils';
import prisma from '@utils/prisma';
import type { ItemV2For } from '@types';

/**
 * Rainbow Pool combo payload (ItemV2 card).
 * Powers GET /api/v2/tools/petcolors and App Router loaders.
 */
export type PetColorComboV2 = {
  colorId: number | null;
  speciesId: number | null;
  speciesName: string | null;
  colorName: string | null;
  thumbnail: {
    species: string;
    color: string;
  };
  perfectMatch: ItemV2For<'card'>[];
  colorChanges: ItemV2For<'card'>[];
  speciesChanges: ItemV2For<'card'>[];
  cheapestChange: ItemV2For<'card'>[];
  /** Chance-based color/species items — never used for cheapest path. */
  chanceChanges: ItemV2For<'card'>[];
  fountainAvailable: boolean;
  labAvailable: boolean;
};

function pickCards(ids: number[], items: Record<string, ItemV2For<'card'>>): ItemV2For<'card'>[] {
  return ids
    .map((id) => items[String(id)])
    .filter((item): item is ItemV2For<'card'> => item != null);
}

/**
 * Same bucket logic as v1 `getPetColorData`, hydrated with ItemService (`intent: 'card'`).
 */
export async function getPetColorComboV2(
  colorTargetId: number | undefined,
  speciesTargetId: number | undefined,
  colors?: PetColorsCatalog
): Promise<PetColorComboV2> {
  const colorCatalog = colors ?? (await getAllNeopetsColors());

  const SpeciesOR = [
    {
      species: {
        contains: speciesTargetId ? allSpecies[speciesTargetId] : undefined,
      },
    },
    {
      species: null,
    },
  ];

  const rawData = await prisma.itemEffect.findMany({
    where: {
      type: 'colorSpecies',
      OR: [
        colorTargetId
          ? {
              colorTarget: colorTargetId,
              speciesTarget: null,
              OR: SpeciesOR,
            }
          : {},
        speciesTargetId ? { speciesTarget: speciesTargetId, OR: SpeciesOR } : {},
      ],
    },
    select: {
      item_iid: true,
      colorTarget: true,
      speciesTarget: true,
      isChance: true,
    },
  });

  const allIids = [...new Set(rawData.map((row) => row.item_iid))];
  const itemData =
    allIids.length > 0
      ? await ItemService.getManyItems(
          { type: 'id', data: allIids },
          { intent: 'card', limit: allIids.length }
        )
      : {};

  const priceOf = (iid: number) => getNpPriceValue(itemData[String(iid)]?.price) ?? Infinity;

  const guaranteed = rawData.filter((data) => !data.isChance);
  const chanceRows = rawData.filter((data) => data.isChance);

  const perfectMatch = guaranteed
    .filter((data) => data.colorTarget === colorTargetId && data.speciesTarget === speciesTargetId)
    .sort((a, b) => priceOf(a.item_iid) - priceOf(b.item_iid))
    .map((x) => x.item_iid);

  const colorChanges = guaranteed
    .filter((data) => data.colorTarget === colorTargetId && data.speciesTarget !== speciesTargetId)
    .filter((data) => !(data.item_iid === 14488 && speciesTargetId === 7))
    .sort((a, b) => priceOf(a.item_iid) - priceOf(b.item_iid))
    .map((x) => x.item_iid);

  const speciesChanges = guaranteed
    .filter((data) => data.speciesTarget === speciesTargetId)
    .sort((a, b) => priceOf(a.item_iid) - priceOf(b.item_iid))
    .map((x) => x.item_iid);

  const chanceChanges = [...new Set(chanceRows.map((x) => x.item_iid))].sort(
    (a, b) => priceOf(a) - priceOf(b)
  );

  let cheapestChange: number[] = [];
  let changePrice = 0;

  const speciesTop = speciesChanges[0];
  const speciesTopPrice =
    speciesTop != null ? getNpPriceValue(itemData[String(speciesTop)]?.price) : null;
  if (speciesTargetId && speciesTop != null && speciesTopPrice != null) {
    cheapestChange.push(speciesTop);
    changePrice = speciesTopPrice;
  }

  const colorTop = colorChanges[0];
  const colorTopPrice =
    colorTop != null ? getNpPriceValue(itemData[String(colorTop)]?.price) : null;
  if (colorTargetId && colorTop != null && colorTopPrice != null) {
    cheapestChange.push(colorTop);
    changePrice += colorTopPrice;
  }

  if (speciesTargetId && colorTargetId && cheapestChange.length < 2) {
    cheapestChange = perfectMatch[0] ? [perfectMatch[0]] : [];
    changePrice = 0;
  }

  const perfectTopPrice =
    perfectMatch[0] != null ? getNpPriceValue(itemData[String(perfectMatch[0])]?.price) : null;
  if (perfectMatch.length > 0 && perfectTopPrice != null && perfectTopPrice <= changePrice) {
    cheapestChange = [perfectMatch[0]];
  }

  const thumbnail = {
    species: speciesTargetId ? petColorSlug(allSpecies[speciesTargetId]) : '',
    color: colorTargetId ? petColorSlug(findPetColorName(colorTargetId, colorCatalog) ?? '') : '',
  };

  if (!speciesTargetId) {
    const cheapestEffect = guaranteed.find((data) => data.item_iid === cheapestChange[0]);
    if (cheapestEffect?.speciesTarget) {
      thumbnail.species = petColorSlug(allSpecies[cheapestEffect.speciesTarget]);
    }
  }

  if (!colorTargetId) {
    const cheapestEffect = guaranteed.find((data) => data.item_iid === cheapestChange.at(-1));
    if (cheapestEffect?.colorTarget) {
      thumbnail.color = petColorSlug(
        findPetColorName(cheapestEffect.colorTarget, colorCatalog) ?? ''
      );
    }
  }

  let fountainAvailable = true;
  let labAvailable = true;
  if (colorTargetId) {
    const colorRow = await prisma.petColor.findUnique({
      where: { id: colorTargetId },
      select: { fountainAvailable: true, labAvailable: true },
    });
    fountainAvailable = colorRow?.fountainAvailable ?? true;
    labAvailable = colorRow?.labAvailable ?? true;
  }

  return {
    speciesId: speciesTargetId || null,
    colorId: colorTargetId || null,
    thumbnail,
    speciesName: speciesTargetId ? allSpecies[speciesTargetId] : null,
    colorName: colorTargetId ? (findPetColorName(colorTargetId, colorCatalog) ?? null) : null,
    perfectMatch: pickCards(perfectMatch, itemData),
    colorChanges: pickCards(colorChanges, itemData),
    speciesChanges: pickCards(speciesChanges, itemData),
    cheapestChange: pickCards(cheapestChange, itemData),
    chanceChanges: pickCards(chanceChanges, itemData),
    fountainAvailable,
    labAvailable,
  };
}

export type PetColorComboV2Error = 'missing_params' | 'pet_color_not_found';

/**
 * Resolve colour/species query params (id or slug) and load combo V2 data.
 * Returns a discriminated result for HTTP / App Router callers.
 */
export async function getPetColorComboV2FromQuery(
  colorTarget: string | undefined,
  speciesTarget: string | undefined
): Promise<{ ok: true; data: PetColorComboV2 } | { ok: false; error: PetColorComboV2Error }> {
  const colors = await getAllNeopetsColors();

  let colorTargetId: number | undefined = colorTarget ? Number(colorTarget) : undefined;
  let speciesTargetId: number | undefined = speciesTarget ? Number(speciesTarget) : undefined;

  if (colorTarget && (!colorTargetId || Number.isNaN(colorTargetId))) {
    colorTargetId = findPetColorId(colorTarget, colors) ?? undefined;
  }

  if (speciesTarget && (!speciesTargetId || Number.isNaN(speciesTargetId))) {
    speciesTargetId = getSpeciesId(speciesTarget) ?? undefined;
  }

  if (!colorTarget && !speciesTarget) {
    return { ok: false, error: 'missing_params' };
  }

  if (colorTargetId && speciesTargetId) {
    const exists = await checkPetColorExists(colorTargetId, speciesTargetId);
    if (!exists) return { ok: false, error: 'pet_color_not_found' };
  }

  const data = await getPetColorComboV2(colorTargetId, speciesTargetId, colors);
  return { ok: true, data };
}
