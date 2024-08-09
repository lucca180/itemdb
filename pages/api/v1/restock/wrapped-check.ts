import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';

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

  const { success, needTrades, needVotes } = await contributeCheck(user.id, 1);

  return res.status(200).json({ canWrapped: success, needTrades, needVotes });
}

export const contributeCheck = async (uid?: string, goalMulplier = 1) => {
  const tradeGoal = TRADE_GOAL * goalMulplier;
  const voteGoal = VOTE_GOAL * goalMulplier;

  if (!uid) {
    return { success: false, needTrades: tradeGoal, needVotes: voteGoal };
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

  const needTrades = Math.max(0, tradeGoal - prices);
  const needVotes = Math.max(0, voteGoal - votes);

  return { success: false, needTrades, needVotes };
};
