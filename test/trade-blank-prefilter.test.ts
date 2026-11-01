import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  items: { findMany: vi.fn() },
}));

const processTradePrice = vi.hoisted(() => vi.fn());
const reportBackgroundError = vi.hoisted(() => vi.fn());
const metricsCount = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));
vi.mock('@sentry/nextjs', () => ({ metrics: { count: metricsCount } }));
vi.mock('@utils/prisma', () => ({ default: prismaMock }));
vi.mock('@utils/api/reportBackgroundError', () => ({ reportBackgroundError }));
vi.mock('@services/feedback/feedbackCommit', () => ({
  commitFeedbackDecision: vi.fn(),
  FeedbackCommitError: class extends Error {},
}));
vi.mock('@pages/api/v1/trades', () => ({ processTradePrice }));
vi.mock('@pages/api/v1/items/many', () => ({ getManyItems: vi.fn() }));

import { closeConfirmedBlank } from '@pages/api/v1/trades/autoPrice2';
import { getTradeConfirmedBlank } from '@services/feedback/tradeAutoApprove';

const tradeRow = (wishlist: string, extra: object = {}) =>
  ({
    trade_id: 10,
    wishlist,
    instantBuy: null,
    hash: 'h',
    items: [
      { internal_id: 1, trade_id: 10, item_iid: 100, order: 0, amount: 1, price: null },
      { internal_id: 2, trade_id: 10, item_iid: 200, order: 1, amount: 1, price: null },
      { internal_id: 3, trade_id: 10, item_iid: 300, order: 2, amount: 1, price: null },
    ],
    ...extra,
  }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.TRADE_BLANK_PREFILTER;
  prismaMock.items.findMany.mockResolvedValue([]);
});

describe('getTradeConfirmedBlank', () => {
  test('looks up the lot item names (raw trade items have none)', async () => {
    prismaMock.items.findMany.mockResolvedValueOnce([
      { internal_id: 100, name: 'Kacheek Plushie' },
      { internal_id: 200, name: 'Rubber Duck' },
      { internal_id: 300, name: 'Red Codestone' },
    ]);

    // names one of the items: may be its price (pt-5), so not confirmed
    await expect(getTradeConfirmedBlank(tradeRow('Kacheek 100M is auto'))).resolves.toBeNull();
    expect(prismaMock.items.findMany.mock.calls[0][0].where).toEqual({
      internal_id: { in: [100, 200, 300] },
    });
  });

  test('confirms a mixed lot total and a lot without any value', async () => {
    await expect(getTradeConfirmedBlank(tradeRow('9 mil'))).resolves.toBe('mixed lot total');
    await expect(getTradeConfirmedBlank(tradeRow('5 cool neggs'))).resolves.toBe('no np value');
  });
});

describe('closeConfirmedBlank', () => {
  test('closes a confirmed blank lot with every slot blank', async () => {
    await expect(closeConfirmedBlank(tradeRow('5 cool neggs'))).resolves.toBe(true);

    const [closed] = processTradePrice.mock.calls[0];
    expect(closed.trade_id).toBe(10);
    expect(closed.items.map((i: any) => i.price)).toEqual([null, null, null]);
    expect(metricsCount).toHaveBeenCalledWith('trade.blank_prefilter', 1, {
      attributes: { reason: 'no np value' },
    });
  });

  test('leaves anything else in the queue', async () => {
    await expect(closeConfirmedBlank(tradeRow('17.5 please'))).resolves.toBe(false);
    expect(processTradePrice).not.toHaveBeenCalled();
  });

  test('does nothing when disabled', async () => {
    process.env.TRADE_BLANK_PREFILTER = 'off';

    await expect(closeConfirmedBlank(tradeRow('5 cool neggs'))).resolves.toBe(false);
    expect(prismaMock.items.findMany).not.toHaveBeenCalled();
    expect(processTradePrice).not.toHaveBeenCalled();
  });

  test('reports a failure without breaking the auto pricer batch', async () => {
    processTradePrice.mockRejectedValueOnce(new Error('boom'));

    await expect(closeConfirmedBlank(tradeRow('5 cool neggs'))).resolves.toBe(false);
    expect(reportBackgroundError).toHaveBeenCalledWith(expect.any(Error), {
      task: 'trade.blankPrefilter',
      tags: { trade_id: 10 },
      data: { trade_id: 10 },
    });
  });
});
