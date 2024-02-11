import type { NextApiRequest, NextApiResponse } from 'next';
import { UserList } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { startOfDay } from 'date-fns';

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

  return listsRaw.map((list) => {
    const owner = list.user;

    return {
      internal_id: list.internal_id,
      name: list.name,
      description: list.description,
      coverURL: list.cover_url,
      colorHex: list.colorHex,
      purpose: list.purpose,
      official: list.official,
      visibility: list.visibility,
      user_id: list.user_id,
      user_username: owner?.username ?? '',
      user_neouser: owner?.neo_user ?? '',

      owner: {
        id: owner.id,
        username: owner.username,
        neopetsUser: owner.neo_user,
        lastSeen: startOfDay(owner.last_login).toJSON(),
      },

      dynamicType: list.dynamicType,
      lastSync: list.lastSync?.toJSON() ?? null,
      linkedListId: list.linkedListId,

      createdAt: list.createdAt.toJSON(),
      updatedAt: list.updatedAt.toJSON(),

      officialTag: list.official_tag,

      sortBy: list.sortBy,
      sortDir: list.sortDir,
      order: list.order ?? 0,

      itemCount: list.items.filter((x) => !x.isHidden).length,
      itemInfo: !includeItems
        ? []
        : list.items.map((item) => {
            return {
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
            };
          }),
    };
  });
};
