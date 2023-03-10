import { UserList } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);
  if (req.method === 'PUT') return PUT(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// gets all list of a user
const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;
  if (!username || typeof username !== 'string')
    return res.status(400).json({ error: 'Bad Request' });

  const isOfficial = username === 'official';

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  try {
    const listsRaw = await prisma.userList.findMany({
      where: !isOfficial
        ? {
            visibility: user?.username === username ? undefined : 'public',
            user: {
              username: username,
            },
          }
        : {
            official: true,
          },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const owner = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    const lists: UserList[] = listsRaw
      .map((list) => {
        return {
          internal_id: list.internal_id,
          name: list.name,
          description: list.description,
          cover_url: list.cover_url,
          colorHex: list.colorHex,
          purpose: list.purpose,
          official: list.official,
          visibility: list.visibility,

          user_id: list.user_id,
          user_username: owner?.username ?? '',
          user_neouser: owner?.neo_user ?? '',

          createdAt: list.createdAt,
          updatedAt: list.updatedAt,

          sortDir: list.sortDir,
          sortBy: list.sortBy,
          order: list.order ?? 0,

          itemCount: list.items.length,
          itemInfo: list.items.map((item) => {
            return {
              internal_id: item.internal_id,
              list_id: item.list_id,
              item_iid: item.item_iid,
              addedAt: item.addedAt,
              updatedAt: item.updatedAt,
              amount: item.amount,
              capValue: item.capValue,
              imported: item.imported,
              order: item.order,
              isHighlight: item.isHighlight,
            };
          }),
        };
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt < b.createdAt ? -1 : 1));

    return res.status(200).json(lists);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// creates a new list
const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;
  const { name, description, cover_url, purpose, visibility, colorHex } = req.body;

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.username !== username && !user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    if (!name || !purpose || !visibility) return res.status(400).json({ error: 'Bad Request' });

    if (!['public', 'private', 'unlisted'].includes(visibility))
      return res.status(400).json({ error: 'Bad Request' });

    if (!['none', 'trading', 'seeking'].includes(purpose))
      return res.status(400).json({ error: 'Bad Request' });

    const list = await prisma.userList.create({
      data: {
        name,
        description,
        cover_url,
        colorHex,
        purpose: purpose as 'none' | 'trading' | 'seeking',
        visibility: visibility as 'public' | 'private' | 'unlisted',
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return res.status(200).json({ success: true, message: list });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// deletes a list
const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;
  let listsIds = req.body.listIds;

  if (!listsIds) return res.status(400).json({ error: 'Bad Request' });
  listsIds = listsIds.map((id: string) => Number(id)) as number[];

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.username !== username && !user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    const result = await prisma.userList.deleteMany({
      where: {
        internal_id: {
          in: listsIds,
        },
        user_id: user.isAdmin ? undefined : user.id,
        official: user.isAdmin ? undefined : false,
      },
    });

    return res.status(200).json({ success: true, message: result });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// handles list reorder
const PUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;
  if (!username || typeof username !== 'string')
    return res.status(400).json({ error: 'Bad Request' });

  const lists = req.body.lists as UserList[];

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.username !== username && !user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    const updateLists = lists.map((list) =>
      prisma.userList.update({
        where: {
          internal_id: list.internal_id,
          user_id: user.isAdmin ? undefined : user.id,
        },
        data: {
          order: list.order,
          updatedAt: new Date(),
        },
      })
    );

    const result = await prisma.$transaction(updateLists);

    return res.status(200).json({ success: true, message: result });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ----------- //
