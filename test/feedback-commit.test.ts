import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  feedbacks: { findUnique: vi.fn(), updateMany: vi.fn(), findMany: vi.fn() },
  feedbackVotes: { findMany: vi.fn() },
  user: { updateMany: vi.fn() },
  trades: { update: vi.fn() },
  tradeItems: { updateMany: vi.fn() },
  items: { update: vi.fn() },
}));

const processTradePrice = vi.hoisted(() => vi.fn());
const reportBackgroundError = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));
vi.mock('@utils/prisma', () => ({ default: prismaMock }));
vi.mock('@pages/api/v1/trades', () => ({ processTradePrice }));
vi.mock('@pages/api/v1/items/[id_name]/index', () => ({ processTags: vi.fn() }));
vi.mock('@utils/api/reportBackgroundError', () => ({ reportBackgroundError }));

import {
  FeedbackCommitError,
  commitFeedbackIfDecided,
  retryStaleFeedbackCommits,
} from '@services/feedback/feedbackCommit';

const trade = { trade_id: 10, items: [] };

const feedbackRow = (votes: number, voteRows: { user_id: string; approve: boolean }[]) => ({
  feedback_id: 1,
  type: 'tradePrice',
  user_id: 'submitter',
  processed: false,
  votes,
  json: JSON.stringify({ ip: '1.1.1.1', pageRef: '/feedback/trades', content: { trade } }),
  user: { role: 'USER' },
  vote: voteRows.map((v) => ({ ...v, user: { role: 'USER' } })),
});

const xpUpdates = () =>
  prismaMock.user.updateMany.mock.calls.map(([args]) => ({
    ids: args.where.id.in,
    amount: args.data.xp.increment,
  }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.feedbacks.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
});

describe('commitFeedbackIfDecided', () => {
  test('approves: claims, prices the trade, finalizes and pays xp', async () => {
    const votes = [
      { user_id: 'a', approve: true },
      { user_id: 'b', approve: true },
    ];
    prismaMock.feedbacks.findUnique.mockResolvedValue(feedbackRow(5, votes));
    prismaMock.feedbackVotes.findMany.mockResolvedValue([
      ...votes,
      { user_id: 'c', approve: false },
    ]);

    await expect(commitFeedbackIfDecided(1, '2.2.2.2')).resolves.toBe('approve');

    const [claim, finalize] = prismaMock.feedbacks.updateMany.mock.calls.map(([args]) => args);
    expect(claim.where).toMatchObject({ feedback_id: 1, processed: false });
    expect(claim.data.processedAt).toBeInstanceOf(Date);
    expect(finalize.data).toMatchObject({ processed: true, approved: true });

    expect(processTradePrice).toHaveBeenCalledWith(trade, '2.2.2.2');
    expect(xpUpdates()).toEqual([
      { ids: ['submitter'], amount: 7 },
      { ids: ['a', 'b'], amount: 2 },
      { ids: ['c'], amount: -7 },
    ]);
  });

  test('rejects: sends the trade back to the queue and punishes upvoters', async () => {
    const votes = [
      { user_id: 'a', approve: false },
      { user_id: 'b', approve: false },
      { user_id: 'c', approve: true },
    ];
    prismaMock.feedbacks.findUnique.mockResolvedValue(feedbackRow(-7, votes));
    prismaMock.feedbackVotes.findMany.mockResolvedValue(votes);

    await expect(commitFeedbackIfDecided(1)).resolves.toBe('reject');

    expect(processTradePrice).not.toHaveBeenCalled();
    expect(prismaMock.tradeItems.updateMany).toHaveBeenCalledWith({
      where: { trade_id: 10 },
      data: { price: null },
    });
    expect(prismaMock.trades.update).toHaveBeenCalledWith({
      where: { trade_id: 10 },
      data: { processed: false, priced: false },
    });
    expect(xpUpdates()).toEqual([
      { ids: ['submitter'], amount: -70 },
      { ids: ['c'], amount: -70 },
      { ids: ['a', 'b'], amount: 15 },
    ]);
  });

  test('does nothing without a decision', async () => {
    prismaMock.feedbacks.findUnique.mockResolvedValue(
      feedbackRow(10, [{ user_id: 'a', approve: true }])
    );

    await expect(commitFeedbackIfDecided(1)).resolves.toBeNull();
    expect(prismaMock.feedbacks.updateMany).not.toHaveBeenCalled();
  });

  test('does nothing for processed feedbacks', async () => {
    prismaMock.feedbacks.findUnique.mockResolvedValue({ ...feedbackRow(10, []), processed: true });

    await expect(commitFeedbackIfDecided(1)).resolves.toBeNull();
    expect(prismaMock.feedbacks.updateMany).not.toHaveBeenCalled();
  });

  test('skips when another worker holds the lease', async () => {
    prismaMock.feedbacks.findUnique.mockResolvedValue(
      feedbackRow(5, [
        { user_id: 'a', approve: true },
        { user_id: 'b', approve: true },
      ])
    );
    prismaMock.feedbacks.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(commitFeedbackIfDecided(1)).resolves.toBeNull();
    expect(processTradePrice).not.toHaveBeenCalled();
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  test('releases the lease and pays no xp when the side effects fail', async () => {
    prismaMock.feedbacks.findUnique.mockResolvedValue(
      feedbackRow(5, [
        { user_id: 'a', approve: true },
        { user_id: 'b', approve: true },
      ])
    );
    const cause = new Error('db down');
    processTradePrice.mockRejectedValueOnce(cause);

    const error = await commitFeedbackIfDecided(1).catch((e) => e);
    expect(error).toBeInstanceOf(FeedbackCommitError);
    expect(error.cause).toBe(cause);
    expect(error.details).toMatchObject({
      step: 'sideEffects',
      decision: 'approve',
      leaseReleased: true,
      feedback: { feedback_id: 1, json: { content: { trade } } },
    });
    // no ip in what goes to Sentry
    expect(error.details.feedback.json.ip).toBeUndefined();

    const [claim, release] = prismaMock.feedbacks.updateMany.mock.calls.map(([args]) => args);
    expect(release.where).toMatchObject({
      feedback_id: 1,
      processed: false,
      processedAt: claim.data.processedAt,
    });
    expect(release.data).toEqual({ processedAt: null });
    expect(prismaMock.feedbacks.updateMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  test('keeps the decision and reports the xp plan when xp fails', async () => {
    const votes = [
      { user_id: 'a', approve: true },
      { user_id: 'b', approve: true },
    ];
    prismaMock.feedbacks.findUnique.mockResolvedValue(feedbackRow(5, votes));
    prismaMock.feedbackVotes.findMany.mockResolvedValue(votes);
    prismaMock.user.updateMany.mockRejectedValueOnce(new Error('lock timeout'));

    const error = await commitFeedbackIfDecided(1).catch((e) => e);
    expect(error).toBeInstanceOf(FeedbackCommitError);
    expect(error.details).toMatchObject({
      step: 'xp',
      leaseReleased: false,
      xpPlan: [
        { ids: ['submitter'], amount: 7 },
        { ids: ['a', 'b'], amount: 2 },
      ],
    });

    // claim + finalize only - the lease is not released after the feedback was finalized
    expect(prismaMock.feedbacks.updateMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.feedbacks.updateMany.mock.calls[1][0].data).toMatchObject({
      processed: true,
    });
  });
});

describe('retryStaleFeedbackCommits', () => {
  test('re-runs each stale commit and reports failures to Sentry', async () => {
    prismaMock.feedbacks.findMany.mockResolvedValue([{ feedback_id: 1 }, { feedback_id: 2 }]);
    prismaMock.feedbacks.findUnique
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(null);

    await retryStaleFeedbackCommits();

    expect(prismaMock.feedbacks.findMany.mock.calls[0][0].where).toMatchObject({
      processed: false,
    });
    expect(prismaMock.feedbacks.findUnique).toHaveBeenCalledTimes(2);
    expect(reportBackgroundError).toHaveBeenCalledTimes(1);
    expect(reportBackgroundError.mock.calls[0][1]).toMatchObject({
      task: 'feedback.retryStaleCommit',
      tags: { feedback_id: 1 },
    });
  });
});
