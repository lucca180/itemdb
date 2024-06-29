import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ItemPriceData } from '../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { item_iids } = req.body as { item_iids: number[] };

  if (!item_iids || !Array.isArray(item_iids)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const pricesRaw = await prisma.itemPrices.findMany({
    where: {
      item_iid: {
        in: item_iids,
      },
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  const pricesByIid: { [iid: number]: (ItemPriceData & { item_iid: number; price_id: number })[] } =
    {};

  pricesRaw.map((price) => {
    if (!price.item_iid) return;
    if (!pricesByIid[price.item_iid]) pricesByIid[price.item_iid] = [];

    pricesByIid[price.item_iid].push({
      price_id: price.internal_id,
      value: price.price.toNumber(),
      item_iid: price.item_iid,
      addedAt: price.addedAt.toJSON(),
      inflated: !!price.noInflation_id,
    });
  });

  return res.status(200).json(pricesByIid);
};
