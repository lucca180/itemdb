import { NextApiRequest, NextApiResponse } from 'next';
import { ItemData, ItemPetpetData } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { getManyItems } from '../many';
import { getItem } from '.';
import { petpetColors, petpetSpecies } from '../../../../../utils/pet-utils';
import { CheckAuth } from '../../../../../utils/googleCloud';
import { revalidateItem } from './effects';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const { id_name } = req.query;

  const item = await getItem(id_name as string | number);
  if (!item) return res.status(400).json({ error: 'Item not found' });

  const petpetData = await getPetpetData(item);

  return res.status(200).json(petpetData);
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const { id_name } = req.query;

  const item = await getItem(id_name as string | number);
  if (!item) return res.status(400).json({ error: 'Item not found' });

  let { item_iid, color, species, isUnpaintable, isCanonical } = req.body;

  isUnpaintable = isUnpaintable === 'true' || isUnpaintable === true;
  isCanonical = isCanonical === 'true' || isCanonical === true;

  if (typeof item_iid !== 'number' || typeof color !== 'string' || typeof species !== 'string')
    return res.status(400).json({ error: 'Invalid body' });

  const speciesId = Number(findSpecies(species));
  const colorId = Number(findColor(color));

  const petpet = await prisma.petpetColors.upsert({
    create: {
      item_iid: item.internal_id,
      petpet_id: speciesId,
      color_id: colorId,
      isUnpaintable: !!isUnpaintable ? true : false,
      isCanonical: !!isCanonical ? true : null,
    },
    update: {
      petpet_id: speciesId,
      color_id: colorId,
      isUnpaintable: !!isUnpaintable ? true : false,
      isCanonical: !!isCanonical ? true : null,
    },
    where: {
      item_iid: item.internal_id,
    },
  });

  await revalidateItem(item.slug!, res);

  return res.status(200).json(petpet);
}

async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const { id_name } = req.query;

  const item = await getItem(id_name as string | number);
  if (!item) return res.status(400).json({ error: 'Item not found' });

  const petpet = await prisma.petpetColors.delete({
    where: {
      item_iid: item.internal_id,
    },
  });

  return res.status(200).json(petpet);
}

export const getPetpetData = async (item: ItemData): Promise<ItemPetpetData | null> => {
  const originalPetpetData = await prisma.petpetColors.findMany({
    where: {
      item_iid: item.internal_id,
    },
  });

  if (!originalPetpetData.length) return null;

  const originalPetpet = originalPetpetData[0];

  const species = {
    name: petpetSpecies[originalPetpet.petpet_id],
    id: originalPetpet.petpet_id,
  };

  const color = {
    name: petpetColors[originalPetpet.color_id],
    id: originalPetpet.color_id,
  };

  if (originalPetpet.isUnpaintable || originalPetpet.isCanonical) {
    return {
      petpet: item,
      isCanonical: !!originalPetpet.isCanonical,
      isUnpaintable: originalPetpet.isUnpaintable,
      species,
      color,
      cheapest: null,
      toCanonical: null,
      alternativeWays: null,
    };
  }

  const allPetpetProm = prisma.petpetColors.findMany({
    where: {
      petpet_id: originalPetpet.petpet_id,
      isUnpaintable: false,
    },
  });

  const pbProm = prisma.itemEffect.findMany({
    where: {
      colorTarget: originalPetpet.color_id,
      type: 'petpetColor',
    },
  });

  const [allPetpet, pb] = await Promise.all([allPetpetProm, pbProm]);

  const itemData = await getManyItems({
    id: [...allPetpet.map((p) => p.item_iid.toString()), ...pb.map((p) => p.item_iid.toString())],
  });

  const canonical = allPetpet.find((p) => p.isCanonical);
  const targetPb = itemData[pb[0].item_iid.toString()];

  if (!targetPb) {
    return {
      petpet: item,
      isUnpaintable: false,
      isCanonical: false,
      toCanonical: null,
      species,
      color,
      cheapest: {
        items: [item],
        cost: item.price.value ?? null,
      },
      alternativeWays: null,
    };
  }

  const canonicalP2 =
    !canonical || canonical?.isUnpaintable ? null : itemData[canonical.item_iid.toString()];

  let cheapestP2 = null;

  for (const p of allPetpet) {
    if (p.isCanonical || p.isUnpaintable || p.item_iid === item.internal_id) continue;
    const targetPrice = itemData[p.item_iid.toString()].price.value ?? Infinity;
    if (!cheapestP2 || targetPrice < cheapestP2.price.value!) {
      cheapestP2 = itemData[p.item_iid.toString()];
    }
  }

  let canonicalPb = null;
  if (canonicalP2 && canonical) {
    const pbProm = await prisma.itemEffect.findMany({
      where: {
        colorTarget: canonical.color_id,
        type: 'petpetColor',
      },
    });

    canonicalPb = await getItem(pbProm[0].item_iid.toString());
  }

  if (!targetPb) {
    return {
      petpet: item,
      isUnpaintable: false,
      isCanonical: false,
      species,
      color,
      toCanonical: canonicalPb && canonicalP2 ? { pb: canonicalPb, p2: canonicalP2 } : null,
      cheapest: {
        items: [item],
        cost: item.price.value ?? null,
      },
      alternativeWays: null,
    };
  }

  const allWays = [];

  // option 1: buy the petpet painted
  let cheapestRoute = [item];

  // option 2: buy the canonical and paint it
  if (canonicalP2) {
    const price = getPriceSum([canonicalP2, targetPb]);
    const cheapestPrice = getPriceSum(cheapestRoute);

    allWays.push([canonicalP2, targetPb]);

    if (price < cheapestPrice) {
      cheapestRoute = [canonicalP2, targetPb];
    }
  }

  // option 3: buy the cheapest and paint it
  if (cheapestP2 && canonicalPb) {
    const price = getPriceSum([cheapestP2, targetPb]);
    const cheapestPrice = getPriceSum(cheapestRoute);

    allWays.push([cheapestP2, targetPb]);

    if (price < cheapestPrice) {
      cheapestRoute = [cheapestP2, targetPb];
    }
  }

  // remove cheapest from allWays
  const allWaysFiltered = allWays.filter(
    (way) =>
      way.map((x) => x.internal_id).toString() !==
      cheapestRoute.map((x) => x.internal_id).toString()
  );

  return {
    petpet: item,
    species,
    color,
    isUnpaintable: false,
    isCanonical: false,
    toCanonical: canonicalPb && canonicalP2 ? { pb: canonicalPb, p2: canonicalP2 } : null,
    cheapest: {
      items: cheapestRoute,
      cost: getPriceSum(cheapestRoute),
    },
    alternativeWays: allWaysFiltered,
  };
};

const getPriceSum = (items: ItemData[]) => {
  return items.reduce((acc, item) => acc + (item.price.value ?? Infinity), 0);
};

const findSpecies = (itemName: string) => {
  if (itemName.includes('Ultra Pinceron')) return '297';

  for (const [id, species] of Object.entries(petpetSpecies)) {
    const name = itemName.toLowerCase().split(' ');
    const speciesArr = species.toLowerCase().split(' ');

    if (speciesArr.every((word) => name.includes(word))) {
      return id;
    }
  }

  return null;
};

const findColor = (itemName: string) => {
  if (itemName.includes('Spoppy III')) return '999999';
  if (itemName.includes('Spoppy II')) return '99999';
  if (itemName.includes('Glowing')) return '17';
  for (const [id, color] of Object.entries(petpetColors)) {
    const name = itemName.toLowerCase().split(' ');
    const colorArr = color.toLowerCase().split(' ');

    if (colorArr.every((word) => name.includes(word))) {
      return id;
    }
  }

  return '9999';
};
