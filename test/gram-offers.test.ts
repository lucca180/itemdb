import { describe, expect, test } from 'vitest';
import {
  buildGramOfferStats,
  getOfferChance,
  getRotatingOptions,
  ROTATING_OPTION_MIN_OPENINGS,
} from '@utils/item/gramOffers';

const option = (opening: number, item_iid: number, at = opening) => ({
  opening_id: `opening-${opening}`,
  item_iid,
  notes: 'gramOption',
  addedAt: new Date(at * 1000),
});

/** `count` openings offering the regular items, plus `rare` in the first `rareCount` of them. */
const openings = (count: number, regular: number[], rare?: number, rareCount = 0) =>
  Array.from({ length: count }, (_, index) => [
    ...regular.map((id) => option(index + 1, id)),
    ...(rare && index < rareCount ? [option(index + 1, rare)] : []),
  ]).flat();

describe('gram offer stats', () => {
  test('counts distinct openings that offered any of the items', () => {
    const rows = [...openings(20, [1, 2], 3, 5), option(1, 1)];
    const stats = buildGramOfferStats(rows, new Map());

    expect(stats([1])).toEqual({ offered: 20, total: 20 });
    expect(stats([3])).toEqual({ offered: 5, total: 20 });
    expect(stats([2, 3])).toEqual({ offered: 20, total: 20 });
  });

  test('ignores rows that are not gram options', () => {
    const stats = buildGramOfferStats(
      [option(1, 1), { ...option(2, 1), notes: 'gram' }],
      new Map()
    );

    expect(stats([1])).toEqual({ offered: 1, total: 1 });
  });

  test('only counts openings after the item existed in itemdb', () => {
    // item 2 was added at opening 15: earlier openings couldn't record it
    const rows = [
      ...openings(14, [1]),
      ...openings(30, [1, 2]).filter((r) => r.addedAt.getTime() >= 15000),
    ];
    const stats = buildGramOfferStats(rows, new Map([[2, new Date(15000)]]));

    expect(stats([2])).toEqual({ offered: 16, total: 16 });
    expect(getRotatingOptions([1, 2], stats)).toEqual(new Set());
  });

  test('flags options offered in less than half of the openings', () => {
    const stats = buildGramOfferStats(openings(20, [1, 2], 3, 4), new Map());

    expect(getRotatingOptions([1, 2, 3], stats)).toEqual(new Set([3]));
    expect(getOfferChance([3], stats)).toBe(20);
  });

  test('needs enough openings before flagging an option', () => {
    const count = ROTATING_OPTION_MIN_OPENINGS - 1;
    const stats = buildGramOfferStats(openings(count, [1], 3, 1), new Map());

    expect(getRotatingOptions([1, 3], stats)).toEqual(new Set());
  });

  test('has no offer chance for items never offered', () => {
    const stats = buildGramOfferStats(openings(5, [1]), new Map());

    expect(getOfferChance([9], stats)).toBeUndefined();
  });
});
