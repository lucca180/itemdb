import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  feedbacks: { findUnique: vi.fn() },
  items: { findMany: vi.fn() },
}));

const commitFeedbackDecision = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));
vi.mock('@sentry/nextjs', () => ({ metrics: { count: vi.fn() } }));
vi.mock('@utils/prisma', () => ({ default: prismaMock }));
vi.mock('@services/feedback/feedbackCommit', () => ({ commitFeedbackDecision }));

import { autoApproveTradeFeedback } from '@services/feedback/tradeAutoApprove';

const feedbackRow = (trade: object, extra: object = {}) => ({
  feedback_id: 1,
  type: 'tradePrice',
  user_id: 'submitter',
  processed: false,
  votes: 1,
  json: JSON.stringify({ ip: '1.1.1.1', pageRef: '/feedback/trades', content: { trade } }),
  vote: [],
  ...extra,
});

const trade = (wishlist: string, price: number | null, extra: object = {}) => ({
  trade_id: 10,
  wishlist,
  instantBuy: null,
  items: [{ internal_id: 5, item_iid: 100, name: 'Mipsy Stamp', amount: 1, order: 0, price }],
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.TRADE_AUTO_APPROVE;
  prismaMock.items.findMany.mockResolvedValue([]);
  commitFeedbackDecision.mockResolvedValue('approve');
});

describe('autoApproveTradeFeedback', () => {
  test('approves when every price matches the wishlist and records why', async () => {
    const row = feedbackRow(trade('50m obo', 50_000_000));
    prismaMock.feedbacks.findUnique.mockResolvedValue(row);

    await expect(autoApproveTradeFeedback(1, '2.2.2.2')).resolves.toBe(true);

    const [feedback, decision, options] = commitFeedbackDecision.mock.calls[0];
    expect(feedback).toBe(row);
    expect(decision).toBe('approve');
    expect(options.ip).toBe('2.2.2.2');
    expect(JSON.parse(options.json).autoApprove).toEqual({
      by: 'wishlist-parser',
      version: 1,
      reason: 'single value',
    });
  });

  test('approves a blank suggestion when the guidelines say blank', async () => {
    prismaMock.feedbacks.findUnique.mockResolvedValue(
      feedbackRow(trade('20m + 2 cool neggs', null))
    );

    await expect(autoApproveTradeFeedback(1)).resolves.toBe(true);
  });

  test('leaves mismatches in the vote queue', async () => {
    prismaMock.feedbacks.findUnique.mockResolvedValue(
      feedbackRow(trade('20m + 2 cool neggs', 30_000_000))
    );

    await expect(autoApproveTradeFeedback(1)).resolves.toBe(false);
    expect(commitFeedbackDecision).not.toHaveBeenCalled();
  });

  test('leaves ambiguous wishlists in the vote queue', async () => {
    prismaMock.feedbacks.findUnique.mockResolvedValue(
      feedbackRow(trade('10m', 10_000_000, { instantBuy: 10_000_000 }))
    );

    await expect(autoApproveTradeFeedback(1)).resolves.toBe(false);
    expect(commitFeedbackDecision).not.toHaveBeenCalled();
  });

  test('uses wishlist item names found in Items', async () => {
    prismaMock.feedbacks.findUnique.mockResolvedValue(
      feedbackRow(trade('10m + Hungry Fungus', 10_000_000))
    );
    prismaMock.items.findMany.mockResolvedValue([{ name: 'Hungry Fungus' }]);

    await expect(autoApproveTradeFeedback(1)).resolves.toBe(false);

    const [{ where }] = prismaMock.items.findMany.mock.calls[0];
    expect(where.name.in).toContain('hungry fungus');
    expect(where.type).toBe('np');
  });

  test('fills item names of auto priced feedbacks from Items', async () => {
    const auto = trade('Mipsy Stamp 20m | Hungry Fungus 5m', null, {
      items: [
        { internal_id: 5, item_iid: 100, amount: 1, order: 0, price: '5000000' },
        { internal_id: 6, item_iid: 200, amount: 1, order: 1, price: '20000000' },
      ],
    });
    prismaMock.feedbacks.findUnique.mockResolvedValue(feedbackRow(auto));
    prismaMock.items.findMany.mockImplementation(async ({ where }) =>
      where.internal_id
        ? [
            { internal_id: 100, name: 'Hungry Fungus' },
            { internal_id: 200, name: 'Mipsy Stamp' },
          ]
        : []
    );

    await expect(autoApproveTradeFeedback(1)).resolves.toBe(true);
  });

  test('does nothing when disabled, processed or not a trade price', async () => {
    process.env.TRADE_AUTO_APPROVE = 'off';
    await expect(autoApproveTradeFeedback(1)).resolves.toBe(false);
    expect(prismaMock.feedbacks.findUnique).not.toHaveBeenCalled();

    delete process.env.TRADE_AUTO_APPROVE;
    prismaMock.feedbacks.findUnique.mockResolvedValue(
      feedbackRow(trade('50m', 50_000_000), { processed: true })
    );
    await expect(autoApproveTradeFeedback(1)).resolves.toBe(false);

    prismaMock.feedbacks.findUnique.mockResolvedValue(
      feedbackRow(trade('50m', 50_000_000), { type: 'itemChange' })
    );
    await expect(autoApproveTradeFeedback(1)).resolves.toBe(false);
    expect(commitFeedbackDecision).not.toHaveBeenCalled();
  });

  test('reports false when another worker holds the lease', async () => {
    prismaMock.feedbacks.findUnique.mockResolvedValue(feedbackRow(trade('50m', 50_000_000)));
    commitFeedbackDecision.mockResolvedValue(null);

    await expect(autoApproveTradeFeedback(1)).resolves.toBe(false);
  });
});
