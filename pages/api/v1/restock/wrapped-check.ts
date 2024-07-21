import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import { Prisma } from '@prisma/client';

const TRADE_GOAL = 15;
const VOTE_GOAL = 30;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  let user;
  try {
    user = (await CheckAuth(req)).user;
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (user.isAdmin) return res.status(200).json({ canWrapped: true, needTrades: 0, needVotes: 0 });

  // check if user precified TRADE_GOAL prices in the last 24hrs
  const prices = await prisma.feedbacks.count({
    where: {
      user_id: user.id,
      type: 'tradePrice',
      addedAt: {
        gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (prices >= TRADE_GOAL) {
    return res.status(200).json({ canWrapped: true, needTrades: 0, needVotes: 0 });
  }

  // check if user voted VOTE_GOAL times in the last 24 hrs
  const votes = await prisma.feedbackVotes.count({
    where: {
      user_id: user.id,
      addedAt: {
        gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (votes >= VOTE_GOAL) {
    return res.status(200).json({ canWrapped: true, needTrades: 0, needVotes: 0 });
  }

  // check if there is trades or feedbacks to vote
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

  const [tradeQueueRes, feedbacks] = await Promise.all([tradeQueueRaw, feedbackVoting]);
  const tradeQueue = Number(tradeQueueRes[0].count.toString());

  let needTrades = Math.max(0, TRADE_GOAL - prices);
  let needVotes = Math.max(0, VOTE_GOAL - votes);

  if (needTrades > tradeQueue) {
    needTrades = tradeQueue;
  }

  if (needVotes > feedbacks) {
    needVotes = feedbacks;
  }

  return res.status(200).json({ canWrapped: false, needTrades, needVotes });
}
