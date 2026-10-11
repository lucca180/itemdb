import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Prisma } from '@prisma/generated/client';

const txMock = vi.hoisted(() => ({
  saleStats: {
    updateMany: vi.fn(),
    create: vi.fn(),
  },
}));

const prismaMock = vi.hoisted(() => ({
  saleStats: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  priceProcess2: { findMany: vi.fn() },
  items: { findUnique: vi.fn() },
  trades: { findMany: vi.fn() },
  restockAuctionHistory: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@pages/api/v1/items/[id_name]/index', () => ({
  getItem: vi.fn(),
}));

import { getSaleStats } from '@pages/api/v1/items/[id_name]/saleStats';

const IID = 42;
const DAY = 24 * 60 * 60 * 1000;

/** No sales data at all → computes `unknown` 0/0 over 15 days. */
const UNKNOWN_RESULT = { stats: 'unknown', totalSold: 0, totalItems: 0, daysPeriod: 15 } as const;

const latestRow = (overrides: Record<string, unknown> = {}) => ({
  internal_id: 1000,
  item_iid: IID,
  ...UNKNOWN_RESULT,
  isLatest: true,
  addedAt: new Date(Date.now() - 10 * DAY),
  checkedAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();

  prismaMock.priceProcess2.findMany.mockResolvedValue([]);
  prismaMock.items.findUnique.mockResolvedValue({ internal_id: IID });
  prismaMock.trades.findMany.mockResolvedValue([]);
  prismaMock.restockAuctionHistory.findMany.mockResolvedValue([]);
  prismaMock.saleStats.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) =>
    fn(txMock)
  );

  txMock.saleStats.updateMany.mockResolvedValue({ count: 1 });
  txMock.saleStats.create.mockResolvedValue({});
});

describe('getSaleStats persistence', () => {
  test('uses checkedAt for freshness and skips recomputing', async () => {
    const checkedAt = new Date(Date.now() - DAY);
    prismaMock.saleStats.findUnique.mockResolvedValue(
      latestRow({ stats: 'ets', totalSold: 50, totalItems: 100, checkedAt })
    );

    const result = await getSaleStats(IID);

    expect(result).toMatchObject({ status: 'ets', addedAt: checkedAt.toJSON() });
    expect(prismaMock.priceProcess2.findMany).not.toHaveBeenCalled();
    expect(prismaMock.saleStats.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  test('stale row with the same result only updates checkedAt', async () => {
    prismaMock.saleStats.findUnique.mockResolvedValue(latestRow());

    await getSaleStats(IID);

    expect(prismaMock.saleStats.updateMany).toHaveBeenCalledWith({
      where: { internal_id: 1000 },
      data: { checkedAt: expect.any(Date) },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  test('stale row with a different result is replaced', async () => {
    prismaMock.saleStats.findUnique.mockResolvedValue(
      latestRow({ stats: 'ets', totalSold: 50, totalItems: 100 })
    );

    await getSaleStats(IID);

    expect(txMock.saleStats.updateMany).toHaveBeenCalledWith({
      where: { internal_id: 1000, isLatest: true },
      data: { isLatest: null },
    });
    expect(txMock.saleStats.create).toHaveBeenCalledWith({
      data: { item_iid: IID, ...UNKNOWN_RESULT, isLatest: true },
    });
    expect(prismaMock.saleStats.updateMany).not.toHaveBeenCalled();
  });

  test('does not insert when another request already replaced the row', async () => {
    prismaMock.saleStats.findUnique.mockResolvedValue(
      latestRow({ stats: 'ets', totalSold: 50, totalItems: 100 })
    );
    txMock.saleStats.updateMany.mockResolvedValue({ count: 0 });

    await getSaleStats(IID);

    expect(txMock.saleStats.create).not.toHaveBeenCalled();
  });

  test('first row losing a unique race is ignored, not retried', async () => {
    prismaMock.saleStats.findUnique.mockResolvedValue(null);
    txMock.saleStats.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    await expect(getSaleStats(IID)).resolves.toBeNull();

    expect(txMock.saleStats.updateMany).not.toHaveBeenCalled();
    expect(txMock.saleStats.create).toHaveBeenCalledTimes(1);
  });
});
