/** Base unit for xp rewards/penalties; the admin vote weight is FEEDBACK_VOTE_TARGET * 2. */
export const FEEDBACK_VOTE_TARGET = 7;

/** Max vote weight a regular user can reach from xp. */
export const MAX_VOTE_MULTIPLIER = 3;

/** Account used by the auto pricer to submit trade price feedbacks. */
export const AUTO_PRICE_UID = 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1';

export const getVoteMultiplier = (userXP: number) =>
  Math.max(1, Math.min(Math.floor(userXP / 2000), MAX_VOTE_MULTIPLIER));

/** Score needed (submitter's initial votes + vote weights) to approve a feedback. */
export const APPROVE_VOTE_TARGET = 5;

/** Negative score needed to reject a feedback. */
export const REJECT_VOTE_TARGET = 7;

/**
 * Distinct voters (besides the submitter) needed on the winning side, so a single user
 * can't approve/reject on their own. Admin votes skip this.
 */
export const MIN_DISTINCT_VOTERS = 2;

/** Accounts younger than this can only vote on auto priced feedbacks and can't send trade prices. */
export const NEW_ACCOUNT_AGE = 7 * 24 * 60 * 60 * 1000;

export type FeedbackVoteTally = {
  /** current feedback score (feedbacks.votes) */
  score: number;
  submitterId: string | null;
  submitterIsAdmin?: boolean;
  votes: { user_id: string | null; approve: boolean; isAdmin: boolean }[];
};

export type FeedbackDecision = 'approve' | 'reject' | null;

export const getFeedbackDecision = (tally: FeedbackVoteTally): FeedbackDecision => {
  const upVoters = new Set<string>();
  const downVoters = new Set<string>();
  let adminUp = !!tally.submitterIsAdmin;
  let adminDown = false;

  for (const vote of tally.votes) {
    if (vote.isAdmin) {
      if (vote.approve) adminUp = true;
      else adminDown = true;
    }

    if (!vote.user_id || vote.user_id === tally.submitterId) continue;
    (vote.approve ? upVoters : downVoters).add(vote.user_id);
  }

  if (tally.score >= APPROVE_VOTE_TARGET && (adminUp || upVoters.size >= MIN_DISTINCT_VOTERS))
    return 'approve';

  if (tally.score <= -REJECT_VOTE_TARGET && (adminDown || downVoters.size >= MIN_DISTINCT_VOTERS))
    return 'reject';

  return null;
};

export const isNewFeedbackAccount = (user: { role?: string; createdAt: string | Date }) =>
  user.role !== 'ADMIN' && Date.now() - new Date(user.createdAt).getTime() < NEW_ACCOUNT_AGE;
