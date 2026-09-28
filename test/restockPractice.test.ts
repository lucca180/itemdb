import { describe, expect, test } from 'vitest';
import {
  generateRestock,
  MAX_UNIQUE_ITEMS,
  rollRestockRarity,
  rollStockAmount,
  type PracticeItem,
} from '@utils/restockPractice';
import { getRestockPrice, shopIDToCategory } from '@utils/utils';

// Deterministic PRNG so the statistical assertions are stable
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Not a special day for any shop
const REGULAR_DAY = Date.UTC(2026, 8, 10, 20);
const USUKI_DAY = Date.UTC(2026, 7, 20, 20);

const POST_OFFICE = 58;
const FOOD_SHOP = 1;
const PETPET_SHOP = 25;
const USUKI_SHOP = 48;

const makePool = (size: number, rarity: number | ((i: number) => number)): PracticeItem[] =>
  Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    // reversed vs. the pool order so ordering assertions are meaningful
    itemId: 10_000 - i,
    name: `Item ${i + 1}`,
    slug: `item-${i + 1}`,
    imageId: `item_${i + 1}`,
    rarity: typeof rarity === 'function' ? rarity(i) : rarity,
    estVal: 500,
    marketPrice: i % 2 === 0 ? 20_000 : null,
  }));

describe('rollRestockRarity', () => {
  test('stays within 1-100', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 50_000; i++) {
      const rarity = rollRestockRarity(rng);
      expect(rarity).toBeGreaterThanOrEqual(1);
      expect(rarity).toBeLessThanOrEqual(100);
    }
  });

  test('matches the expected distribution', () => {
    const rng = mulberry32(2);
    const samples = 400_000;
    let atLeast90 = 0;
    let atLeast97 = 0;

    for (let i = 0; i < samples; i++) {
      const rarity = rollRestockRarity(rng);
      if (rarity >= 90) atLeast90++;
      if (rarity >= 97) atLeast97++;
    }

    // exact values derived from the algorithm: P(>=90) = 55/1200, P(>=97) = 6/1200
    expect(atLeast90 / samples).toBeCloseTo(55 / 1200, 2);
    expect(atLeast97 / samples).toBeCloseTo(6 / 1200, 3);
  });
});

describe('rollStockAmount', () => {
  const lowest = () => 0;
  const highest = () => 0.9999;

  test.each([
    [99, 1, 1],
    [86, 1, 1],
    [85, 1, 2],
    [80, 1, 3],
    [75, 1, 4],
    [70, 1, 7],
    [65, 2, 7],
    [60, 3, 7],
    [50, 4, 7],
    [30, 5, 7],
    [1, 5, 7],
  ])('rarity %i stocks between %i and %i', (rarity, min, max) => {
    expect(rollStockAmount(rarity, lowest)).toBe(min);
    expect(rollStockAmount(rarity, highest)).toBe(max);
  });
});

describe('generateRestock', () => {
  test('returns nothing for an empty pool', () => {
    expect(generateRestock([], POST_OFFICE, { rng: mulberry32(3), date: REGULAR_DAY })).toEqual([]);
  });

  test('caps big shops at 46 unique items', () => {
    const restock = generateRestock(makePool(3000, 1), POST_OFFICE, {
      rng: mulberry32(4),
      date: REGULAR_DAY,
    });

    expect(restock).toHaveLength(MAX_UNIQUE_ITEMS);
    expect(new Set(restock.map((item) => item.id)).size).toBe(MAX_UNIQUE_ITEMS);
  });

  test('lists items by ascending item id, unknown ids last', () => {
    const pool = makePool(200, 1).map((item, i) =>
      i % 10 === 0 ? { ...item, itemId: null } : item
    );
    const restock = generateRestock(pool, POST_OFFICE, { rng: mulberry32(10), date: REGULAR_DAY });

    const known = restock.filter((item) => item.itemId !== null);
    const unknown = restock.filter((item) => item.itemId === null);

    expect(unknown.length).toBeGreaterThan(0);
    expect(known.map((item) => item.itemId)).toEqual(
      known.map((item) => item.itemId).sort((a, b) => a! - b!)
    );
    expect(restock.slice(known.length)).toEqual(unknown);
  });

  test('rolls shop prices within the restock price range and computes profit', () => {
    const pool = makePool(50, (i) => 60 + (i % 40));
    const restock = generateRestock(pool, POST_OFFICE, { rng: mulberry32(5), date: REGULAR_DAY });

    expect(restock.length).toBeGreaterThan(0);
    for (const item of restock) {
      const [min, max] = getRestockPrice(
        { category: shopIDToCategory[POST_OFFICE], rarity: item.rarity, estVal: item.estVal },
        false,
        REGULAR_DAY
      )!;

      expect(item.shopPrice).toBeGreaterThanOrEqual(min);
      expect(item.shopPrice).toBeLessThanOrEqual(max);
      expect(item.profit).toBe(
        item.marketPrice === null ? null : item.marketPrice - item.shopPrice
      );
    }
  });

  test('rare items show up far less often than common ones', () => {
    const pool = [
      ...makePool(20, 10),
      ...makePool(20, 95).map((item) => ({ ...item, id: item.id + 100 })),
    ];
    const rng = mulberry32(6);
    let common = 0;
    let rare = 0;

    for (let i = 0; i < 500; i++) {
      for (const item of generateRestock(pool, POST_OFFICE, { rng, date: REGULAR_DAY })) {
        if (item.rarity === 10) common++;
        else rare++;
      }
    }

    // per restock: r10 ≈ 43% vs r95 ≈ 1%
    expect(common).toBeGreaterThan(rare * 10);
  });

  test('reduces petpet shop stock to 1-8', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      for (const item of generateRestock(makePool(100, 1), PETPET_SHOP, {
        rng,
        date: REGULAR_DAY,
      })) {
        expect(item.stock).toBeGreaterThanOrEqual(1);
        expect(item.stock).toBeLessThanOrEqual(8);
      }
    }
  });

  test('adds 2d8 stock to common food shop items', () => {
    const rng = mulberry32(8);
    for (let i = 0; i < 50; i++) {
      for (const item of generateRestock(makePool(100, 1), FOOD_SHOP, { rng, date: REGULAR_DAY })) {
        // 5-7 base + 2-16 extra per stocking roll
        expect(item.stock).toBeGreaterThanOrEqual(7);
      }
    }
  });

  test('doubles Usuki Day stock', () => {
    const rng = mulberry32(9);
    const restock = generateRestock(makePool(100, 90), USUKI_SHOP, { rng, date: USUKI_DAY });

    expect(restock.length).toBeGreaterThan(0);
    for (const item of restock) expect(item.stock % 2).toBe(0);
  });
});
