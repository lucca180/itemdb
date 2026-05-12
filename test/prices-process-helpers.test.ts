import { describe, expect, test, vi } from 'vitest';

vi.mock('@utils/prisma', () => ({
  default: {
    itemPrices: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@services/ActionLogService', () => ({
  LogService: {
    createLog: vi.fn(),
  },
}));

import { handleInflation, shouldUpdatePrice } from '@utils/prices/process-helpers';

const latestDate = new Date('2026-01-20T00:00:00.000Z');
const dayMs = 24 * 60 * 60 * 1000;

const price = (value: number) => ({ toNumber: () => value });

const historyEntry = (
  value: number,
  daysAgo: number,
  overrides: Partial<{
    internal_id: number;
    noInflation_id: number | null;
    manual_check: string | null;
  }> = {}
) => ({
  addedAt: new Date(latestDate.getTime() - daysAgo * dayMs),
  price: price(value),
  noInflation_id: overrides.noInflation_id ?? null,
  internal_id: overrides.internal_id ?? daysAgo,
  manual_check: overrides.manual_check ?? null,
});

describe('process price z-score rules', () => {
  test('price for small prices', () => {
    const priceHistory = [
      historyEntry(4_000, 4, { internal_id: 1 }),
      historyEntry(4_700, 30),
      historyEntry(3_640, 40),
      historyEntry(4_000, 50),
      historyEntry(3_580, 60),
    ] as any;

    expect(shouldUpdatePrice({ latestDate, priceHistory, priceValue: 5000 })).toBe(true);
  });

  test('price when the old price was already abnormal but the new price is still unusual', () => {
    const priceHistory = [
      historyEntry(14_000_000, 4, { internal_id: 1 }),
      historyEntry(47_000_000, 30),
      historyEntry(36_400_000, 40),
      historyEntry(43_000_000, 50),
      historyEntry(35_800_000, 60),
    ] as any;

    expect(shouldUpdatePrice({ latestDate, priceHistory, priceValue: 3_500_000 })).toBe(true);
  });

  test('skip when the old price was already abnormal but the new price is still little unusual', () => {
    const priceHistory = [
      historyEntry(103_000, 5, { internal_id: 1 }),
      historyEntry(100_000, 20),
      historyEntry(102_000, 30),
      historyEntry(98_000, 40),
      historyEntry(101_000, 50),
    ] as any;

    expect(shouldUpdatePrice({ latestDate, priceHistory, priceValue: 104_000 })).toBe(false);
  });

  test('still ignores recent small changes near the historical normal', () => {
    const priceHistory = [
      historyEntry(100_500, 6, { internal_id: 1 }),
      historyEntry(100_000, 20),
      historyEntry(102_000, 30),
      historyEntry(98_000, 40),
      historyEntry(101_000, 50),
    ] as any;

    expect(shouldUpdatePrice({ latestDate, priceHistory, priceValue: 101_000 })).toBe(false);
  });

  test('skips inflation if its too close from previous outlier', async () => {
    const priceHistory = [
      historyEntry(300_000, 12, { internal_id: 42 }),
      historyEntry(100_000, 20),
      historyEntry(100_000, 30),
      historyEntry(200_000, 40),
      historyEntry(100_000, 50),
    ] as any;

    const newPriceData = { price: 351_000 } as any;
    const result = await handleInflation({
      latestDate,
      priceHistory,
      priceValue: 351_000,
      newPriceData,
    });

    expect(result.msg).toBe(null);
    expect(result.isManualCheck).toBe(false);
  });

  test('detects inflation without requiring movement away from the previous outlier', async () => {
    const priceHistory = [
      historyEntry(260_000, 12, { internal_id: 42 }),
      historyEntry(100_000, 20),
      historyEntry(100_000, 30),
      historyEntry(200_000, 40),
      historyEntry(100_000, 50),
    ] as any;

    const newPriceData = { price: 351_000 } as any;
    const result = await handleInflation({
      latestDate,
      priceHistory,
      priceValue: 351_000,
      newPriceData,
    });

    expect(result.msg).toBe('inflation');
    expect(result.isManualCheck).toBe(true);
    expect(result.newPriceData.noInflation_id).toBe(42);
  });
});
