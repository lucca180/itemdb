import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  APPROVE_VOTE_TARGET,
  FeedbackVoteTally,
  NEW_ACCOUNT_AGE,
  REJECT_VOTE_TARGET,
  getFeedbackDecision,
  isNewFeedbackAccount,
} from '@utils/feedback/voteRules';

const up = (user_id: string | null, isAdmin = false) => ({ user_id, approve: true, isAdmin });
const down = (user_id: string | null, isAdmin = false) => ({ user_id, approve: false, isAdmin });

const tally = (
  score: number,
  votes: FeedbackVoteTally['votes'],
  extra = {}
): FeedbackVoteTally => ({
  score,
  submitterId: 'submitter',
  votes,
  ...extra,
});

describe('getFeedbackDecision', () => {
  test('approves with enough score and two distinct upvoters', () => {
    expect(getFeedbackDecision(tally(APPROVE_VOTE_TARGET, [up('a'), up('b')]))).toBe('approve');
  });

  test('does not approve with a single upvoter, whatever the score', () => {
    expect(getFeedbackDecision(tally(50, [up('a')]))).toBeNull();
  });

  test('does not approve below the score target', () => {
    expect(getFeedbackDecision(tally(APPROVE_VOTE_TARGET - 1, [up('a'), up('b')]))).toBeNull();
  });

  test('ignores the submitter and anonymous votes when counting voters', () => {
    expect(getFeedbackDecision(tally(10, [up('submitter'), up('a'), up(null)]))).toBeNull();
  });

  test('auto priced feedbacks follow the same rule', () => {
    const auto = { submitterId: 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1' };
    expect(getFeedbackDecision(tally(7, [up('a')], auto))).toBeNull();
    expect(getFeedbackDecision(tally(7, [up('a'), up('b')], auto))).toBe('approve');
  });

  test('rejects with enough negative score and two distinct downvoters', () => {
    expect(getFeedbackDecision(tally(-REJECT_VOTE_TARGET, [down('a'), down('b')]))).toBe('reject');
  });

  test('does not reject with a single downvoter or above the target', () => {
    expect(getFeedbackDecision(tally(-50, [down('a')]))).toBeNull();
    expect(getFeedbackDecision(tally(-REJECT_VOTE_TARGET + 1, [down('a'), down('b')]))).toBeNull();
  });

  test('voters on the losing side do not count for the winning side', () => {
    expect(getFeedbackDecision(tally(6, [up('a'), down('b')]))).toBeNull();
  });

  test('an admin vote decides alone', () => {
    expect(getFeedbackDecision(tally(15, [up('admin', true)]))).toBe('approve');
    expect(getFeedbackDecision(tally(-11, [down('admin', true)]))).toBe('reject');
  });

  test('an admin vote only skips the minimum on its own side', () => {
    expect(getFeedbackDecision(tally(-8, [up('admin', true), down('a')]))).toBeNull();
  });

  test('admin submissions only need the score', () => {
    expect(getFeedbackDecision(tally(14, [], { submitterIsAdmin: true }))).toBe('approve');
  });
});

describe('isNewFeedbackAccount', () => {
  afterEach(() => vi.useRealTimers());

  test('accounts younger than the limit are new, admins never are', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T00:00:00Z'));
    const recent = new Date(Date.now() - NEW_ACCOUNT_AGE + 60_000).toJSON();
    const old = new Date(Date.now() - NEW_ACCOUNT_AGE - 60_000).toJSON();

    expect(isNewFeedbackAccount({ role: 'USER', createdAt: recent })).toBe(true);
    expect(isNewFeedbackAccount({ role: 'USER', createdAt: old })).toBe(false);
    expect(isNewFeedbackAccount({ role: 'ADMIN', createdAt: recent })).toBe(false);
  });
});
