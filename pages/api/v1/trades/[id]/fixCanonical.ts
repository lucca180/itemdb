import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/prisma';
import { applyCanonicalTrade } from './canonical';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const allCanonTrades = await prisma.trades.findMany({
    where: {
      isCanonical: true,
    },
    select: {
      trade_id: true,
      wishlist: true,
    },
  });

  for (const trade of allCanonTrades) {
    try {
      console.log(`Applying canonical trade ${trade.trade_id}, wishlist: ${trade.wishlist}`);
      const x = await applyCanonicalTrade(trade.trade_id.toString());
      console.log(`updated ${x} trades`);
    } catch (e) {
      console.error(`Error applying canonical trade ${trade.trade_id}: ${e}`);
    }
  }
}
