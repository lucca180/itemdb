import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';
import { processTradePrice } from '..';
import { FeedbackParsed, TradeData } from '../../../../../types';

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

  try {
    const updated = await applyCanonicalTrade(id);
    return res.status(200).json({ success: true, updated: updated });
  } catch (e: any) {
    console.error(e);
    return res.status(400).json({ error: e.error });
  }
}

export const applyCanonicalTrade = async (id: string) => {
  const feedback = await prisma.feedbacks.findFirst({
    where: {
      subject_id: Number(id),
      type: 'tradePrice',
      processed: false,
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  if (!feedback) throw { error: 'Feedback not found' };

  const json = feedback.json as string;
  const parsed = JSON.parse(json) as FeedbackParsed;
  const canonicalTrade = parsed.content.trade as TradeData;

  const canonTrade = await prisma.trades.findUnique({
    where: {
      trade_id: Number(id),
    },
  });

  if (!canonicalTrade || !canonTrade) throw { error: 'Trade not found' };

  if (canonTrade.isAllItemsEqual === null || !canonTrade.itemsCount)
    throw { error: 'Canonical Trade Missing Data' };

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
        isAllItemsEqual: canonTrade.isAllItemsEqual,
        itemsCount: canonTrade.itemsCount,
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
      isAllItemsEqual: canonTrade.isAllItemsEqual,
      isCanonical: null,
      itemsCount: canonTrade.itemsCount,
      wishlist: canonicalTrade.wishlist,
      items: {
        none: {
          price: {
            not: null,
          },
        },
      },
    },
    include: { items: true },
  });

  const allTrades = [canonicalTrade, ...trades];

  let i = 0;
  for (const trade of allTrades) {
    i++;
    const updatedItems = [...trade.items];
    let skip = false;

    for (const canonicalItem of canonicalTrade.items) {
      if (updatedItems[canonicalItem.order].price && trade.trade_id !== canonicalTrade.trade_id) {
        skip = true;
        break;
      }

      updatedItems[canonicalItem.order].price = canonicalItem.price;
    }

    if (i % 10 === 0) console.log(`Processed ${i} of ${allTrades.length} trades`);
    if (skip) continue;

    await processTradePrice({
      ...trade,
      items: updatedItems,
    } as TradeData);
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

  return allIds.length;
};
