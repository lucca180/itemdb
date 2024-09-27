import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import { Prisma } from '@prisma/client';
import { getUserById } from '../../auth/login';

const TRADE_GOAL = 10;
const VOTE_GOAL = 20;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  let user;
  try {
    user = (await CheckAuth(req)).user;
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { success, needTrades, needVotes } = await contributeCheck(user.id, 1);

  return res.status(200).json({ canWrapped: success, needTrades, needVotes });
}

export const contributeCheck = async (uid?: string, goalMulplier = 1) => {
  const tradeGoal = TRADE_GOAL * goalMulplier;
  const voteGoal = VOTE_GOAL * goalMulplier;

  if (!uid) {
    return { success: false, needTrades: tradeGoal, needVotes: voteGoal };
  }

  const user = await getUserById(uid);

  if (!user) {
    return { success: false, needTrades: tradeGoal, needVotes: voteGoal };
  }

  if (user.banned) {
    return { success: false, needTrades: 0, needVotes: 0 };
  }

  // check if user precified TRADE_GOAL prices in the last 24hrs
  const prices = await prisma.feedbacks.count({
    where: {
      user_id: uid,
      type: 'tradePrice',
      addedAt: {
        gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (prices >= tradeGoal) {
    return { success: true, needTrades: 0, needVotes: 0 };
  }

  // check if user voted VOTE_GOAL times in the last 24 hrs
  const votes = await prisma.feedbackVotes.count({
    where: {
      user_id: uid,
      addedAt: {
        gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (votes >= voteGoal) {
    return { success: true, needTrades: 0, needVotes: 0 };
  }

  // check if there is trades or feedbacks to vote
  const tradeQueueRaw = prisma.$queryRaw<{ count: number }[]>(
    Prisma.sql`SELECT COUNT(DISTINCT hash) as "count" FROM trades where processed = 0`,
  );

  const feedbackVoting = prisma.feedbacks.count({
    where: {
      type: 'tradePrice',
      processed: false,
      user_id: {
        not: uid,
      },
      vote: {
        none: {
          user_id: uid,
        },
      },
    },
  });

  const [tradeQueueRes, feedbacks] = await Promise.all([tradeQueueRaw, feedbackVoting]);
  const tradeQueue = Number(tradeQueueRes[0].count.toString());

  let needTrades = Math.max(0, tradeGoal - prices);
  let needVotes = Math.max(0, voteGoal - votes);

  if (tradeQueue < 50) needTrades = 0;
  if (feedbacks < 50) needVotes = 0;

  if (!needTrades && !needVotes) return { success: true, needTrades: 0, needVotes: 0 };

  return { success: false, needTrades, needVotes };
};
