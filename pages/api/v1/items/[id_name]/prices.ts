import type { NextApiRequest, NextApiResponse } from 'next';
import { PriceData } from '../../../../../types';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);

  const name = isNaN(id) ? id_name : undefined;

  const pricesRaw = await prisma.itemPrices.findMany({
    where: {
      item_iid: !isNaN(id) ? id : undefined,
      name: name,
    },
    orderBy: { addedAt: 'desc' },
  });

  const prices: PriceData[] = pricesRaw.map((p) => {
    return {
      value: p.price,
      addedAt: p.addedAt.toJSON(),
      inflated: !!p.noInflation_id,
    };
  });

  res.json(prices);
}
