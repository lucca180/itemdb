import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { FeedbackParsed, TradeData } from '../../../types';
import { CheckAuth } from '../../../utils/googleCloud';
import { Feedbacks } from '@prisma/client';
import { processTags } from '../v1/items/[id_name]/index';
import { processTradePrice } from '../v1/trades';

export const FEEDBACK_VOTE_TARGET = 7;
export const MAX_VOTE_MULTIPLIER = 3;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const feedback_id = req.body.feedback_id as string;
  const action = req.body.action as string;

  if (!feedback_id || !action) return res.status(400).json({ error: 'Missing required fields' });

  let user_id;

  let voteMultiplier = 1;

  try {
    const { user } = await CheckAuth(req);
    if (!user) throw new Error('User not found');
    if (user.banned) return res.status(403);
    user_id = user.id;
    const isAdmin = user.role === 'ADMIN';

    if (isAdmin) voteMultiplier = FEEDBACK_VOTE_TARGET * 2;
    else voteMultiplier = getVoteMultiplier(user.xp);

    const feedbackRaw = await prisma.feedbacks.findUniqueOrThrow({
      where: {
        feedback_id: parseInt(feedback_id),
        vote: {
          none: {
            user_id: user_id,
          },
        },
      },
    });

    if (feedbackRaw.user_id === user_id && !isAdmin)
      return res.status(403).json({ error: 'You cannot vote on your own feedback' });

    let votesIncrementDecrement;

    if (action === 'upvote')
      votesIncrementDecrement = {
        increment: 1 * voteMultiplier,
      };
    else if (action === 'downvote') {
      voteMultiplier = isAdmin ? voteMultiplier : Math.min(voteMultiplier * 2, MAX_VOTE_MULTIPLIER);

      votesIncrementDecrement = {
        decrement: 1 * voteMultiplier,
      };
    }
    const feedback = prisma.feedbacks.update({
      where: {
        feedback_id: parseInt(feedback_id),
      },
      data: {
        votes: votesIncrementDecrement,
      },
    });

    const vote = prisma.feedbackVotes.create({
      data: {
        feedback_id: parseInt(feedback_id),
        user_id: user_id,
        approve: action === 'upvote',
        voteWeight: voteMultiplier,
      },
    });

    const votingUser = prisma.user.update({
      where: {
        id: user_id,
      },
      data: {
        xp: {
          increment: FEEDBACK_VOTE_TARGET,
        },
      },
    });

    const [feedbacks] = await prisma.$transaction([feedback, vote, votingUser]);

    if (
      !feedbacks.processed &&
      (feedbacks.votes >= FEEDBACK_VOTE_TARGET || feedbacks.votes <= -FEEDBACK_VOTE_TARGET)
    ) {
      await commitChanges(feedbacks, req);
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }
}

// ------- COMMIT CHANGES -------- //

// so, race conditions could make this exec twice, but it's not a big deal (i guess)
const commitChanges = async (feedback: Feedbacks, req?: NextApiRequest) => {
  if (feedback.votes <= -FEEDBACK_VOTE_TARGET) {
    // ------- Handlers -------- //

    if (feedback.type === 'tradePrice') await commitTradePrice(feedback, false, req);

    if (feedback.type === 'itemChange') await commitItemChange(feedback, false);

    // ------- End Handlers -------- //

    await prisma.feedbacks.update({
      where: {
        feedback_id: feedback.feedback_id,
      },
      data: {
        processed: true,
        approved: false,
        processedAt: new Date(),
      },
    });

    if (feedback.user_id)
      await prisma.user.update({
        where: {
          id: feedback.user_id,
        },
        data: {
          xp: {
            decrement: feedback.votes * 7,
          },
        },
      });

    return;
  }

  if (feedback.votes >= FEEDBACK_VOTE_TARGET) {
    // ------- Handlers -------- //

    if (feedback.type === 'tradePrice') await commitTradePrice(feedback, true, req);

    if (feedback.type === 'itemChange') await commitItemChange(feedback, true);

    // ------- End Handlers -------- //

    await prisma.feedbacks.update({
      where: {
        feedback_id: feedback.feedback_id,
      },
      data: {
        processed: true,
        approved: true,
        processedAt: new Date(),
      },
    });

    if (feedback.user_id)
      await prisma.user.update({
        where: {
          id: feedback.user_id,
        },
        data: {
          xp: {
            increment: FEEDBACK_VOTE_TARGET * 3,
          },
        },
      });
  }
};

const commitTradePrice = async (feedback: Feedbacks, approved: boolean, req?: NextApiRequest) => {
  if (feedback.type !== 'tradePrice') return;

  const json = feedback.json as string;
  const parsed = JSON.parse(json) as FeedbackParsed;
  const trade = parsed.content.trade as TradeData;

  if (approved) return processTradePrice(trade, req);

  if (parsed.auto_ref) {
    await prisma.trades.update({
      where: {
        trade_id: parsed.auto_ref,
      },
      data: {
        auto_ignore_pricing: true,
      },
    });
  }

  return prisma.trades.update({
    where: {
      trade_id: trade.trade_id,
    },
    data: {
      processed: false,
      priced: false,
    },
  });
};

const commitItemChange = async (feedback: Feedbacks, approved: boolean) => {
  if (feedback.type !== 'itemChange' || !feedback.subject_id) return;

  const json = feedback.json as string;
  const parsed = JSON.parse(json) as FeedbackParsed;
  const itemTags = parsed.content.itemTags as string[];
  const itemNotes = parsed.content.itemNotes as string | undefined;

  if (approved) {
    processTags(itemTags, [], feedback.subject_id);

    await prisma.items.update({
      where: {
        internal_id: feedback.subject_id,
      },
      data: {
        comment: itemNotes ?? undefined,
      },
    });
  }
};

export const getVoteMultiplier = (userXP: number) => {
  return Math.max(1, Math.min(Math.floor(userXP / 2000), MAX_VOTE_MULTIPLIER));
};
