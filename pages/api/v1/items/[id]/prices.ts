import type { NextApiRequest, NextApiResponse } from 'next';
import { PriceData } from '../../../../../types';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id = req.query.id as string;

  const pricesRaw = await prisma.itemPrices.findMany({
    where: {
      item_iid: parseInt(id),
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
