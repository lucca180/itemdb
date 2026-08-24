import { describe, expect, it } from 'vitest';
import {
  compareOnSaleItems,
  getMallDiscountPercent,
  groupLeavingByLabel,
  isUnchangedLebronValue,
  mallLebronDirection,
  mallSortPrice,
  parseOwlsRange,
  pickDeepestCut,
  pickNextOut,
  previousOwlsValueByIid,
  splitMallLeaving,
  rankAlsoNewThisWeek,
  popularityFromPageviews,
} from '@app/server/ncMallHub';
import type { ItemMallData, ItemV2For } from '@types';

function mallCard(
  name: string,
  id: number,
  price: Partial<ItemMallData> & Pick<ItemMallData, 'price'>
): ItemV2For<'card'> {
  return {
    internal_id: id,
    name,
    price: {
      type: 'ncMall',
      price: price.price,
      saleBegin: price.saleBegin ?? null,
      saleEnd: price.saleEnd ?? null,
      discountBegin: price.discountBegin ?? null,
      discountEnd: price.discountEnd ?? null,
      discountPrice: price.discountPrice ?? null,
    },
  } as ItemV2For<'card'>;
}

describe('getMallDiscountPercent', () => {
  it('returns the rounded markdown percent', () => {
    expect(getMallDiscountPercent(mallCard('A', 1, { price: 250, discountPrice: 150 }))).toBe(40);
    expect(getMallDiscountPercent(mallCard('B', 2, { price: 200, discountPrice: 100 }))).toBe(50);
    expect(getMallDiscountPercent(mallCard('C', 3, { price: 250, discountPrice: 0 }))).toBe(100);
  });

  it('returns null when there is no real discount', () => {
    expect(
      getMallDiscountPercent(mallCard('A', 1, { price: 250, discountPrice: null }))
    ).toBeNull();
    expect(getMallDiscountPercent(mallCard('B', 2, { price: 250, discountPrice: 250 }))).toBeNull();
    expect(getMallDiscountPercent(mallCard('C', 3, { price: 250, discountPrice: 300 }))).toBeNull();
    expect(getMallDiscountPercent(mallCard('D', 4, { price: 0, discountPrice: 0 }))).toBeNull();
  });
});

describe('pickDeepestCut', () => {
  it('picks the steepest markdown and ties on name', () => {
    const items = [
      mallCard('Zebra Scarf', 1, { price: 200, discountPrice: 100 }),
      mallCard('Apple Hat', 2, { price: 250, discountPrice: 125 }),
      mallCard('Mild Sale', 3, { price: 300, discountPrice: 240 }),
    ];

    expect(pickDeepestCut(items)?.name).toBe('Apple Hat');
    expect(compareOnSaleItems(items[0], items[1])).toBeGreaterThan(0);
  });

  it('returns null for an empty list', () => {
    expect(pickDeepestCut([])).toBeNull();
  });
});

describe('pickNextOut', () => {
  it('picks the soonest day, then the lowest price', () => {
    const entries = [
      { item: mallCard('Expensive', 1, { price: 400 }), saleEndMs: 1_000 },
      { item: mallCard('Cheap', 2, { price: 100 }), saleEndMs: 1_500 },
      { item: mallCard('Later', 3, { price: 50 }), saleEndMs: Date.UTC(1970, 0, 3) },
    ];

    expect(pickNextOut(entries)?.item.name).toBe('Cheap');
  });

  it('returns null for an empty list', () => {
    expect(pickNextOut([])).toBeNull();
  });
});

describe('mallSortPrice', () => {
  it('ignores a zero discountPrice and uses the list price', () => {
    expect(mallSortPrice(mallCard('Bundle', 1, { price: 1500, discountPrice: 0 }))).toBe(1500);
    expect(mallSortPrice(mallCard('Sale', 2, { price: 250, discountPrice: 150 }))).toBe(150);
    expect(mallSortPrice(mallCard('Full', 3, { price: 250 }))).toBe(250);
  });
});

describe('splitMallLeaving', () => {
  it('keeps date-then-price order across strip and aside', () => {
    const day = Date.UTC(2026, 7, 24);
    const later = Date.UTC(2026, 7, 25);
    const entries = [
      { item: mallCard('Teams II', 1, { price: 250 }), saleEndMs: day },
      { item: mallCard('Teams III', 2, { price: 250 }), saleEndMs: day },
      { item: mallCard('Teams IV', 3, { price: 250 }), saleEndMs: day },
      { item: mallCard('Teams', 4, { price: 250 }), saleEndMs: day },
      { item: mallCard('Mini Capsule', 5, { price: 150 }), saleEndMs: day },
      { item: mallCard('10-Bundle', 6, { price: 1500, discountPrice: 0 }), saleEndMs: day },
      { item: mallCard('5-Bundle', 7, { price: 750, discountPrice: 0 }), saleEndMs: day },
      { item: mallCard('Foregrounds', 8, { price: 150 }), saleEndMs: day },
      { item: mallCard('Later cheap', 9, { price: 50 }), saleEndMs: later },
    ];

    const { stripItems, asideItems } = splitMallLeaving(entries);

    expect(stripItems.map((item) => item.name)).toEqual([
      'Foregrounds',
      'Mini Capsule',
      'Teams',
      'Teams II',
      'Teams III',
    ]);
    expect(asideItems.map((item) => item.name)).toEqual(['Teams IV', '5-Bundle', '10-Bundle']);
  });
});

describe('popularityFromPageviews', () => {
  it('scores only the candidate slugs and ignores other Umami paths', () => {
    const items = [
      { ...mallCard('Capsule', 1, { price: 150 }), slug: 'frutiger-aero-mystery-capsule' },
      { ...mallCard('Wig', 2, { price: 150 }), slug: 'some-wig' },
      { ...mallCard('No slug', 3, { price: 150 }), slug: null },
    ];
    const pageviews = new Map([
      ['faerie-slushie', 9999],
      ['frutiger-aero-mystery-capsule', 40],
      ['some-wig', 10],
    ]);

    const popularity = popularityFromPageviews(items, pageviews);

    expect(popularity.get(1)).toBe(40);
    expect(popularity.get(2)).toBe(10);
    expect(popularity.has(3)).toBe(false);
  });
});

describe('rankAlsoNewThisWeek', () => {
  it('ranks by popularity, skips the cover, and ties on newer saleBegin', () => {
    const popularity = new Map([
      [1, 90],
      [2, 40],
      [3, 70],
      [4, 70],
      [5, 10],
    ]);
    const items = [
      mallCard('Cover hit', 1, { price: 150, saleBegin: '2026-08-22T00:00:00.000Z' }),
      mallCard('Quiet new', 2, { price: 150, saleBegin: '2026-08-23T00:00:00.000Z' }),
      mallCard('Zebra', 3, { price: 150, saleBegin: '2026-08-20T00:00:00.000Z' }),
      mallCard('Apple', 4, { price: 150, saleBegin: '2026-08-21T00:00:00.000Z' }),
      mallCard('Filler', 5, { price: 150, saleBegin: '2026-08-19T00:00:00.000Z' }),
    ];

    expect(rankAlsoNewThisWeek(items, 1, popularity, 3).map((item) => item.name)).toEqual([
      'Apple',
      'Zebra',
      'Quiet new',
    ]);
  });
});

describe('parseOwlsRange', () => {
  it('reads a single cap and a min-max range', () => {
    expect(parseOwlsRange('5')).toEqual({ min: 5, max: 5 });
    expect(parseOwlsRange('12-16')).toEqual({ min: 12, max: 16 });
  });

  it('returns null for empty or unparseable values', () => {
    expect(parseOwlsRange('')).toBeNull();
    expect(parseOwlsRange('null')).toBeNull();
    expect(parseOwlsRange('WB')).toBeNull();
  });
});

describe('mallLebronDirection', () => {
  it('marks a first listing as new', () => {
    expect(mallLebronDirection(null, '3-5')).toBe('new');
    expect(mallLebronDirection('WB', '3-5')).toBe('new');
  });

  it('uses the midpoint, then the floor, matching the editorial mock', () => {
    expect(mallLebronDirection('12-16', '15-20')).toBe('up');
    expect(mallLebronDirection('10-14', '8-12')).toBe('down');
    expect(mallLebronDirection('5-6', '4-7')).toBe('down');
  });
});

describe('isUnchangedLebronValue', () => {
  it('skips a restated range, including 5 vs 5-5', () => {
    expect(isUnchangedLebronValue('1', '1')).toBe(true);
    expect(isUnchangedLebronValue('5', '5-5')).toBe(true);
    expect(isUnchangedLebronValue('12-16', '12-16')).toBe(true);
  });

  it('keeps a first listing and a real move', () => {
    expect(isUnchangedLebronValue(null, '3-5')).toBe(false);
    expect(isUnchangedLebronValue('12-16', '15-20')).toBe(false);
  });
});

describe('previousOwlsValueByIid', () => {
  it('keeps the newest archived row per item', () => {
    const previous = previousOwlsValueByIid([
      { item_iid: 1, value: '1-2', pricedAt: new Date('2026-08-01T00:00:00.000Z') },
      { item_iid: 1, value: '2-3', pricedAt: new Date('2026-08-10T00:00:00.000Z') },
      { item_iid: 2, value: '8-10', pricedAt: new Date('2026-08-05T00:00:00.000Z') },
    ]);

    expect(previous.get(1)).toBe('2-3');
    expect(previous.get(2)).toBe('8-10');
  });
});

describe('groupLeavingByLabel', () => {
  it('groups by formatted day and keeps chronological order', () => {
    const entries = [
      { item: mallCard('Later A', 1, { price: 150 }), saleEndMs: 5_000 },
      { item: mallCard('Soon B', 2, { price: 150 }), saleEndMs: 1_000 },
      { item: mallCard('Soon A', 3, { price: 150 }), saleEndMs: 1_500 },
    ];

    const groups = groupLeavingByLabel(entries, (ms) => (ms < 3_000 ? 'soon' : 'later'));

    expect(groups.map((group) => group.label)).toEqual(['soon', 'later']);
    expect(groups[0].items.map((item) => item.name)).toEqual(['Soon B', 'Soon A']);
    expect(groups[1].items.map((item) => item.name)).toEqual(['Later A']);
  });
});
