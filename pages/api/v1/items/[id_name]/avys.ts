import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/prisma';
import { getItem } from '.';
import { getItemLists } from './lists';
import { AvyData } from '@types';

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

  const result = await getAvyData(id);

  res.json(result);
}

export const getAvyData = async (item_iid: number) => {
  const officialLists = await getItemLists(item_iid, true);

  const avyRaw = await prisma.avatarSolution.findMany({
    where: {
      OR: [
        {
          item_iid: item_iid,
        },
        {
          list_id: {
            in: officialLists.map((list) => list.internal_id),
          },
        },
      ],
    },
  });

  if (avyRaw.length === 0) return null;

  const avyData: AvyData[] = avyRaw.map((avy) => {
    const associatedList = officialLists.find((list) => list.internal_id === avy.list_id);
    return {
      name: avy.name,
      solution: avy.solution,
      img: avy.image,
      releaseDate: avy.releasedAt ? avy.releasedAt.toJSON() : null,
      list: associatedList
        ? {
            id: associatedList.internal_id,
            name: associatedList.name,
            description: associatedList.description,
            slug: associatedList.slug!,
          }
        : null,
    };
  });

  return avyData;
};
