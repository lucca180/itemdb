import { startOfDay } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import { getImagePalette } from '..';
import { ListItemInfo, UserList, User } from '../../../../../../types';
import { CheckAuth } from '../../../../../../utils/googleCloud';
import prisma from '../../../../../../utils/prisma';
import { syncDynamicList } from './dynamic';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'PUT') return PUT(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// get a list
const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, list_id } = req.query;
  const isOfficial = username === 'official';

  if (!username || !list_id || Array.isArray(username) || Array.isArray(list_id))
    return res.status(400).json({ error: 'Bad Request' });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  try {
    const list = await getList(username, parseInt(list_id), user, isOfficial);

    return res.status(200).json(list);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// updates a list / move items to another list / delete items
const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { list_id } = req.query;
  const action = req.body.action ?? 'update';

  if (!list_id || Array.isArray(list_id)) return res.status(400).json({ error: 'Bad Request' });

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const list = await prisma.userList.findUnique({
      where: {
        internal_id: Number(list_id),
      },
    });

    if (!list) return res.status(400).json({ error: 'List not found' });

    if (list.user_id !== user.id && !user.isAdmin)
      return res.status(401).json({ error: 'Unauthorized' });

    const itemInfo = req.body.itemInfo as ListItemInfo[];

    if (itemInfo?.length && action === 'update') {
      const updateList = itemInfo.map((item) => {
        return prisma.listItems.update({
          where: {
            internal_id: item.internal_id,
          },
          data: {
            capValue: item.capValue,
            updatedAt: new Date(),
            order: item.order,
            isHighlight: item.isHighlight,
            isHidden: item.isHidden,
            amount: item.amount,
          },
        });
      });

      await prisma.$transaction(updateList);
    }

    if (itemInfo?.length && action === 'delete') {
      const ids = itemInfo.map((item) => item.internal_id);

      const deleted = await prisma.listItems.deleteMany({
        where: {
          internal_id: {
            in: ids,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: `deleted ${deleted.count} items`,
      });
    }

    if (itemInfo?.length && action === 'move') {
      const listDestId = req.body.listDestId as string;

      if (!listDestId) return res.status(400).json({ error: 'listDestId is required' });

      const listDest = await prisma.userList.findUnique({
        where: {
          internal_id: Number(listDestId),
        },
      });

      if (!listDest) return res.status(400).json({ error: 'List not found' });

      if (listDest.user_id !== user.id && !user.isAdmin)
        return res.status(401).json({ error: 'Unauthorized' });

      const ids = itemInfo.map((item) => item.internal_id);

      const create = prisma.listItems.createMany({
        data: itemInfo.map((item) => {
          return {
            list_id: listDest.internal_id,
            item_iid: item.item_iid,
            capValue: item.capValue,
            isHighlight: item.isHighlight,
            isHidden: item.isHidden,
            amount: item.amount,
          };
        }),
        skipDuplicates: true,
      });

      const update = prisma.listItems.deleteMany({
        where: {
          internal_id: {
            in: ids,
          },
        },
      });

      const result = await prisma.$transaction([create, update]);

      return res.status(200).json({
        success: true,
        message: `moved ${result[0].count} items`,
      });
    }

    // ----------------  UPDATE LIST ------------------ //

    const {
      name,
      description,
      coverURL,
      purpose,
      visibility,
      colorHex,
      official,
      sortInfo,
      order,
    } = req.body as {
      name?: string;
      description?: string;
      coverURL?: string;
      purpose?: 'none' | 'trading' | 'seeking';
      visibility?: 'public' | 'private' | 'unlisted';
      colorHex?: string;
      official?: boolean;
      order?: string;
      sortInfo?: { sortBy: string; sortDir: string };
    };

    if (
      name ||
      description ||
      coverURL ||
      purpose ||
      visibility ||
      colorHex ||
      official ||
      sortInfo ||
      order
    ) {
      let colorHexVar = colorHex;

      if ((!colorHexVar || colorHexVar === '#000000') && coverURL) {
        const colors = await getImagePalette(coverURL);
        colorHexVar = colors.vibrant.hex;
      }

      await prisma.userList.update({
        where: {
          internal_id: Number(list_id),
        },
        data: {
          name,
          description,
          cover_url: coverURL,
          colorHex: colorHexVar,
          official: user.isAdmin ? official : undefined,
          order: order ? Number(order) : undefined,
          purpose: purpose,
          visibility: visibility,
          sortBy: sortInfo?.sortBy,
          sortDir: sortInfo?.sortDir,
        },
      });
    }

    return res.status(200).json({ success: true, message: 'list updated' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// add item to list
const PUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, list_id, alertDuplicates } = req.query;

  if (!username || !list_id || Array.isArray(username) || Array.isArray(list_id))
    return res.status(400).json({ error: 'Bad Request' });

  const items = req.body.items as {
    item_iid: string;
    capValue: string | undefined;
    amount: string | undefined;
    imported: boolean;
  }[];

  if (!items) return res.status(400).json({ error: 'Bad Request' });

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.username !== username && !user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    const list = await prisma.userList.findUnique({
      where: {
        internal_id: parseInt(list_id),
      },
      include: {
        items: alertDuplicates === 'true',
      },
    });

    if (!list) return res.status(400).json({ error: 'List Not Found' });

    if (list.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    if (alertDuplicates === 'true') {
      const itemIids = new Set(items.map((item) => parseInt(item.item_iid)));
      const hasDuplicates = list.items.filter((item) => itemIids.has(item.item_iid));

      if (hasDuplicates.length) {
        return res.status(400).json({ error: 'Duplicate Items', data: hasDuplicates });
      }
    }

    const transactions = [];

    for (const item of items) {
      const { item_iid, capValue, amount, imported } = item;

      const listItem = prisma.listItems.upsert({
        where: {
          list_id_item_iid: {
            list_id: parseInt(list_id),
            item_iid: parseInt(item_iid),
          },
        },
        create: {
          list_id: parseInt(list_id),
          item_iid: parseInt(item_iid),
          capValue: capValue ? parseInt(capValue) : undefined,
          amount: amount ? parseInt(amount) : undefined,
          imported: imported,
        },
        update: {
          list_id: parseInt(list_id),
          item_iid: parseInt(item_iid),
          capValue: capValue ? parseInt(capValue) : undefined,
          amount: amount ? parseInt(amount) : undefined,
          imported: imported,
        },
      });

      transactions.push(listItem);
    }

    const updateList = prisma.userList.update({
      where: {
        internal_id: parseInt(list_id),
      },
      data: {
        updatedAt: new Date(),
      },
    });

    const result = await prisma.$transaction([...transactions, updateList]);

    return res.status(200).json({ success: true, message: result });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { list_id, hide } = req.query;
  if (!list_id || Array.isArray(list_id)) return res.status(400).json({ error: 'Bad Request' });

  let justHide = hide === 'true';

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const list = await prisma.userList.findUnique({
      where: {
        internal_id: Number(list_id),
      },
    });

    if (!list) return res.status(400).json({ error: 'List not found' });

    if (list.user_id !== user.id && !user.isAdmin)
      return res.status(401).json({ error: 'Unauthorized' });

    const item_internal_ids = req.body.item_iid as string[];

    if (!item_internal_ids || !item_internal_ids.length)
      return res.status(400).json({ error: 'Bad Request' });

    if (list.dynamicType === 'fullSync') justHide = true;

    let operation;
    if (justHide) {
      operation = prisma.listItems.updateMany({
        where: {
          list_id: list.internal_id,
          item_iid: {
            in: item_internal_ids.map((iid) => Number(iid)),
          },
        },
        data: {
          isHidden: true,
        },
      });
    } else {
      operation = prisma.listItems.deleteMany({
        where: {
          list_id: Number(list_id),
          item_iid: {
            in: item_internal_ids.map((iid) => Number(iid)),
          },
        },
      });
    }

    const updateList = prisma.userList.update({
      where: {
        internal_id: parseInt(list_id),
      },
      data: {
        updatedAt: new Date(),
      },
    });

    await prisma.$transaction([operation, updateList]);

    return res.status(200).json({
      success: true,
      message: `deleted items`,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getList = async (
  username: string,
  list_id: number,
  userOrToken?: User | null | string,
  isOfficial = false
) => {
  const listRaw = await prisma.userList.findUnique({
    where: {
      internal_id: list_id,
      official: isOfficial || undefined,
      user: {
        username: isOfficial ? undefined : username,
      },
    },
    include: {
      items: true,
      user: true,
    },
  });

  let user = userOrToken as User | null;

  if (typeof userOrToken === 'string') {
    user = (await CheckAuth(null, userOrToken)).user;
  }

  if (
    !listRaw ||
    (!listRaw.official && listRaw.visibility === 'private' && listRaw.user_id !== user?.id)
  )
    return null;

  if (listRaw.dynamicType) await syncDynamicList(listRaw.internal_id);

  const owner = listRaw.user;

  const list: UserList = {
    internal_id: listRaw.internal_id,
    name: listRaw.name,
    description: listRaw.description,
    coverURL: listRaw.cover_url,
    colorHex: listRaw.colorHex,
    purpose: listRaw.purpose,
    official: listRaw.official,
    visibility: listRaw.visibility,
    user_id: listRaw.user_id,
    user_username: owner?.username ?? '',
    user_neouser: owner?.neo_user ?? '',

    owner: {
      id: owner.id,
      username: owner.username,
      neopetsUser: owner.neo_user,
      lastSeen: startOfDay(owner.last_login).toJSON(),
    },

    createdAt: listRaw.createdAt.toJSON(),
    updatedAt: listRaw.updatedAt.toJSON(),

    sortBy: listRaw.sortBy,
    sortDir: listRaw.sortDir,
    order: listRaw.order ?? 0,

    dynamicType: listRaw.dynamicType,
    lastSync: listRaw.lastSync?.toJSON() ?? null,
    linkedListId: listRaw.linkedListId ?? null,

    itemCount: listRaw.items.filter((x) => !x.isHidden).length,
    itemInfo: listRaw.items.map((item) => {
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

  return list;
};
