import axios from 'axios';
import { revalidateTag } from 'next/cache';
import prisma from '@utils/prisma';
import { Prisma } from '@prisma/generated/client';
import { PET_COLOR_NAME_OVERRIDES, PET_COLORS_CACHE_TAG } from '@utils/pet-utils';

const TARNUM_KEY = process.env.TARNUM_KEY;
const TARNUM_SERVER = process.env.TARNUM_SERVER;

type PetColorEntry = {
  id: number;
  name: string;
};

type ColorBySpeciesEntry = {
  colorId: number;
  colorName: string;
};

type PetsApiResponse = {
  success: boolean;
  colors?: PetColorEntry[];
  colorsBySpecies?: Record<string, ColorBySpeciesEntry[]>;
};

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const auth = request.headers.get('authorization');
  return !!auth && auth === TARNUM_KEY;
}

async function syncPetColors() {
  const petsRes = await axios.get(TARNUM_SERVER + '/neopets/pool', {
    params: {
      mode: 'AllPets',
    },
  });

  const petsData = petsRes.data as PetsApiResponse;

  if (!petsData?.success || !petsData.colors?.length || !petsData.colorsBySpecies) {
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }

  const existingColors = await prisma.petColor.findMany({
    select: { id: true },
  });
  const existingColorIds = new Set(existingColors.map((c) => c.id));

  const newColors: Prisma.PetColorCreateManyInput[] = petsData.colors
    .filter((color) => !existingColorIds.has(color.id))
    .map((color) => ({
      id: color.id,
      name: PET_COLOR_NAME_OVERRIDES[color.id] ?? color.name,
    }));

  const comboPairs: Prisma.ColorSpeciesCreateManyInput[] = [];
  for (const [speciesId, colors] of Object.entries(petsData.colorsBySpecies)) {
    const species_id = Number(speciesId);
    if (!species_id || !Array.isArray(colors)) continue;

    for (const color of colors) {
      comboPairs.push({
        species_id,
        color_id: color.colorId,
      });
    }
  }

  if (comboPairs.length === 0) {
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }

  const existingCombos = await prisma.colorSpecies.findMany({
    select: { species_id: true, color_id: true },
  });
  const existingComboKeys = new Set(existingCombos.map((c) => `${c.species_id}:${c.color_id}`));

  const newCombos = comboPairs.filter(
    (pair) => !existingComboKeys.has(`${pair.species_id}:${pair.color_id}`)
  );

  const [colorsResult, combosResult] = await prisma.$transaction([
    prisma.petColor.createMany({ data: newColors, skipDuplicates: true }),
    prisma.colorSpecies.createMany({ data: newCombos, skipDuplicates: true }),
  ]);

  if (colorsResult.count > 0) {
    revalidateTag(PET_COLORS_CACHE_TAG, { expire: 0 });
  }

  return Response.json({
    colorsCreated: colorsResult.count,
    combosCreated: combosResult.count,
    colorsTotal: petsData.colors.length,
    combosTotal: comboPairs.length,
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return syncPetColors();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return syncPetColors();
}
