import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@utils/prisma';
import { FeedbackParsed, TradeData } from '@types';
import { CheckAuth } from '@utils/googleCloud';
import { Feedbacks } from '@prisma/generated/client';
import { processTags } from '@pages/api/v1/items/[id_name]/index';
import { processTradePrice } from '@pages/api/v1/trades';
import {
  FeedbackDecision,
  getFeedbackDecision,
  isNewFeedbackAccount,
} from '@utils/feedback/voteRules';

// also used for xp rewards/penalties and the admin vote weight (FEEDBACK_VOTE_TARGET * 2)
export const FEEDBACK_VOTE_TARGET = 7;
export const MAX_VOTE_MULTIPLIER = 3;
export const AUTO_PRICE_UID = 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const feedback_id = req.body.feedback_id as string;
  const action = req.body.action as string;

  if (!feedback_id || !action) return res.status(400).json({ error: 'Missing required fields' });
  if (action !== 'upvote' && action !== 'downvote')
    return res.status(400).json({ error: 'Invalid action' });

  const { user } = await CheckAuth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (user.banned) return res.status(403).send('Forbidden');

  const user_id = user.id;
  const isAdmin = user.role === 'ADMIN';
  const isNewAccount = isNewFeedbackAccount(user);
  let voteMultiplier = isAdmin
    ? FEEDBACK_VOTE_TARGET * 2
    : isNewAccount
      ? 1
      : getVoteMultiplier(user.xp);

  try {
    const feedbackRaw = await prisma.feedbacks.findUnique({
      where: {
        feedback_id: parseInt(feedback_id),
      },
      include: {
        vote: {
          where: { user_id: user_id },
          select: { vote_id: true },
          take: 1,
        },
        user: { select: { role: true } },
      },
    });

    if (!feedbackRaw) return res.status(404).json({ error: 'Feedback not found' });

    // new accounts can only help with auto priced feedbacks
    if (isNewAccount && feedbackRaw.user_id !== AUTO_PRICE_UID)
      return res.status(403).json({ error: 'Account too new' });

    if (feedbackRaw.vote.length)
      return res.status(409).json({ error: 'You have already voted on this feedback' });

    if (feedbackRaw.user_id === user_id && !isAdmin)
      return res.status(403).json({ error: 'You cannot vote on your own feedback' });

    let votesIncrementDecrement;

    if (action === 'upvote')
      votesIncrementDecrement = {
        increment: 1 * voteMultiplier,
      };
    else if (action === 'downvote') {
      voteMultiplier =
        isAdmin || isNewAccount
          ? voteMultiplier
          : Math.min(voteMultiplier * 2, MAX_VOTE_MULTIPLIER);

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

    const [feedbacks] = await prisma.$transaction([feedback, vote]);

    if (!feedbacks.processed) {
      const allVotes = await prisma.feedbackVotes.findMany({
        where: { feedback_id: feedbacks.feedback_id },
        select: { user_id: true, approve: true, user: { select: { role: true } } },
      });

      const decision = getFeedbackDecision({
        score: feedbacks.votes,
        submitterId: feedbacks.user_id,
        submitterIsAdmin: feedbackRaw.user?.role === 'ADMIN',
        votes: allVotes.map((v) => ({
          user_id: v.user_id,
          approve: v.approve,
          isAdmin: v.user?.role === 'ADMIN',
        })),
      });

      if (decision) await commitChanges(feedbacks, decision, req);
    }

    res.json({ success: true });
  } catch (e: any) {
    // concurrent double vote hits FeedbackVotes @@unique([feedback_id, user_id])
    if (e?.code === 'P2002')
      return res.status(409).json({ error: 'You have already voted on this feedback' });

    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }
}

// ------- COMMIT CHANGES -------- //

// so, race conditions could make this exec twice, but it's not a big deal (i guess)
const commitChanges = async (
  feedback: Feedbacks,
  decision: NonNullable<FeedbackDecision>,
  req?: NextApiRequest
) => {
  // Feedback Rejected
  if (decision === 'reject') {
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

    const userCreator = prisma.user.update({
      where: {
        id: feedback.user_id ?? '-1',
      },
      data: {
        xp: {
          decrement: FEEDBACK_VOTE_TARGET * 10, // -70
        },
      },
    });

    // same hit as the submitter - upvoting everything must not pay off
    const approveVotes = prisma.user.updateMany({
      where: {
        votes: {
          some: {
            feedback_id: feedback.feedback_id,
            approve: true,
          },
        },
      },
      data: {
        xp: {
          decrement: FEEDBACK_VOTE_TARGET * 10, // -70
        },
      },
    });

    const reproveVotes = prisma.user.updateMany({
      where: {
        votes: {
          some: {
            feedback_id: feedback.feedback_id,
            approve: false,
          },
        },
      },
      data: {
        xp: {
          increment: 15,
        },
      },
    });

    await Promise.all([userCreator, approveVotes, reproveVotes]);

    return;
  }

  // Feedback Approved
  if (decision === 'approve') {
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

    const userCreator = prisma.user.update({
      where: {
        id: feedback.user_id ?? '-1',
      },
      data: {
        xp: {
          increment: FEEDBACK_VOTE_TARGET,
        },
      },
    });

    const approveVotes = prisma.user.updateMany({
      where: {
        votes: {
          some: {
            feedback_id: feedback.feedback_id,
            approve: true,
          },
        },
      },
      data: {
        xp: {
          increment: 2,
        },
      },
    });

    const reproveVotes = prisma.user.updateMany({
      where: {
        votes: {
          some: {
            feedback_id: feedback.feedback_id,
            approve: false,
          },
        },
      },
      data: {
        xp: {
          decrement: FEEDBACK_VOTE_TARGET,
        },
      },
    });

    await Promise.all([userCreator, approveVotes, reproveVotes]);
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

  await prisma.tradeItems.updateMany({
    where: {
      trade_id: trade.trade_id,
    },
    data: {
      price: null,
    },
  });

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
