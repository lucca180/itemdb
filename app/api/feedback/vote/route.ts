import { after } from 'next/server';
import prisma from '@utils/prisma';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getRequestClientIp } from '@utils/api/clientIp';
import {
  AUTO_PRICE_UID,
  FEEDBACK_VOTE_TARGET,
  MAX_VOTE_MULTIPLIER,
  getVoteMultiplier,
  isNewFeedbackAccount,
} from '@utils/feedback/voteRules';
import {
  FeedbackCommitError,
  commitFeedbackIfDecided,
  retryStaleFeedbackCommits,
} from '@services/feedback/feedbackCommit';
import { reportBackgroundError } from '@utils/api/reportBackgroundError';

type VoteBody = { feedback_id?: number | string; action?: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as VoteBody | null;
  const feedback_id = parseInt(String(body?.feedback_id ?? ''));
  const action = body?.action;

  if (!feedback_id || !action)
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  if (action !== 'upvote' && action !== 'downvote')
    return Response.json({ error: 'Invalid action' }, { status: 400 });

  const { user } = await getServerCurrentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.banned) return Response.json({ error: 'Forbidden' }, { status: 403 });

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
      where: { feedback_id },
      select: {
        user_id: true,
        vote: {
          where: { user_id },
          select: { vote_id: true },
          take: 1,
        },
      },
    });

    if (!feedbackRaw) return Response.json({ error: 'Feedback not found' }, { status: 404 });

    // new accounts can only help with auto priced feedbacks
    if (isNewAccount && feedbackRaw.user_id !== AUTO_PRICE_UID)
      return Response.json({ error: 'Account too new' }, { status: 403 });

    if (feedbackRaw.vote.length)
      return Response.json({ error: 'You have already voted on this feedback' }, { status: 409 });

    if (feedbackRaw.user_id === user_id && !isAdmin)
      return Response.json({ error: 'You cannot vote on your own feedback' }, { status: 403 });

    if (action === 'downvote' && !isAdmin && !isNewAccount)
      voteMultiplier = Math.min(voteMultiplier * 2, MAX_VOTE_MULTIPLIER);

    const [feedback] = await prisma.$transaction([
      prisma.feedbacks.update({
        where: { feedback_id },
        data: {
          votes:
            action === 'upvote' ? { increment: voteMultiplier } : { decrement: voteMultiplier },
        },
        select: { processed: true },
      }),
      prisma.feedbackVotes.create({
        data: {
          feedback_id,
          user_id,
          approve: action === 'upvote',
          voteWeight: voteMultiplier,
        },
      }),
    ]);

    // deciding/committing (pricing, xp...) doesn't block the voter
    const ip = getRequestClientIp(request);
    after(async () => {
      try {
        if (!feedback.processed) await commitFeedbackIfDecided(feedback_id, ip);
      } catch (e) {
        reportBackgroundError(e, {
          task: 'feedback.commit',
          tags: { feedback_id, action, voter: user_id },
          data: {
            vote: { feedback_id, action, voter: user_id, voteWeight: voteMultiplier },
            ...(e instanceof FeedbackCommitError ? e.details : {}),
          },
        });
      }

      try {
        await retryStaleFeedbackCommits();
      } catch (e) {
        reportBackgroundError(e, { task: 'feedback.retryStaleCommits', data: {} });
      }
    });

    return Response.json({ success: true });
  } catch (e: any) {
    // concurrent double vote hits FeedbackVotes @@unique([feedback_id, user_id])
    if (e?.code === 'P2002')
      return Response.json({ error: 'You have already voted on this feedback' }, { status: 409 });

    console.error(e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
