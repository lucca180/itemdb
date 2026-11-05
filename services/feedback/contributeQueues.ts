import { Prisma } from '@prisma/generated/client';
import prisma from '@utils/prisma';
import { subDays } from 'date-fns';

/** Open trade lots from the last 30 days with an item still lacking a newer price. */
export async function countTradeQueue(): Promise<number> {
  const dateLimit = subDays(new Date(), 30);

  const result = await prisma.$queryRaw<{ count: number }[]>(
    Prisma.sql`
    SELECT COUNT(DISTINCT hash) as "count" FROM trades t where processed = 0 and EXISTS (
      SELECT 1
      FROM trades t2
      LEFT JOIN tradeitems ti ON t2.trade_id = ti.trade_id
      LEFT JOIN items i ON i.internal_id = ti.item_iid
      LEFT JOIN itemprices p ON p.item_iid = i.internal_id AND p.isLatest = 1 AND p.addedAt > t.addedAt
      WHERE t.trade_id = t2.trade_id and t.addedAt >= ${dateLimit}
      AND p.price IS NULL
      )`
  );

  return Number(result[0].count.toString());
}
