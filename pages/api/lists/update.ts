import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { CheckAuth } from '../../../utils/googleCloud';
import { ListItemInfo } from '../../../types';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const { list_id } = req.body;
  const action = req.body.action ?? 'update';

  try {
    const { user } = await CheckAuth(req);
    if (!user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const list = await prisma.userList.findUnique({
      where: {
        internal_id: list_id,
      },
    });

    if (!list)
      return res
        .status(400)
        .json({ success: false, message: 'List not found' });

    if (list.user_id !== user.id && !user.isAdmin)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

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

      if (!listDestId)
        return res
          .status(400)
          .json({ success: false, message: 'listDestId is required' });

      const listDest = await prisma.userList.findUnique({
        where: {
          internal_id: Number(listDestId),
        },
      });

      if (!listDest)
        return res
          .status(400)
          .json({ success: false, message: 'List not found' });

      if (listDest.user_id !== user.id && !user.isAdmin)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });

      const ids = itemInfo.map((item) => item.internal_id);

      const create = prisma.listItems.createMany({
        data: itemInfo.map((item) => {
          return {
            list_id: listDest.internal_id,
            item_iid: item.item_iid,
            capValue: item.capValue,
            isHighlight: item.isHighlight,
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
      cover_url,
      purpose,
      visibility,
      colorHex,
      official,
      sortInfo,
      order,
    } = req.body as {
      name?: string;
      description?: string;
      cover_url?: string;
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
      cover_url ||
      purpose ||
      visibility ||
      colorHex ||
      official ||
      sortInfo ||
      order
    ) {
      await prisma.userList.update({
        where: {
          internal_id: list_id,
        },
        data: {
          name,
          description,
          cover_url,
          colorHex,
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
}
