/**
 * Decides and commits voted feedbacks (approve/reject + side effects + xp).
 *
 * Runs after the vote response is sent (`after()` in the vote route), so it must be safe to run
 * concurrently and to be interrupted:
 * - a feedback is claimed with an atomic lease on `processedAt` (`processed = false` and
 *   `processedAt` set means "being committed"), so only one worker commits it;
 * - if the side effects fail, the lease is released and the next vote retries it;
 * - if the worker dies mid-commit, the lease expires and {@link retryStaleFeedbackCommits}
 *   picks it up.
 */
import 'server-only';

import prisma from '@utils/prisma';
import type { Feedbacks } from '@prisma/generated/client';
import type { FeedbackParsed, TradeData } from '@types';
import { processTags } from '@pages/api/v1/items/[id_name]/index';
import { processTradePrice } from '@pages/api/v1/trades';
import {
  FEEDBACK_VOTE_TARGET,
  FeedbackDecision,
  getFeedbackDecision,
} from '@utils/feedback/voteRules';
import { reportBackgroundError } from '@utils/api/reportBackgroundError';

/** How long a commit lease is held before another worker may take over. */
export const FEEDBACK_COMMIT_LEASE_MS = 5 * 60 * 1000;

const STALE_RETRY_LIMIT = 5;

type VoteRef = { user_id: string | null; approve: boolean };

/**
 * Re-evaluates a feedback's votes and, when a decision is reached, commits it.
 * Returns the committed decision, or null when nothing was committed.
 */
export const commitFeedbackIfDecided = async (
  feedback_id: number,
  ip?: string | null
): Promise<FeedbackDecision> => {
  const feedback = await prisma.feedbacks.findUnique({
    where: { feedback_id },
    include: {
      user: { select: { role: true } },
      vote: { select: { user_id: true, approve: true, user: { select: { role: true } } } },
    },
  });

  if (!feedback || feedback.processed) return null;

  const decision = getFeedbackDecision({
    score: feedback.votes,
    submitterId: feedback.user_id,
    submitterIsAdmin: feedback.user?.role === 'ADMIN',
    votes: feedback.vote.map((v) => ({
      user_id: v.user_id,
      approve: v.approve,
      isAdmin: v.user?.role === 'ADMIN',
    })),
  });

  if (!decision) return null;

  // atomic claim: only one worker gets the lease
  const leaseAt = new Date();
  const claim = await prisma.feedbacks.updateMany({
    where: {
      feedback_id,
      processed: false,
      OR: [
        { processedAt: null },
        { processedAt: { lt: new Date(leaseAt.getTime() - FEEDBACK_COMMIT_LEASE_MS) } },
      ],
    },
    data: { processedAt: leaseAt },
  });

  if (!claim.count) return null;

  const approved = decision === 'approve';
  const xp = approved ? APPROVE_XP : REJECT_XP;
  let votes: VoteRef[] = feedback.vote.map((v) => ({ user_id: v.user_id, approve: v.approve }));
  let step: 'sideEffects' | 'finalize' | 'xp' = 'sideEffects';

  try {
    if (feedback.type === 'tradePrice') await commitTradePrice(feedback, approved, ip);
    if (feedback.type === 'itemChange') await commitItemChange(feedback, approved);

    step = 'finalize';
    await prisma.feedbacks.updateMany({
      where: { feedback_id },
      data: { processed: true, approved, processedAt: new Date() },
    });

    // fresh votes: whoever voted while the side effects ran also gets their xp
    step = 'xp';
    votes = await prisma.feedbackVotes.findMany({
      where: { feedback_id },
      select: { user_id: true, approve: true },
    });

    await Promise.all(
      planVoteXp(feedback, votes, xp).map((u) =>
        prisma.user.updateMany({
          where: { id: { in: u.ids } },
          data: { xp: { increment: u.amount } },
        })
      )
    );
  } catch (e) {
    // nothing was applied yet: release the lease so the next vote retries the commit.
    // After that the feedback is already decided - the xp plan goes to Sentry to fix by hand.
    if (step === 'sideEffects')
      await prisma.feedbacks
        .updateMany({
          where: { feedback_id, processed: false, processedAt: leaseAt },
          data: { processedAt: null },
        })
        .catch(() => {});

    throw new FeedbackCommitError(
      `feedback ${feedback_id} commit failed at ${step}`,
      {
        step,
        decision,
        leaseReleased: step === 'sideEffects',
        feedback: describeFeedback(feedback),
        votes,
        xpPlan: planVoteXp(feedback, votes, xp),
      },
      { cause: e }
    );
  }

  return decision;
};

/** Carries what's needed to redo a failed commit by hand (sent to Sentry as an attachment). */
export class FeedbackCommitError extends Error {
  constructor(
    message: string,
    readonly details: Record<string, unknown>,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = 'FeedbackCommitError';
  }
}

/** Retries commits whose lease expired (worker died or the process restarted mid-commit). */
export const retryStaleFeedbackCommits = async () => {
  const stale = await prisma.feedbacks.findMany({
    where: {
      processed: false,
      processedAt: { lt: new Date(Date.now() - FEEDBACK_COMMIT_LEASE_MS) },
    },
    select: { feedback_id: true },
    take: STALE_RETRY_LIMIT,
  });

  for (const { feedback_id } of stale) {
    try {
      await commitFeedbackIfDecided(feedback_id);
    } catch (e) {
      reportBackgroundError(e, {
        task: 'feedback.retryStaleCommit',
        tags: { feedback_id },
        data: { feedback_id, ...(e instanceof FeedbackCommitError ? e.details : {}) },
      });
    }
  }
};

type XpRule = { creator: number; upvoters: number; downvoters: number };

const APPROVE_XP: XpRule = {
  creator: FEEDBACK_VOTE_TARGET,
  upvoters: 2,
  downvoters: -FEEDBACK_VOTE_TARGET,
};

// upvoters take the same hit as the submitter - upvoting everything must not pay off
const REJECT_XP: XpRule = {
  creator: -FEEDBACK_VOTE_TARGET * 10, // -70
  upvoters: -FEEDBACK_VOTE_TARGET * 10, // -70
  downvoters: 15,
};

// applied by primary key (disjoint rows, safe in parallel): a `votes: { some }` relation filter
// runs UPDATE ... IN (subquery), which locks user rows and took seconds under concurrency
const planVoteXp = (feedback: Feedbacks, votes: VoteRef[], xp: XpRule) => {
  const ids = (approve: boolean) =>
    votes.filter((v) => v.approve === approve && v.user_id).map((v) => v.user_id!);

  return [
    { ids: feedback.user_id ? [feedback.user_id] : [], amount: xp.creator },
    { ids: ids(true), amount: xp.upvoters },
    { ids: ids(false), amount: xp.downvoters },
  ].filter((u) => u.ids.length && u.amount);
};

// feedback snapshot for error reports - without the submitter ip
const describeFeedback = (feedback: Feedbacks) => {
  let parsed: Partial<FeedbackParsed> | string = feedback.json as string;
  try {
    parsed = JSON.parse(feedback.json as string) as Partial<FeedbackParsed>;
    delete parsed.ip;
    const trade = parsed.content?.trade as
      { ip_address?: unknown; ownerHash?: unknown } | undefined;
    if (trade) {
      delete trade.ip_address;
      delete trade.ownerHash;
    }
  } catch {
    // keep the raw string
  }

  return {
    feedback_id: feedback.feedback_id,
    type: feedback.type,
    subject_id: feedback.subject_id,
    submitter: feedback.user_id,
    score: feedback.votes,
    addedAt: feedback.addedAt,
    json: parsed,
  };
};

const commitTradePrice = async (feedback: Feedbacks, approved: boolean, ip?: string | null) => {
  const parsed = JSON.parse(feedback.json as string) as FeedbackParsed;
  const trade = parsed.content.trade as TradeData;

  if (approved) return processTradePrice(trade, ip);

  if (parsed.auto_ref) {
    await prisma.trades.update({
      where: { trade_id: parsed.auto_ref },
      data: { auto_ignore_pricing: true },
    });
  }

  // back to the pricing queue
  await prisma.tradeItems.updateMany({
    where: { trade_id: trade.trade_id },
    data: { price: null },
  });

  return prisma.trades.update({
    where: { trade_id: trade.trade_id },
    data: { processed: false, priced: false },
  });
};

const commitItemChange = async (feedback: Feedbacks, approved: boolean) => {
  if (!feedback.subject_id || !approved) return;

  const parsed = JSON.parse(feedback.json as string) as FeedbackParsed;
  const itemTags = parsed.content.itemTags as string[];
  const itemNotes = parsed.content.itemNotes as string | undefined;

  processTags(itemTags, [], feedback.subject_id);

  await prisma.items.update({
    where: { internal_id: feedback.subject_id },
    data: { comment: itemNotes ?? undefined },
  });
};
