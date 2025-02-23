import { NextApiRequest, NextApiResponse } from 'next';
import { allNeopetsColors, allSpecies, getPetColorId, getSpeciesId } from '../../../../utils/utils';
import prisma from '../../../../utils/prisma';
import { getManyItems } from '../items/many';
import axios from 'axios';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  // if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const colorTarget = req.query.colorTarget as string | undefined;
  const speciesTarget = req.query.speciesTarget as string | undefined;

  let colorTargetId: number | undefined = colorTarget ? Number(colorTarget) : undefined;
  let speciesTargetId: number | undefined = speciesTarget ? Number(speciesTarget) : undefined;

  if (colorTarget && (!colorTargetId || isNaN(colorTargetId))) {
    colorTargetId = getPetColorId(colorTarget) ?? undefined;
  }

  if (speciesTarget && (!speciesTargetId || isNaN(speciesTargetId))) {
    speciesTargetId = getSpeciesId(speciesTarget) ?? undefined;
  }

  if (!colorTarget && !speciesTarget) {
    return res.status(400).json({ error: 'Missing query parameters' });
  }

  if (colorTargetId && speciesTargetId) {
    const exists = await checkPetColorExists(colorTargetId, speciesTargetId);
    if (!exists) return res.status(400).json({ error: 'pet_color_not_found' });
  }

  const response = await getPetColorData(colorTargetId, speciesTargetId);

  return res.status(200).json(response);
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
      } catch (e) {
        return false;
      }
    }
  }

  return true;
};

export const getPetColorData = async (
  colorTargetId: number | undefined,
  speciesTargetId: number | undefined
) => {
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
        (itemData[a.item_iid].price.value ?? Infinity) -
        (itemData[b.item_iid].price.value ?? Infinity)
    )
    .map((x) => x.item_iid);

  const colorChanges = rawData
    .filter((data) => data.colorTarget === colorTargetId && data.speciesTarget !== speciesTargetId)
    .filter((data) => !(data.item_iid === 14488 && speciesTargetId === 7)) // remove orange paint brush from chias
    .sort(
      (a, b) =>
        (itemData[a.item_iid].price.value ?? Infinity) -
        (itemData[b.item_iid].price.value ?? Infinity)
    )
    .map((x) => x.item_iid);

  const speciesChanges = rawData
    .filter((data) => data.speciesTarget === speciesTargetId)
    .sort(
      (a, b) =>
        (itemData[a.item_iid].price.value ?? Infinity) -
        (itemData[b.item_iid].price.value ?? Infinity)
    )
    .map((x) => x.item_iid);

  let cheapestChange = [];
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
    species: speciesTargetId ? allSpecies[speciesTargetId].toLowerCase() : '',
    color: colorTargetId ? allNeopetsColors[colorTargetId].toLowerCase() : '',
  };

  if (!speciesTargetId) {
    const cheapestEffect = rawData.find((data) => data.item_iid === cheapestChange[0]);
    if (cheapestEffect && cheapestEffect.speciesTarget) {
      thumbnail.species = allSpecies[cheapestEffect.speciesTarget].toLowerCase();
    }
  }

  if (!colorTargetId) {
    const cheapestEffect = rawData.find((data) => data.item_iid === cheapestChange.at(-1));
    if (cheapestEffect && cheapestEffect.colorTarget) {
      thumbnail.color = allNeopetsColors[cheapestEffect.colorTarget].toLowerCase();
    }
  }

  const response = {
    speciesId: speciesTargetId || null,
    colorId: colorTargetId || null,
    thumbnail,
    speciesName: speciesTargetId ? allSpecies[speciesTargetId] : null,
    colorName: colorTargetId ? allNeopetsColors[colorTargetId] : null,
    perfectMatch: perfectMatch.map((id) => itemData[id]),
    colorChanges: colorChanges.map((id) => itemData[id]),
    speciesChanges: speciesChanges.map((id) => itemData[id]),
    cheapestChange: cheapestChange.map((id) => itemData[id]),
  };

  return response;
};

export const getPetColorDataStr = async (
  colorTarget: string | undefined,
  speciesTarget: string | undefined
) => {
  let colorTargetId: number | undefined = colorTarget ? Number(colorTarget) : undefined;
  let speciesTargetId: number | undefined = speciesTarget ? Number(speciesTarget) : undefined;

  if (colorTarget && (!colorTargetId || isNaN(colorTargetId))) {
    colorTargetId = getPetColorId(colorTarget) ?? undefined;
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

  return getPetColorData(colorTargetId, speciesTargetId);
};
