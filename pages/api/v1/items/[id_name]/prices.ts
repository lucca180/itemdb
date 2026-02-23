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
  const includeUnconfirmed = req.query.includeUnconfirmed === 'true';
  const id = Number(id_name);

  const name = isNaN(id) ? id_name : undefined;

  const prices = await getItemPrices({ iid: id, name, includeUnconfirmed, limit: -1 });

  res.json(prices);
}

type ItemPricesArgs = {
  iid?: number | undefined;
  name?: string;
  includeUnconfirmed?: boolean;
  limit?: number;
};
export const getItemPrices = async (args: ItemPricesArgs) => {
  const { iid, includeUnconfirmed, limit = 100 } = args;

  const pricesRaw = await prisma.itemPrices.findMany({
    where: {
      item_iid: !isNaN(iid ?? NaN) ? iid : undefined,
      manual_check: includeUnconfirmed ? undefined : null,
    },
    orderBy: { addedAt: 'desc' },
    take: limit > 0 ? limit : undefined,
  });

  const prices: PriceData[] = pricesRaw.map((p) => {
    return {
      price_id: p.internal_id,
      value: p.price.toNumber(),
      addedAt: p.addedAt.toJSON(),
      inflated: !!p.noInflation_id,
      context: p.priceContext,
      isLatest: !!p.isLatest,
      isUnconfirmed: p.manual_check !== null,
    };
  });

  return prices;
};
