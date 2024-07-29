import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { CheckAuth } from '../../../../utils/googleCloud';
import { User } from '../../../../types';

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
    },
  });

  const itemsTotal = prisma.items.count();

  const tradeQueueRaw = prisma.$queryRaw<{ count: number }[]>(
    Prisma.sql`SELECT COUNT(DISTINCT hash) as "count" FROM trades where processed = 0`
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
  ] = await Promise.all([itemProcess, itemsMissingInfo, itemsTotal, tradeQueueRaw, feedbackVoting]);

  return res.status(200).json({
    itemToProcess: itemToProcessCount,
    itemsMissingInfo: itemsMissingInfoCount,
    itemsTotal: itemsTotalCount,
    tradeQueue: Number(tradeQueueCount[0].count.toString()),
    feedbackVoting: feedbackVotingCount,
  });
}
