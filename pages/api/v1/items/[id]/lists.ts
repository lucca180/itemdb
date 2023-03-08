import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id = req.query.id as string;

  const onlyOfficial = req.query.official === 'true';

  const listsRaw = await getItemLists(id, onlyOfficial);

  res.json(listsRaw);
}

export const getItemLists = async (id: string | number, onlyOfficial: boolean) => {
  const listsRaw = await prisma.userList.findMany({
    where: {
      official: onlyOfficial || undefined,
      visibility: onlyOfficial ? undefined : 'public',
      purpose: {
        not: onlyOfficial ? undefined : 'none',
      },
      items: {
        some: {
          item_iid: Number(id),
        },
      },
    },
    include: {
      items: true,
    },
  });

  return listsRaw;
};
