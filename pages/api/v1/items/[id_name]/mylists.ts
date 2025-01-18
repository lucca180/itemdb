import type { NextApiRequest, NextApiResponse } from 'next';
import { ObligatoryUserList } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { CheckAuth } from '../../../../../utils/googleCloud';
import { rawToList } from '../../lists/[username]';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const id_name = req.query.id_name;
  const id = Number(id_name);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid Request' });

  const listsRaw = await getItemMyLists(id, user.id);

  res.json(listsRaw);
}

export const getItemMyLists = async (
  item_id: number,
  user_id: string
): Promise<ObligatoryUserList[]> => {
  const listsRaw = await prisma.userList.findMany({
    where: {
      user_id: user_id,
      items: {
        some: {
          item_iid: item_id,
        },
      },
    },
    include: {
      user: true,
      items: true,
    },
  });

  return listsRaw.map((listRaw) => {
    const item = listRaw.items.find((item) => item.item_iid === item_id)!;
    const list = rawToList(listRaw, listRaw.user);

    list.itemInfo = [
      {
        internal_id: item.internal_id,
        list_id: item.list_id,
        item_iid: item.item_iid,
        addedAt: item.addedAt.toJSON(),
        updatedAt: item.updatedAt.toJSON(),
        amount: item.amount,
        capValue: item.capValue,
        imported: item.imported,
        order: item.order,
        isHighlight: item.isHighlight,
        isHidden: item.isHidden,
      },
    ];

    return list as ObligatoryUserList;
  });
};
