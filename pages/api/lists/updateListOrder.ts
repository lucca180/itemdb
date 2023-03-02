import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { UserList } from '../../../types';
import { CheckAuth } from '../../../utils/googleCloud';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const lists = req.body.lists as UserList[];

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

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
}
