import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/prisma';
import { applyCanonicalTrade } from './canonical';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  let i = 0;
  const take = 100;

  while (true) {
    const allCanonTrades = await prisma.trades.findMany({
      where: {
        isCanonical: true,
      },
      select: {
        trade_id: true,
        wishlist: true,
      },
      skip: 332 + i * take,
      take: take,
    });

    console.log(`${332 + i * take} - Fetched ${allCanonTrades.length} trades`);

    if (allCanonTrades.length === 0) break;

    for (const trade of allCanonTrades) {
      try {
        console.log(`Applying canonical trade ${trade.trade_id}, wishlist: ${trade.wishlist}`);
        const x = await applyCanonicalTrade(trade.trade_id.toString());
        console.log(`updated ${x} trades`);
      } catch (e) {
        console.error(`Error applying canonical trade ${trade.trade_id}: ${e}`);
      }
    }

    i++;
  }

  console.log('finished');
}
