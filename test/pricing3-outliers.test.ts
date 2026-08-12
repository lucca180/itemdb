import { afterEach, describe, expect, test, vi } from 'vitest';
import { processPrices3, removeOutliersCombined } from '@utils/prices/pricing3';
import type { PriceProcess2 } from '@prisma/generated/client';
import { Decimal } from '@prisma/client/runtime/client';

const sorted = (values: number[]) => [...values].sort((a, b) => a - b);

type SampleInput = {
  price: number;
  owner: string;
  internal_id?: number;
  type?: string;
  stock?: number;
  addedAt?: Date;
  ip_address?: string | null;
};

let nextId = 1;

const sample = (overrides: SampleInput): PriceProcess2 =>
  ({
    internal_id: overrides.internal_id ?? nextId++,
    item_iid: 73710,
    owner: overrides.owner,
    ownerHash: null,
    type: overrides.type ?? 'trade',
    stock: overrides.stock ?? 1,
    price: new Decimal(overrides.price),
    addedAt: overrides.addedAt ?? new Date('2026-07-24T12:00:00.000Z'),
    ip_address: overrides.ip_address ?? null,
    hash: null,
    neo_id: null,
    processed: false,
  }) as PriceProcess2;

describe('removeOutliersCombined (option C: log-MAD + cheap bimodal cluster)', () => {
  test('n < 4 is unchanged', () => {
    expect(removeOutliersCombined([100, 200, 300])).toEqual([100, 200, 300]);
  });

  test('Drakaras Wand pool drops 1.7M and 10M, keeps the 1.5–2B cluster', () => {
    const kept = removeOutliersCombined([
      1_700_000, 10_000_000, 1_500_000_000, 1_600_000_000, 2_000_000_000, 2_000_000_000,
    ]);
    expect(sorted(kept)).toEqual([1_500_000_000, 1_600_000_000, 2_000_000_000, 2_000_000_000]);
  });

  test('50/50 regimes keep the cheaper blob', () => {
    const kept = removeOutliersCombined([
      10_000_000, 10_000_000, 10_000_000, 1_500_000_000, 1_500_000_000, 1_500_000_000,
    ]);
    expect(sorted(kept)).toEqual([10_000_000, 10_000_000, 10_000_000]);
  });

  test('2 vs 4 (minority junk) keeps the expensive majority via log-MAD', () => {
    const kept = removeOutliersCombined([
      1_700_000, 10_000_000, 1_500_000_000, 1_600_000_000, 2_000_000_000, 2_000_000_000,
    ]);
    expect(kept.every((x) => x >= 1_500_000_000)).toBe(true);
    expect(kept).not.toContain(1_700_000);
    expect(kept).not.toContain(10_000_000);
  });

  test('50% off vs a tight ~100k cluster is dropped', () => {
    const kept = removeOutliersCombined([
      50_000, 90_000, 95_000, 100_000, 100_000, 105_000, 110_000,
    ]);
    expect(kept).not.toContain(50_000);
    expect(kept).toContain(90_000);
  });

  test('50% off vs a wide ~100k market is kept', () => {
    const kept = removeOutliersCombined([
      50_000, 70_000, 90_000, 100_000, 110_000, 130_000, 150_000,
    ]);
    expect(kept).toContain(50_000);
  });

  test('restock 5× vs tight TP cluster (~400 NP) is dropped', () => {
    const kept = removeOutliersCombined([80, 80, 350, 400, 400, 450, 500]);
    expect(kept).not.toContain(80);
  });

  test('restock 2× vs tight TP cluster (~400 NP) is dropped by log-MAD', () => {
    const kept = removeOutliersCombined([200, 350, 380, 400, 420, 450, 500]);
    expect(kept).not.toContain(200);
  });

  test('restock 5× vs a wide cheap market is kept', () => {
    const kept = removeOutliersCombined([80, 200, 300, 400, 500, 600, 800]);
    expect(kept).toContain(80);
  });

  test('1000× junk on a tight ~2k item is dropped', () => {
    const kept = removeOutliersCombined([2, 1800, 1900, 2000, 2000, 2100, 2200]);
    expect(kept).not.toContain(2);
  });

  test('restock vs TP gap under 10× is not treated as two regimes', () => {
    const kept = removeOutliersCombined([100, 100, 100, 800, 800, 800]);
    expect(sorted(kept)).toEqual([100, 100, 100, 800, 800, 800]);
  });
});

describe('processPrices3 replay (Drakaras-like junk)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('does not publish 705M when 1.7M and 10M sit next to a 1.5–2B cluster', () => {
    const now = new Date('2026-08-01T07:06:42.817Z');
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime());

    // 7 unique owners in the 7–15d bucket (current threshold is 7)
    const addedAt = new Date('2026-07-24T12:00:00.000Z');
    const rows = [
      sample({ owner: '__z***', price: 1_700_000, addedAt }),
      sample({ owner: 'kai***', price: 10_000_000, addedAt }),
      sample({ owner: 'yel***', price: 1_500_000_000, addedAt }),
      sample({ owner: 'mic***', price: 1_600_000_000, addedAt }),
      sample({ owner: 'giv***', price: 2_000_000_000, addedAt }),
      sample({ owner: 'sar***', price: 2_000_000_000, addedAt }),
      sample({ owner: 'extra***', price: 1_600_000_000, addedAt }),
    ];

    const result = processPrices3(rows);
    expect(result).toBeDefined();
    expect(result!.price).toBeGreaterThan(1_000_000_000);
    expect(result!.price).not.toBe(705_000_000);
  });
});
