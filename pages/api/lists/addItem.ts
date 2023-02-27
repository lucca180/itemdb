import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { CheckAuth } from '../../../utils/googleCloud';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const { list_id, item_iid, capValue, amount, imported } = req.body;

  try {
    const { user } = await CheckAuth(req);
    if (!user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!list_id || !item_iid)
      return res.status(400).json({ success: false, message: 'Bad Request' });

    const list = await prisma.userList.findUnique({
      where: {
        internal_id: parseInt(list_id),
      },
    });

    if (!list)
      return res
        .status(400)
        .json({ success: false, message: 'List Not Found' });

    if (list.user_id !== user.id)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const listItem = await prisma.listItems.upsert({
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

    await prisma.userList.update({
      where: {
        internal_id: parseInt(list_id),
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({ success: true, message: listItem });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
