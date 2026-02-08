import type { NextApiRequest, NextApiResponse } from 'next';
import { BDData, BDIconTypes } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { getItem } from '.';
import { getBDProcessData } from '../../bd/process';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name;
  let id = Number(id_name);
  if (isNaN(id)) {
    const item = await getItem(id_name as string);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    id = item.internal_id;
  }

  const result = await getBDData(id);

  res.json(result);
}

export const getBDData = async (item_iid: number): Promise<BDData | null> => {
  const bdData = await prisma.bdEffects.findMany({
    where: { item_iid },
    orderBy: {
      type: 'asc',
    },
  });

  if (bdData.length === 0) {
    const hasBDProcess = getBDProcessData(item_iid);
    if (!hasBDProcess) return null;

    return { processing: true };
  }

  const terms = ['attack', 'defense', 'reflect'] as const;

  const result: BDData = {};

  for (const effect of bdData) {
    if (terms.some((term) => effect.type.startsWith(term))) {
      const [type, icon] = effect.type.split('_') as [
        'attack' | 'defense' | 'reflect',
        BDIconTypes,
        number,
      ];

      result[type] = result[type] || [];
      result[type].push({ type: icon, key: effect.type, value: effect.value });
    }

    if (effect.type === 'notes') {
      result['notes'] = effect.value;
    }

    if (effect.type.includes('other_')) {
      result['other'] = result['other'] || {};
      const otherKey = effect.type.replace('other_', '');
      result['other'][otherKey] = effect.value;
    }
  }

  return result;
};
