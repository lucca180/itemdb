/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getManyItems } from '../items/many';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse<any>) {
  let { limit } = req.query;
  if (!limit) limit = '16';

  const items = await getHotestRestock(Number(limit));

  return res.status(200).json(items);
}

export const getHotestRestock = async (limit: number, days = 7) => {
  const lastDays = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const lastDaysFormated = lastDays.toISOString().split('T')[0];

  const hotestRestockRes = (await prisma.$queryRaw(Prisma.sql`
    select a.internal_id, c.addedAt, b.price from items as a
    LEFT JOIN (
          SELECT *
          FROM ItemPrices
          WHERE (item_iid, addedAt) IN (
              SELECT item_iid, MAX(addedAt)
              FROM ItemPrices
              GROUP BY item_iid
          ) AND manual_check IS null
        ) as b on b.item_iid = a.internal_id
    left join priceprocess as c on c.item_id = a.item_id
    where c.type = 'restock' and c.addedAt >= ${lastDaysFormated}
    and b.price is not null
    order by b.price desc
    limit 100
    `)) as any[];

  const uniqueSet = new Set(hotestRestockRes.map((x) => x.internal_id.toString()));
  const uniqueIds = [...uniqueSet.values()] as string[];

  const items = Object.values(await getManyItems({ id: uniqueIds }))
    .sort((a, b) => (b.price.value ?? 0) - (a.price.value ?? 0))
    .splice(0, Number(limit));

  return items;
};
