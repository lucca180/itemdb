import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { CheckAuth } from '../../../utils/googleCloud';
import { UserList } from '../../../types';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const username = req.query.username as string;
  if (!username)
    return res.status(400).json({ success: false, message: 'Bad Request' });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  try {
    const listsRaw = await prisma.userList.findMany({
      where: {
        visibility: user?.username === username ? undefined : 'public',
        user: {
          username: username,
        },
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
      .sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          (a.createdAt < b.createdAt ? -1 : 1)
      );

    return res.status(200).json(lists);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
