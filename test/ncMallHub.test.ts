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
  filterActiveMallEvents,
  hasNcMallOfficialTag,
  hasRetiredOfficialTag,
  mallEventCategoryTag,
  pickDyeworksFeaturedItem,
} from '@app/server/ncMallHub';
import { isEventActive } from '@app/_components/Item/NCTrade/ncTradeInsightsUtils';
import type { ItemMallData, ItemV2For, UserList } from '@types';

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
  });

  it('returns null when there is no real discount', () => {
    expect(
      getMallDiscountPercent(mallCard('A', 1, { price: 250, discountPrice: null }))
    ).toBeNull();
    expect(getMallDiscountPercent(mallCard('B', 2, { price: 250, discountPrice: 250 }))).toBeNull();
    expect(getMallDiscountPercent(mallCard('C', 3, { price: 250, discountPrice: 300 }))).toBeNull();
    expect(getMallDiscountPercent(mallCard('D', 4, { price: 0, discountPrice: 0 }))).toBeNull();
    // Bundles store 0 as "no markdown", not free
    expect(getMallDiscountPercent(mallCard('E', 5, { price: 1500, discountPrice: 0 }))).toBeNull();
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

const EVENT_NOW = Date.parse('2026-08-15T12:00:00.000Z');

function eventList(overrides: Partial<UserList> = {}): UserList {
  return {
    internal_id: 1,
    name: 'Mall Fashion Show',
    officialTag: ['NC Mall'],
    seriesStart: '2026-08-01T00:00:00.000Z',
    seriesEnd: '2026-09-01T00:00:00.000Z',
    ...overrides,
  } as UserList;
}

describe('hasNcMallOfficialTag', () => {
  it('matches NC Mall case-insensitively among other tags', () => {
    expect(hasNcMallOfficialTag(eventList())).toBe(true);
    expect(hasNcMallOfficialTag(eventList({ officialTag: ['nc mall', 'plot'] }))).toBe(true);
    expect(hasNcMallOfficialTag(eventList({ officialTag: ['Plot'] }))).toBe(false);
  });
});

describe('isEventActive', () => {
  it('is active when now is inside the series window', () => {
    expect(isEventActive(eventList(), EVENT_NOW)).toBe(true);
  });

  it('is active with no end date after start', () => {
    expect(isEventActive(eventList({ seriesEnd: null }), EVENT_NOW)).toBe(true);
  });

  it('is inactive before start, after end, or without a start', () => {
    expect(isEventActive(eventList({ seriesStart: '2026-08-20T00:00:00.000Z' }), EVENT_NOW)).toBe(
      false
    );
    expect(isEventActive(eventList({ seriesEnd: '2026-08-10T00:00:00.000Z' }), EVENT_NOW)).toBe(
      false
    );
    expect(isEventActive(eventList({ seriesStart: null }), EVENT_NOW)).toBe(false);
  });
});

describe('hasRetiredOfficialTag', () => {
  it('matches Retired case-insensitively', () => {
    expect(hasRetiredOfficialTag(eventList({ officialTag: ['NC Mall', 'Retired'] }))).toBe(true);
    expect(hasRetiredOfficialTag(eventList({ officialTag: ['nc mall', 'retired'] }))).toBe(true);
    expect(hasRetiredOfficialTag(eventList({ officialTag: ['NC Mall', 'Wonderclaw'] }))).toBe(
      false
    );
  });
});

describe('mallEventCategoryTag', () => {
  it('returns the third official tag after the comma split', () => {
    expect(
      mallEventCategoryTag(eventList({ officialTag: ['NC Mall', 'Event', 'Wonderclaw'] }))
    ).toBe('Wonderclaw');
    expect(mallEventCategoryTag(eventList({ officialTag: ['NC Mall', 'Wonderclaw'] }))).toBeNull();
    expect(mallEventCategoryTag(eventList({ officialTag: ['NC Mall'] }))).toBeNull();
  });
});

describe('filterActiveMallEvents', () => {
  it('keeps active NC Mall lists and drops ended, other-tag, and retired', () => {
    const active = eventList({ internal_id: 1, name: 'Show' });
    const ended = eventList({ internal_id: 2, seriesEnd: '2026-08-01T00:00:00.000Z' });
    const otherTag = eventList({ internal_id: 3, officialTag: ['Plot'] });
    const retired = eventList({
      internal_id: 4,
      name: 'Old Capsules',
      officialTag: ['NC Mall', 'Retired'],
    });

    expect(
      filterActiveMallEvents([active, ended, otherTag, retired], EVENT_NOW).map((list) => list.name)
    ).toEqual(['Show']);
  });
});

describe('pickDyeworksFeaturedItem', () => {
  const at = new Date('2026-08-20T18:00:00.000Z');

  function card(id: number, flags: ItemV2For<'card'>['flags'] = []): ItemV2For<'card'> {
    return {
      internal_id: id,
      name: `Item ${id}`,
      flags,
    } as ItemV2For<'card'>;
  }

  it('prefers the first wearable in the cohort', () => {
    const rows = [
      { item_iid: 1, highlightedAt: at },
      { item_iid: 2, highlightedAt: at },
      { item_iid: 3, highlightedAt: at },
    ];
    const itemsById = {
      '1': card(1),
      '2': card(2, ['wearable']),
      '3': card(3, ['wearable']),
    };

    expect(pickDyeworksFeaturedItem(rows, itemsById)?.item.internal_id).toBe(2);
  });

  it('falls back to the first resolved card when none are wearable', () => {
    const rows = [
      { item_iid: 10, highlightedAt: at },
      { item_iid: 11, highlightedAt: at },
    ];
    const itemsById = {
      '10': card(10),
      '11': card(11),
    };

    expect(pickDyeworksFeaturedItem(rows, itemsById)?.item.internal_id).toBe(10);
  });

  it('skips missing items and returns null when none resolve', () => {
    expect(pickDyeworksFeaturedItem([{ item_iid: 99, highlightedAt: at }], {})).toBeNull();
  });
});
