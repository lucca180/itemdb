import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('EVENT_MODE', 'false');
});

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

import { LogService } from '@services/ActionLogService';
import {
  canAutoApprove,
  getAutoApproveOwnerNeed,
  handleInflation,
  PRICING,
  shouldUpdatePrice,
} from '@utils/prices/process-helpers';
import type { PriceSignals } from '@utils/prices/pricing3';

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

const strongSignals = (overrides: Partial<PriceSignals> = {}): PriceSignals => ({
  sourceScore: PRICING.AUTO_APPROVE_SOURCE_SCORE + 0.15,
  owners: 30,
  ownerMin: 15,
  maxShare: PRICING.AUTO_APPROVE_MAX_SHARE / 2,
  ...overrides,
});

const inflationHistory = [
  historyEntry(260_000, 12, { internal_id: 42 }),
  historyEntry(100_000, 20),
  historyEntry(100_000, 30),
  historyEntry(200_000, 40),
  historyEntry(100_000, 50),
] as any;

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
      historyEntry(103_000, 3, { internal_id: 1 }),
      historyEntry(100_000, 20),
      historyEntry(102_000, 30),
      historyEntry(98_000, 40),
      historyEntry(101_000, 50),
    ] as any;

    expect(shouldUpdatePrice({ latestDate, priceHistory, priceValue: 104_000 })).toBe(false);
  });

  test('still ignores recent small changes near the historical normal', () => {
    const priceHistory = [
      historyEntry(100_500, 3, { internal_id: 1 }),
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
    const newPriceData = { price: 351_000 } as any;
    const result = await handleInflation({
      latestDate,
      priceHistory: inflationHistory,
      priceValue: 351_000,
      newPriceData,
    });

    expect(result.msg).toBe('inflation');
    expect(result.isManualCheck).toBe(true);
    expect(result.newPriceData.noInflation_id).toBe(42);
  });
});

describe('canAutoApprove', () => {
  test('passes with strong signals', () => {
    expect(canAutoApprove(strongSignals())).toBe(true);
  });

  test('fails without signals', () => {
    expect(canAutoApprove(undefined)).toBe(false);
  });

  test('fails when sourceScore is below threshold', () => {
    expect(
      canAutoApprove(strongSignals({ sourceScore: PRICING.AUTO_APPROVE_SOURCE_SCORE - 0.05 }))
    ).toBe(false);
  });

  test('fails when owners are below ownerMin + EXTRA', () => {
    const ownerMin = 10;
    const ownerNeed = getAutoApproveOwnerNeed(ownerMin);
    expect(ownerNeed).toBe(ownerMin + PRICING.AUTO_APPROVE_OWNER_EXTRA);
    expect(
      canAutoApprove(
        strongSignals({
          ownerMin,
          owners: ownerNeed - 1,
        })
      )
    ).toBe(false);
  });

  test('requires exactly ownerMin + EXTRA owners', () => {
    const ownerMin = 3;
    const ownerNeed = getAutoApproveOwnerNeed(ownerMin);
    expect(ownerNeed).toBe(ownerMin + PRICING.AUTO_APPROVE_OWNER_EXTRA);

    expect(canAutoApprove(strongSignals({ owners: ownerNeed, ownerMin }))).toBe(true);
    expect(canAutoApprove(strongSignals({ owners: ownerNeed - 1, ownerMin }))).toBe(false);
  });

  test('fails when maxShare is above threshold', () => {
    expect(canAutoApprove(strongSignals({ maxShare: PRICING.AUTO_APPROVE_MAX_SHARE + 0.05 }))).toBe(
      false
    );
  });

  test('fails under forceMode', () => {
    expect(canAutoApprove(strongSignals(), true)).toBe(false);
  });
});

describe('handleInflation auto-approve', () => {
  beforeEach(() => {
    vi.mocked(LogService.createLog).mockClear();
  });

  test('auto-approves inflation with strong ssw/sw signals', async () => {
    const signals = strongSignals({
      sourceScore: PRICING.AUTO_APPROVE_SOURCE_SCORE + 0.17,
    });
    const newPriceData = { price: 351_000, item_iid: 7 } as any;

    const result = await handleInflation({
      latestDate,
      priceHistory: inflationHistory,
      priceValue: 351_000,
      newPriceData,
      signals,
    });

    expect(result.msg).toBe('inflation');
    expect(result.isManualCheck).toBe(false);
    expect(result.newPriceData.noInflation_id).toBe(42);
    expect(LogService.createLog).toHaveBeenCalledWith(
      'inflationAutoApprove',
      expect.objectContaining({
        newPrice: 351_000,
        oldPrice: 260_000,
        ...signals,
      }),
      '7'
    );
  });

  test('auto-approves expensive items backed by trade/auction-sold', async () => {
    const signals = strongSignals({ sourceScore: PRICING.AUTO_APPROVE_SOURCE_SCORE });
    const newPriceData = { price: 351_000, item_iid: 9 } as any;

    const result = await handleInflation({
      latestDate,
      priceHistory: inflationHistory,
      priceValue: 351_000,
      newPriceData,
      signals,
    });

    expect(result.isManualCheck).toBe(false);
    expect(result.newPriceData.noInflation_id).toBe(42);
  });

  test('keeps manual check when usershop dominates sourceScore', async () => {
    const signals = strongSignals({
      sourceScore: PRICING.AUTO_APPROVE_SOURCE_SCORE - 0.35,
    });
    const newPriceData = { price: 351_000 } as any;

    const result = await handleInflation({
      latestDate,
      priceHistory: inflationHistory,
      priceValue: 351_000,
      newPriceData,
      signals,
    });

    expect(result.msg).toBe('inflation');
    expect(result.isManualCheck).toBe(true);
    expect(LogService.createLog).not.toHaveBeenCalled();
  });

  test('keeps manual check for auction-only sourceScore', async () => {
    const signals = strongSignals({
      sourceScore: PRICING.AUTO_APPROVE_SOURCE_SCORE - 0.05,
    });
    const newPriceData = { price: 351_000 } as any;

    const result = await handleInflation({
      latestDate,
      priceHistory: inflationHistory,
      priceValue: 351_000,
      newPriceData,
      signals,
    });

    expect(result.isManualCheck).toBe(true);
  });

  test('keeps manual check when a single point concentrates weight', async () => {
    const signals = strongSignals({
      maxShare: PRICING.AUTO_APPROVE_MAX_SHARE + 0.15,
    });
    const newPriceData = { price: 351_000 } as any;

    const result = await handleInflation({
      latestDate,
      priceHistory: inflationHistory,
      priceValue: 351_000,
      newPriceData,
      signals,
    });

    expect(result.isManualCheck).toBe(true);
  });

  test('never auto-approves under forceMode', async () => {
    const signals = strongSignals();
    const newPriceData = { price: 351_000 } as any;

    const result = await handleInflation({
      latestDate,
      priceHistory: inflationHistory,
      priceValue: 351_000,
      newPriceData,
      signals,
      forceMode: true,
    });

    expect(result.isManualCheck).toBe(true);
    expect(LogService.createLog).not.toHaveBeenCalled();
  });

  test('legacy path always stays manual even with strong signals', async () => {
    const oldPrice = 100_000;
    // Legacy inflation needs CV >= 50 (or >= 75); 3x guarantees CV == 50 with 2 samples.
    const priceValue = oldPrice * 3;
    expect(priceValue - oldPrice).toBeGreaterThanOrEqual(PRICING.MIN_INFLATION_DIFF);

    const priceHistory = [
      historyEntry(oldPrice, 12, { internal_id: 42 }),
      historyEntry(95_000, 20),
      historyEntry(90_000, 30),
    ] as any;

    const signals = strongSignals();
    const newPriceData = { price: priceValue } as any;

    const result = await handleInflation({
      latestDate,
      priceHistory,
      priceValue,
      newPriceData,
      signals,
    });

    expect(result.msg).toBe('inflation');
    expect(result.isManualCheck).toBe(true);
    expect(LogService.createLog).not.toHaveBeenCalled();
  });
});
