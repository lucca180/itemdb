import type { NextApiRequest, NextApiResponse } from 'next';
import { PriceData } from '../../../../../types';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);

  const name = isNaN(id) ? id_name : undefined;

  const prices = await getItemPrices({ iid: id, name });

  res.json(prices);
}

type ItemPricesArgs = {
  iid?: number | undefined;
  name?: string;
};
export const getItemPrices = async (args: ItemPricesArgs) => {
  const { iid, name } = args;
  const pricesRaw = await prisma.itemPrices.findMany({
    where: {
      item_iid: iid,
      name: name,
      manual_check: null,
    },
    orderBy: { addedAt: 'desc' },
    take: 100,
  });

  const prices: PriceData[] = pricesRaw.map((p) => {
    return {
      price_id: p.internal_id,
      value: p.price.toNumber(),
      addedAt: p.addedAt.toJSON(),
      inflated: !!p.noInflation_id,
    };
  });

  return prices;
};
