import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name;
  const id = Number(id_name);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid Request' });

  const onlyOfficial = req.query.official === 'true';
  const listsRaw = await getItemLists(id, onlyOfficial);

  res.json(listsRaw);
}

export const getItemLists = async (id: number, onlyOfficial: boolean) => {
  const listsRaw = await prisma.userList.findMany({
    where: {
      official: onlyOfficial || undefined,
      visibility: onlyOfficial ? undefined : 'public',
      purpose: {
        not: onlyOfficial ? undefined : 'none',
      },
      items: {
        some: {
          item_iid: id,
        },
      },
    },
    include: {
      items: true,
    },
  });

  return listsRaw;
};
