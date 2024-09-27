import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import prisma from '../../../../../utils/prisma';
import { getManyItems } from '../many';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id_name } = req.query;
  if (!id_name) return res.status(400).json({ error: 'Invalid Request' });

  const similarItems = await getSimilarItems(id_name as string);
  return res.json(similarItems);
}

export const getSimilarItems = async (id_name: string) => {
  const internal_id = Number(id_name);
  const name = isNaN(internal_id) ? (id_name as string) : undefined;

  const item = await getItem(name ?? internal_id);

  if (!item) return [];

  const match = Prisma.sql`MATCH(name) AGAINST(${`${item.name}`} IN NATURAL LANGUAGE MODE)`;

  const rawTreco = (await prisma.$queryRaw`
    SELECT internal_id FROM Items where ${match} and internal_id != ${item.internal_id}
    and canonical_id is null
    order by ${match} desc limit 4
  `) as any;

  const ids = rawTreco.map((item: any) => item.internal_id);

  const items = await getManyItems({
    id: ids,
  });

  const sortedItems = Object.values(items).sort(
    (a, b) => ids.indexOf(a.internal_id) - ids.indexOf(b.internal_id),
  );

  return sortedItems;
};
