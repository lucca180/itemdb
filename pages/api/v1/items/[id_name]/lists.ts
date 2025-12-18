import type { NextApiRequest, NextApiResponse } from 'next';
import { UserList } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { rawToList } from '@services/ListService';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name;
  const id = Number(id_name);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid Request' });

  const onlyOfficial = req.query.official === 'true';
  const includeItems = req.query.includeItems !== 'false';
  const listsRaw = await getItemLists(id, onlyOfficial, includeItems);

  res.json(listsRaw);
}

export const getItemLists = async (
  id: number,
  onlyOfficial: boolean,
  includeItems = true
): Promise<UserList[]> => {
  const listsRaw = await prisma.userList.findMany({
    where: {
      official: onlyOfficial || undefined,
      visibility: onlyOfficial ? undefined : 'public',
      purpose: onlyOfficial
        ? undefined
        : {
            not: 'none',
          },
      items: {
        some: {
          item_iid: id,
          isHidden: false,
        },
      },
    },
    include: {
      items: true,
      user: true,
    },
  });

  return listsRaw
    .map((list) => {
      const newList = rawToList(list, list.user, includeItems);
      if (includeItems) return newList;
      const item = list.items.find((item) => item.item_iid === id)!;

      newList.itemInfo = [
        {
          ...item,
          addedAt: item.addedAt.toJSON(),
          updatedAt: item.updatedAt.toJSON(),
          seriesStart: item.seriesStart?.toJSON() ?? null,
          seriesEnd: item.seriesEnd?.toJSON() ?? null,
        },
      ];

      return newList;
    })
    .filter(
      (list) => new Date(list.owner.lastSeen).getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000
    );
};
