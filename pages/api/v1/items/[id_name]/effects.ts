import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../../utils/googleCloud';
import { ItemEffect } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { getItem } from '.';
import { ItemEffect as PrimsaItemEffect } from '@prisma/client';

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
  let id = Number(id_name);

  if (isNaN(id)) {
    const item = await getItem(id_name as string);
    if (!item) return res.status(400).json({ error: 'Item not found' });
    id = item.internal_id;
  }

  const { effect } = req.body as { effect: ItemEffect };

  const newEffect = await prisma.itemEffect.create({
    data: {
      item_iid: id,
      type: effect.type,
      name: effect.name,
      species: effect.species?.toString(),
      isChance: effect.isChance,
      minVal: effect.minVal,
      maxVal: effect.maxVal,
      strVal: effect.strVal,
    },
  });

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
      species: effect.species?.toString(),
      isChance: effect.isChance,
      minVal: effect.minVal,
      maxVal: effect.maxVal,
      strVal: effect.strVal,
      text: effect.text,
    },
  });

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

  return res.status(200).json({});
};

export const getItemEffects = async (id_name: string | number) => {
  const item = await getItem(id_name as string);
  if (!item) throw new Error('Item not found');

  const effectsRaw = await prisma.itemEffect.findMany({
    where: {
      item_iid: item.internal_id,
    },
  });

  const effects = effectsRaw.map((effect) => formatEffect(effect));

  // some custom effects

  if (item.name.toLowerCase().split(' ').includes('cheese')) {
    effects.push({
      internal_id: -1,
      type: 'disease',
      name: 'Neezles',
      species: ['Skeith'],
      isChance: false,
    });
  }

  if (item.name.toLowerCase().split(' ').includes('negg')) {
    effects.push({
      internal_id: -1,
      type: 'disease',
      name: 'Neezles',
      species: ['Tonu'],
      isChance: false,
    });
  }

  if (item.name.toLowerCase().split(' ').includes('cream')) {
    effects.push({
      internal_id: -1,
      type: 'disease',
      name: 'Neezles',
      species: ['Quiggle'],
      isChance: false,
    });
  }

  if (item.name.toLowerCase().split(' ').includes('apple')) {
    effects.push({
      internal_id: -1,
      type: 'disease',
      name: 'Itchy Scratchies',
      species: ['Kyrii'],
      isChance: false,
    });
  }

  console.log(effects);

  return effects as ItemEffect[];
};

const formatEffect = (effect: PrimsaItemEffect) => {
  const obj = {
    internal_id: effect.internal_id,
    type: effect.type,
    name: effect.name,
    species: effect.species?.split(','),
    isChance: effect.isChance,
    minVal: effect.minVal,
    maxVal: effect.maxVal,
    strVal: effect.strVal,
    text: effect.text,
  };

  return JSON.parse(JSON.stringify(obj)) as ItemEffect;
};
