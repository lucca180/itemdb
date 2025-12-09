import { Prisma } from '@prisma/generated/client';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { CheckAuth } from '../../../../utils/googleCloud';
import { User } from '../../../../types';
import { subDays } from 'date-fns';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse<any>) {
  let user: User | null = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  const itemProcess = prisma.itemProcess.count({
    where: {
      processed: false,
      manual_check: null,
    },
  });

  const itemsMissingInfo = prisma.items.count({
    where: {
      OR: [
        { item_id: null },
        { category: null },
        { rarity: null },
        { est_val: null },
        { weight: null },
      ],
      canonical_id: null,
    },
  });

  const itemsTotal = prisma.items.count();
  const DATE_LIMIT = subDays(new Date(), 30);

  const tradeQueueRaw = prisma.$queryRaw<{ count: number }[]>(
    Prisma.sql`
    SELECT COUNT(DISTINCT hash) as "count" FROM trades t where processed = 0 and EXISTS (
      SELECT 1 
      FROM trades t2
      LEFT JOIN tradeitems ti ON t2.trade_id = ti.trade_id
      LEFT JOIN items i ON i.internal_id = ti.item_iid
      LEFT JOIN itemprices p ON p.item_iid = i.internal_id AND p.isLatest = 1 AND p.addedAt > t.addedAt
      WHERE t.trade_id = t2.trade_id and t.addedAt >= ${DATE_LIMIT}
      AND p.price IS NULL
      )`
  );

  const feedbackVoting = prisma.feedbacks.count({
    where: {
      type: 'tradePrice',
      processed: false,
      user_id: {
        not: user?.id,
      },
      vote: {
        none: {
          user_id: user?.id,
        },
      },
    },
  });

  const [
    itemToProcessCount,
    itemsMissingInfoCount,
    itemsTotalCount,
    tradeQueueCount,
    feedbackVotingCount,
  ] = await Promise.all([
    itemProcess.catch(() => 0),
    itemsMissingInfo.catch(() => 0),
    itemsTotal.catch(() => 0),
    tradeQueueRaw.catch(() => [{ count: 0 }]),
    feedbackVoting.catch(() => 0),
  ]);

  return res.status(200).json({
    itemToProcess: itemToProcessCount,
    itemsMissingInfo: itemsMissingInfoCount,
    itemsTotal: itemsTotalCount,
    tradeQueue: Number(tradeQueueCount[0].count.toString()),
    feedbackVoting: feedbackVotingCount,
  });
}
