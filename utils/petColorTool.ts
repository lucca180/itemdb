import axios from 'axios';
import type { ItemData } from '@types';
import prisma from '@utils/prisma';
import { fetchAllNeopetsColors } from '@utils/pet-colors';
import {
  allSpecies,
  findPetColorId,
  findPetColorName,
  getSpeciesId,
  petColorSlug,
  type PetColorsCatalog,
} from '@utils/pet-utils';
import { getManyItems } from '@pages/api/v1/items/many';

export type PetColorData = {
  colorId?: number | null;
  speciesId?: number | null;
  speciesName?: string | null;
  colorName?: string | null;
  thumbnail: {
    species: string;
    color: string;
  };
  perfectMatch: ItemData[];
  colorChanges: ItemData[];
  speciesChanges: ItemData[];
  cheapestChange: ItemData[];
  fountainAvailable: boolean;
  labAvailable: boolean;
};

export type SpeciesInfo = {
  name: string;
  img: string;
  mt: string | null;
  limited: boolean;
  restricted: boolean;
  petDate: string;
};

export type RainbowPoolComboTile = {
  speciesId: number;
  colorId: number;
  speciesName: string;
  colorName: string;
  previewUrl: string;
  href: string;
  addedAt: Date;
};

export function petPreviewUrl(speciesName: string, colorName: string) {
  return `/api/cache/preview/color/${petColorSlug(speciesName)}_${petColorSlug(colorName)}.png`;
}

export const checkPetColorExists = async (colorTargetId: number, speciesTargetId: number) => {
  if (colorTargetId && speciesTargetId) {
    const exists = await prisma.colorSpecies.findFirst({
      where: {
        color_id: colorTargetId,
        species_id: speciesTargetId,
      },
    });

    if (!exists) {
      try {
        const x = await axios.get(
          `https://impress.openneo.net/species/${speciesTargetId}/colors/${colorTargetId}/pet_type.json`,
          {
            headers: {
              'User-Agent': 'itemdb/1.0 (+https://itemdb.com.br)',
            },
          }
        );

        if (!x.data) {
          return false;
        }

        await prisma.colorSpecies.create({
          data: {
            color_id: colorTargetId,
            species_id: speciesTargetId,
          },
        });
      } catch {
        return false;
      }
    }
  }

  return true;
};

export const getPetColorData = async (
  colorTargetId: number | undefined,
  speciesTargetId: number | undefined,
  colors?: PetColorsCatalog
): Promise<PetColorData> => {
  const colorCatalog = colors ?? (await fetchAllNeopetsColors());

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
  });

  const allItemsId = new Set(rawData.map((data) => data.item_iid.toString()));

  const itemData = await getManyItems({ id: Array.from(allItemsId) });

  const perfectMatch = rawData
    .filter((data) => data.colorTarget === colorTargetId && data.speciesTarget === speciesTargetId)
    .sort(
      (a, b) =>
        (itemData[a.item_iid].price.value || Infinity) -
        (itemData[b.item_iid].price.value || Infinity)
    )
    .map((x) => x.item_iid);

  const colorChanges = rawData
    .filter((data) => data.colorTarget === colorTargetId && data.speciesTarget !== speciesTargetId)
    .filter((data) => !(data.item_iid === 14488 && speciesTargetId === 7))
    .sort(
      (a, b) =>
        (itemData[a.item_iid].price.value || Infinity) -
        (itemData[b.item_iid].price.value || Infinity)
    )
    .map((x) => x.item_iid);

  const speciesChanges = rawData
    .filter((data) => data.speciesTarget === speciesTargetId)
    .sort(
      (a, b) =>
        (itemData[a.item_iid].price.value || Infinity) -
        (itemData[b.item_iid].price.value || Infinity)
    )
    .map((x) => x.item_iid);

  let cheapestChange: number[] = [];
  let changePrice = 0;

  if (speciesTargetId && speciesChanges.length > 0 && itemData[speciesChanges[0]].price.value) {
    cheapestChange.push(speciesChanges[0]);
    changePrice = itemData[speciesChanges[0]].price.value!;
  }

  if (colorTargetId && colorChanges.length > 0 && itemData[colorChanges[0]].price.value) {
    cheapestChange.push(colorChanges[0]);
    changePrice += itemData[colorChanges[0]].price.value!;
  }

  if (speciesTargetId && colorTargetId && cheapestChange.length < 2) {
    cheapestChange = perfectMatch[0] ? [perfectMatch[0]] : [];
    changePrice = 0;
  }

  if (
    perfectMatch.length > 0 &&
    itemData[perfectMatch[0]].price.value &&
    itemData[perfectMatch[0]].price.value! <= changePrice
  ) {
    cheapestChange = [perfectMatch[0]];
  }

  const thumbnail = {
    species: speciesTargetId ? petColorSlug(allSpecies[speciesTargetId]) : '',
    color: colorTargetId ? petColorSlug(findPetColorName(colorTargetId, colorCatalog) ?? '') : '',
  };

  if (!speciesTargetId) {
    const cheapestEffect = rawData.find((data) => data.item_iid === cheapestChange[0]);
    if (cheapestEffect && cheapestEffect.speciesTarget) {
      thumbnail.species = petColorSlug(allSpecies[cheapestEffect.speciesTarget]);
    }
  }

  if (!colorTargetId) {
    const cheapestEffect = rawData.find((data) => data.item_iid === cheapestChange.at(-1));
    if (cheapestEffect && cheapestEffect.colorTarget) {
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
    perfectMatch: perfectMatch.map((id) => itemData[id]),
    colorChanges: colorChanges.map((id) => itemData[id]),
    speciesChanges: speciesChanges.map((id) => itemData[id]),
    cheapestChange: cheapestChange.map((id) => itemData[id]),
    fountainAvailable,
    labAvailable,
  };
};

export const getPetColorDataStr = async (
  colorTarget: string | undefined,
  speciesTarget: string | undefined
) => {
  const colors = await fetchAllNeopetsColors();

  let colorTargetId: number | undefined = colorTarget ? Number(colorTarget) : undefined;
  let speciesTargetId: number | undefined = speciesTarget ? Number(speciesTarget) : undefined;

  if (colorTarget && (!colorTargetId || isNaN(colorTargetId))) {
    colorTargetId = findPetColorId(colorTarget, colors) ?? undefined;
  }

  if (speciesTarget && (!speciesTargetId || isNaN(speciesTargetId))) {
    speciesTargetId = getSpeciesId(speciesTarget) ?? undefined;
  }

  if (!colorTarget && !speciesTarget) {
    throw { error: 'Missing query parameters' };
  }

  if (colorTargetId && speciesTargetId) {
    const exists = await checkPetColorExists(colorTargetId, speciesTargetId);
    if (!exists) throw { error: 'pet_color_not_found' };
  }

  return getPetColorData(colorTargetId, speciesTargetId, colors);
};

export async function getSpeciesInfo(species: string): Promise<SpeciesInfo | null> {
  const petData = (await import('@utils/petDays.json')).default;
  const petDataEntries = Object.entries(petData);
  const petDataFiltered = petDataEntries.find(
    ([, value]) => value.name.toLowerCase() === species.toLowerCase()
  );
  if (!petDataFiltered) return null;

  return {
    ...petDataFiltered[1],
    petDate: petDataFiltered[0],
  };
}

export async function listCombosBySpecies(
  speciesId: number,
  colors: PetColorsCatalog
): Promise<RainbowPoolComboTile[]> {
  const speciesName = allSpecies[speciesId];
  if (!speciesName) return [];

  const rows = await prisma.colorSpecies.findMany({
    where: { species_id: speciesId },
    orderBy: { color_id: 'asc' },
  });

  return rows
    .map((row) => {
      const colorName = findPetColorName(row.color_id, colors);
      if (!colorName) return null;
      return {
        speciesId,
        colorId: row.color_id,
        speciesName,
        colorName,
        previewUrl: petPreviewUrl(speciesName, colorName),
        href: `/rainbow-pool/${petColorSlug(speciesName)}/${petColorSlug(colorName)}`,
        addedAt: row.addedAt,
      } satisfies RainbowPoolComboTile;
    })
    .filter((x): x is RainbowPoolComboTile => x != null)
    .sort((a, b) => a.colorName.localeCompare(b.colorName));
}

export async function listCombosByColor(
  colorId: number,
  colors: PetColorsCatalog
): Promise<RainbowPoolComboTile[]> {
  const colorName = findPetColorName(colorId, colors);
  if (!colorName) return [];

  const rows = await prisma.colorSpecies.findMany({
    where: { color_id: colorId },
    orderBy: { species_id: 'asc' },
  });

  return rows
    .map((row) => {
      const speciesName = allSpecies[row.species_id];
      if (!speciesName) return null;
      return {
        speciesId: row.species_id,
        colorId,
        speciesName,
        colorName,
        previewUrl: petPreviewUrl(speciesName, colorName),
        href: `/rainbow-pool/${petColorSlug(speciesName)}/${petColorSlug(colorName)}`,
        addedAt: row.addedAt,
      } satisfies RainbowPoolComboTile;
    })
    .filter((x): x is RainbowPoolComboTile => x != null)
    .sort((a, b) => a.speciesName.localeCompare(b.speciesName));
}

export async function listRecentlyReleasedCombos(
  colors: PetColorsCatalog,
  limit = 16
): Promise<RainbowPoolComboTile[]> {
  const rows = await prisma.colorSpecies.findMany({
    orderBy: { addedAt: 'desc' },
    take: limit * 2,
  });

  const tiles: RainbowPoolComboTile[] = [];
  for (const row of rows) {
    const speciesName = allSpecies[row.species_id];
    const colorName = findPetColorName(row.color_id, colors);
    if (!speciesName || !colorName) continue;
    tiles.push({
      speciesId: row.species_id,
      colorId: row.color_id,
      speciesName,
      colorName,
      previewUrl: petPreviewUrl(speciesName, colorName),
      href: `/rainbow-pool/${petColorSlug(speciesName)}/${petColorSlug(colorName)}`,
      addedAt: row.addedAt,
    });
    if (tiles.length >= limit) break;
  }
  return tiles;
}

export const POPULAR_COLOR_NAMES = [
  'Faerie',
  'Darigan',
  'Baby',
  'Royalboy',
  'Void',
  'Maraquan',
  'Ghost',
  'Fire',
] as const;
