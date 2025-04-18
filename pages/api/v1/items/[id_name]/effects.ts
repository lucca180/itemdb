import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../../utils/googleCloud';
import { ItemData, ItemEffect } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { getItem } from '.';
import { ItemEffect as PrimsaItemEffect } from '@prisma/generated/client';
import {
  allNeopetsColors,
  allSpecies,
  getPetColorId,
  getSpeciesId,
  petpetColors,
} from '../../../../../utils/pet-utils';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method == 'GET') return GET(req, res);
  if (req.method == 'POST') return POST(req, res);
  if (req.method == 'PATCH') return PATCH(req, res);
  if (req.method == 'DELETE') return DELETE(req, res);
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const effects = await getItemEffects(req.query.id_name as string);

  return res.status(200).json(effects);
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = (await CheckAuth(req)).user;

    if (!user || !user.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id_name } = req.query;

  const item = await getItem(id_name as string | number);
  if (!item) return res.status(400).json({ error: 'Item not found' });

  const { effect } = req.body as { effect: ItemEffect };

  const newEffect = await prisma.itemEffect.create({
    data: {
      item_iid: item.internal_id,
      type: effect.type,
      name: effect.name,
      species: effect.species?.toString() || undefined,
      isChance: effect.isChance,
      minVal: effect.minVal ? Number(effect.minVal) : undefined,
      maxVal: effect.maxVal ? Number(effect.maxVal) : undefined,
      strVal: effect.strVal,
      colorTarget: getPetColorId(effect.colorTarget ?? '') || undefined,
      speciesTarget: getSpeciesId(effect.speciesTarget ?? '') || undefined,
      text: effect.text,
    },
  });

  await revalidateItem(item.slug!, res);
  return res.status(200).json(formatEffect(newEffect));
};

const PATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = (await CheckAuth(req)).user;

    if (!user || !user.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { effect, effect_id } = req.body as { effect: ItemEffect; effect_id: number };

  const updated = await prisma.itemEffect.update({
    where: {
      internal_id: effect_id,
    },
    data: {
      type: effect.type,
      name: effect.name,
      species: effect.species?.toString() || undefined,
      isChance: effect.isChance,
      minVal: effect.minVal ? Number(effect.minVal) : undefined,
      maxVal: effect.maxVal ? Number(effect.maxVal) : undefined,
      strVal: effect.strVal,
      text: effect.text,
      colorTarget: getPetColorId(effect.colorTarget ?? '') || undefined,
      speciesTarget: getSpeciesId(effect.speciesTarget ?? '') || undefined,
    },
  });

  const { id_name } = req.query;
  const item = await getItem(id_name as string);
  if (item) {
    await revalidateItem(item.slug!, res);
  }

  return res.status(200).json(formatEffect(updated));
};

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = (await CheckAuth(req)).user;

    if (!user || !user.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { effect_id } = req.query;
  if (!effect_id || isNaN(Number(effect_id))) return res.status(400).json({ error: 'Bad Request' });

  await prisma.itemEffect.delete({
    where: {
      internal_id: Number(effect_id),
    },
  });

  const { id_name } = req.query;
  const item = await getItem(id_name as string);
  if (item) {
    await revalidateItem(item.slug!, res);
  }

  return res.status(200).json({});
};

export const getItemEffects = async (item_id_name: ItemData | string | number) => {
  const item =
    typeof item_id_name === 'object'
      ? item_id_name
      : await getItem(item_id_name.toString() as string);

  if (!item) throw new Error('Item not found');

  const effectsRaw = await prisma.itemEffect.findMany({
    where: {
      item_iid: item.internal_id,
    },
  });

  const effects = effectsRaw.map((effect) => formatEffect(effect));
  const isFood = item.useTypes.canEat === 'true';

  // some custom effects
  if (!isFood) return effects;

  if (item.name.toLowerCase().includes('cheese')) {
    effects.push({
      internal_id: -1,
      type: 'disease',
      name: 'Neezles',
      species: ['Skeith'],
      isChance: false,
    });
  }

  if (item.name.toLowerCase().includes('negg')) {
    effects.push({
      internal_id: -1,
      type: 'disease',
      name: 'Neezles',
      species: ['Tonu'],
      isChance: false,
    });
  }

  if (item.name.toLowerCase().includes('cream')) {
    effects.push({
      internal_id: -1,
      type: 'disease',
      name: 'Neezles',
      species: ['Quiggle'],
      isChance: false,
    });
  }

  if (item.name.toLowerCase().includes('apple')) {
    effects.push({
      internal_id: -1,
      type: 'disease',
      name: 'Itchy Scratchies',
      species: ['Kyrii'],
      isChance: false,
    });
  }

  if (item.name.toLowerCase().includes('worm')) {
    effects.push({
      internal_id: -1,
      type: 'cureDisease',
      name: 'Any Disease',
      species: ['Pteri'],
      isChance: false,
    });
  }

  return effects as ItemEffect[];
};

export const formatEffect = (effect: PrimsaItemEffect) => {
  let colorTarget = null;
  if (effect.colorTarget && effect.type === 'colorSpecies') {
    colorTarget = allNeopetsColors[`${effect.colorTarget}`];
  } else if (effect.colorTarget && effect.type === 'petpetColor') {
    colorTarget = petpetColors[`${effect.colorTarget}`];
  }

  const obj: ItemEffect = {
    internal_id: effect.internal_id,
    type: effect.type as ItemEffect['type'],
    name: effect.name,
    species: effect.species?.split(',') ?? null,
    isChance: effect.isChance,
    minVal: effect.minVal,
    maxVal: effect.maxVal,
    strVal: effect.strVal,
    colorTarget: colorTarget,
    speciesTarget: effect.speciesTarget ? allSpecies[`${effect.speciesTarget}`] : null,
    text: effect.text,
  };

  return JSON.parse(JSON.stringify(obj)) as ItemEffect;
};

export const revalidateItem = async (slug: string, res: NextApiResponse, onlyGenerated = true) => {
  const options = onlyGenerated ? undefined : { unstable_onlyGenerated: false };

  return Promise.allSettled([
    res.revalidate(`/item/${slug}`, options),
    res.revalidate(`/pt/item/${slug}`, options),
  ]);
};
