import { Prisma, TradeItems, Trades } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { processTradePrice } from '.';

const TARNUM_KEY = process.env.TARNUM_KEY;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
      return res.status(401).json({ error: 'Unauthorized' });

    // if (req.method === 'GET') return GET(req, res);
    if (req.method === 'POST') return POST(req, res);
    // if (req.method === 'PATCH') return PATCH(req, res);

    if (req.method == 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH');
      return res.status(200).json({});
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const take = req.body.take as number | undefined;
  const skip = req.body.skip as number | undefined;

  const tradeRaw = await prisma.trades.findMany({
    where: {
      processed: false,
    },
    distinct: ['hash'],
    include: { items: true },
    orderBy: { addedAt: 'asc' },
    take: take || 100,
    skip: skip || 0,
  });

  const result = await autoPriceTrades2(tradeRaw);

  return res.status(200).json(result);
};

export const autoPriceTrades2 = async (tradeRaw: (Trades & { items: TradeItems[] })[]) => {
  const promises = [];

  for (const trade of tradeRaw) {
    promises.push(findSimilar(trade));
  }

  const trades = await Promise.all(promises);
  const filteredTrades = trades.filter((t) => t !== null) as Trades[];

  const feedbackArray: Prisma.FeedbacksCreateInput[] = filteredTrades.map((t) => ({
    type: 'tradePrice',
    subject_id: t.trade_id,
    user_id: 'ZiF0QYgueGgQhFwroQv4cjMXJ0C3',
    json: JSON.stringify({
      ip: 'auto',
      pageRef: 'auto',
      content: { trade: t },
    }),
  }));

  const feedbacks = prisma.feedbacks.createMany({
    data: feedbackArray,
  });

  const updateTrades = prisma.trades.updateMany({
    where: {
      trade_id: {
        in: filteredTrades.map((t) => t.trade_id),
      },
    },
    data: {
      processed: true,
    },
  });

  return await prisma.$transaction([feedbacks, updateTrades]);
};

const findSimilar = async (trade: Trades & { items: TradeItems[] }) => {
  const similarList = await prisma.trades.findMany({
    where: {
      priced: true,
      wishlist: trade.wishlist,
    },
    orderBy: { addedAt: 'desc' },
    include: { items: true },
  });

  const isAllItemsTheSame = trade.items.every(
    (t) => t.name === trade.items[0].name && t.image_id === trade.items[0].image_id
  );

  if (similarList.length === 0) return null;

  const similar = similarList.find((t) => {
    const isTheSame = t.items.every(
      (t2) => t2.name === t.items[0].name && t2.image_id === t.items[0].image_id
    );

    return t.items.length === trade.items.length && isTheSame === isAllItemsTheSame;
  });

  if (!similar) return null;

  const updatedItems: any[] = [...trade.items];

  for (const similarItem of similar.items) {
    updatedItems[similarItem.order].price = similarItem.price;
    updatedItems[similarItem.order].addedAt = similarItem.addedAt.toJSON();
  }

  const isAllEmpty = updatedItems.every((item) => !item.price);

  if (
    (isAllEmpty &&
      (trade.wishlist.includes('+') ||
        trade.wishlist.toLowerCase().includes('pb') ||
        trade.wishlist.toLowerCase().includes('baby'))) ||
    (!isAllItemsTheSame && isAllEmpty) ||
    (isAllEmpty && trade.items.length > 1 && !isNaN(Number(trade.wishlist.trim())))
  ) {
    await processTradePrice({
      ...trade,
      items: updatedItems,
    } as any);
    return null;
  }

  return {
    ...trade,
    items: updatedItems,
  };
};
