import { NextApiRequest, NextApiResponse } from 'next';
import { processTradePrice } from '.';
import { FeedbackParsed, TradeData } from '../../../../types';
import prisma from '../../../../utils/prisma';

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

  const tradeFeedback = await prisma.feedbacks.findMany({
    where: {
      processed: false,
      type: 'tradePrice',
      // user_id: 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1',
    },
    take: take,
    skip: skip,
  });

  const ids: number[] = [];
  for (let i = 0; i < tradeFeedback.length; i += 5) {
    const promises = [];
    const feedbacks = tradeFeedback.slice(i, i + 5);
    for (const feedback of feedbacks) {
      const json = feedback.json as string;
      const parsed = JSON.parse(json) as FeedbackParsed;
      const trade = parsed.content.trade as TradeData;

      const isAllItemsSame = trade.items.every(
        (item) => item.name === trade.items[0].name && item.image_id === trade.items[0].image_id
      );
      const isAllEmpty = trade.items.every((item) => !item.price);

      if (
        (isAllEmpty &&
          (trade.wishlist.includes('+') ||
            trade.wishlist.toLowerCase().includes('pb') ||
            trade.wishlist.toLowerCase().includes('baby'))) ||
        (!isAllItemsSame && isAllEmpty) ||
        (isAllEmpty && trade.items.length > 1 && !isNaN(Number(trade.wishlist.trim())))
      ) {
        const x = processTradePrice(trade);

        promises.push(x);
        ids.push(feedback.feedback_id);
      }
    }
    await Promise.all(promises);
  }

  await prisma.feedbacks.updateMany({
    where: {
      feedback_id: {
        in: ids,
      },
    },
    data: {
      processed: true,
      approved: true,
      processedAt: new Date(),
    },
  });

  return res.json(ids);
};
