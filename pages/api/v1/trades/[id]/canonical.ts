import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';
import { processTradePrice } from '..';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') return POST(req, res);

    if (req.method == 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST');
      return res.status(200).json({});
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const canonicalTrade = await prisma.trades.findUnique({
    where: { trade_id: Number(id) },
    include: { items: true },
  });

  if (!canonicalTrade) return res.status(404).json({ error: 'Trade not found' });

  if (canonicalTrade.isAllItemsEqual === null || !canonicalTrade.itemsCount)
    return res.status(400).json({ error: 'Canonical Trade Missing Data' });

  try {
    await prisma.trades.update({
      where: { trade_id: Number(id) },
      data: {
        isCanonical: true,
      },
    });
  } catch (e: any) {
    await prisma.trades.updateMany({
      where: {
        wishlist: canonicalTrade.wishlist,
        isCanonical: true,
        isAllItemsEqual: canonicalTrade.isAllItemsEqual,
        itemsCount: canonicalTrade.itemsCount,
      },
      data: {
        isCanonical: false,
      },
    });

    await prisma.trades.update({
      where: { trade_id: Number(id) },
      data: {
        isCanonical: true,
      },
    });
  }

  const trades = await prisma.trades.findMany({
    where: {
      priced: false,
      isAllItemsEqual: canonicalTrade.isAllItemsEqual,
      isCanonical: null,
      itemsCount: canonicalTrade.itemsCount,
      wishlist: canonicalTrade.wishlist,
    },
    include: { items: true },
  });

  for (const trade of [...trades, canonicalTrade]) {
    const updatedItems: any[] = [...trade.items];

    for (const canonicalItem of canonicalTrade.items) {
      updatedItems[canonicalItem.order].price = canonicalItem.price;
      updatedItems[canonicalItem.order].addedAt =
        updatedItems[canonicalItem.order].addedAt.toJSON();
    }

    await processTradePrice({
      ...trade,
      items: updatedItems,
    } as any);
  }

  // delete feedbacks for similar trades

  const allIds = trades.map((t) => t.trade_id);
  allIds.push(Number(id));
  await prisma.feedbacks.updateMany({
    where: {
      type: 'tradePrice',
      subject_id: {
        in: allIds,
      },
      processed: false,
    },
    data: {
      processed: true,
      approved: false,
    },
  });

  return res.status(200).json({ success: true, updated: allIds.length });
}
