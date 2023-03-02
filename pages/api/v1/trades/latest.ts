import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { TradeData } from '../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const limit = (req.query.limit as string) ?? '15';
  const includeProcessed = req.query.includeProcessed === 'true';

  const tradeRaw = await prisma.trades.findMany({
    where: {
      processed: includeProcessed,
    },
    include: { items: true },
    orderBy: { addedAt: 'asc' },
    take: parseInt(limit),
  });

  const trades: TradeData[] = tradeRaw.map((t) => {
    return {
      trade_id: t.trade_id,
      owner: t.owner,
      wishlist: t.wishlist,
      addedAt: t.addedAt.toJSON(),
      processed: t.processed,
      priced: t.priced,
      items: t.items.map((i) => {
        return {
          internal_id: i.internal_id,
          trade_id: i.trade_id,
          name: i.name,
          image: i.image,
          image_id: i.image_id,
          order: i.order,
          price: i.price,
          addedAt: i.addedAt.toJSON(),
        };
      }),
    };
  });

  res.json(trades);
}
