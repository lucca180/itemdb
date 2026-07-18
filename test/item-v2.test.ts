import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
}));

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

import {
  getItemV2,
  getItemV2QueryPlan,
  getManyItemsV2,
  mapItemV2,
  NC_VALUE_JOINS,
  type RawItemV2Row,
} from '@app/server/items/v2';

const TEST_ITEM = {
  internalId: 42,
  itemId: 85020,
  slug: 'test-item',
} as const;

/** Combined ItemV2 image, split across three raw columns in `completeRow`. */
const TEST_IMAGE = {
  url: 'https://images.neopets.com/items/test.gif',
  id: 'test',
  hash: 'hash',
} as const;

/** Slim saleStatus fixture; the raw row splits it into `saleStats` + `saleAdded`. */
const TEST_SALE_STATUS = {
  status: 'ets',
  addedAt: new Date('2026-05-01T00:00:00.000Z'),
} as const;

/**
 * JOIN groups the query engine derives per intent — declared once, reused below.
 * Order follows field declaration: `price` (npPrice, ncMall) then `ncValue`.
 *
 * `NC_VALUE_JOINS` is imported (not hardcoded) because it depends on the
 * `NC_VALUES_TYPE` env var — asserting a literal array here would make this
 * test pass/fail based on unrelated environment config instead of behavior.
 */
const PRICE_JOINS = ['npPrice', 'ncMall', ...NC_VALUE_JOINS] as const;
const CARD_JOINS = ['color', ...PRICE_JOINS] as const;
const PRICER_JOINS = [...PRICE_JOINS, 'saleStats'] as const;
const FULL_JOINS = ['color', ...PRICE_JOINS, 'saleStats'] as const;

const completeRow = (overrides: RawItemV2Row = {}): RawItemV2Row => ({
  internal_id: TEST_ITEM.internalId,
  item_id: TEST_ITEM.itemId,
  name: 'Test Item',
  description: 'A complete item.',
  image: TEST_IMAGE.url,
  image_id: TEST_IMAGE.id,
  imgCacheOverride: TEST_IMAGE.hash,
  category: 'Toy',
  rarity: 90,
  weight: 1,
  type: 'np',
  isWearable: false,
  isNeohome: false,
  isBD: false,
  est_val: 500,
  status: 'active',
  slug: TEST_ITEM.slug,
  comment: null,
  canonical_id: null,
  addedAt: new Date('2026-01-01T00:00:00.000Z'),
  canEat: 'false',
  canRead: 'false',
  canOpen: 'unknown',
  canPlay: 'true',
  colorHex: '#123456',
  npPrice: 1_000,
  priceAddedAt: new Date('2026-06-01T00:00:00.000Z'),
  priceInflationId: null,
  priceManualCheck: null,
  priceContext: null,
  saleStats: TEST_SALE_STATUS.status,
  saleAdded: TEST_SALE_STATUS.addedAt,
  ...overrides,
});

describe('ItemV2 query planning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('minimal intent requires no joins or price/color columns', () => {
    const plan = getItemV2QueryPlan('minimal');

    expect(plan.joins).toEqual([]);
    expect(plan.columns).not.toContain('colorHex');
    expect(plan.columns).not.toContain('npPrice');
  });

  test('card intent derives only the joins needed by card fields', () => {
    expect(getItemV2QueryPlan('card').joins).toEqual([...CARD_JOINS]);
  });

  test('pricer intent joins price sources and saleStats without color', () => {
    const plan = getItemV2QueryPlan('pricer');
    expect(plan.joins).toEqual([...PRICER_JOINS]);
    expect(plan.columns).not.toContain('colorHex');
    expect(plan.fields).toContain('saleStatus');
  });

  test('full intent includes every ItemV2 field without a hand-written list', () => {
    const plan = getItemV2QueryPlan('full');

    // Every field declared by the narrower intents must also be in `full`.
    const declaredElsewhere = new Set(
      (['minimal', 'card', 'pricer'] as const).flatMap((intent) => [
        ...getItemV2QueryPlan(intent).fields,
      ])
    );
    expect(plan.fields).toEqual(expect.arrayContaining([...declaredElsewhere]));

    // `full` also carries the fields no other intent requests.
    expect(plan.fields).toEqual(
      expect.arrayContaining(['weight', 'comment', 'canonical_id', 'firstSeen', 'useTypes'])
    );

    // No field is listed twice.
    expect(new Set(plan.fields).size).toBe(plan.fields.length);
    expect(plan.joins).toEqual([...FULL_JOINS]);
  });

  test('getMany maps rows and preserves v1 identifier keys', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([completeRow()]);

    const items = await getManyItemsV2(
      { type: 'id', data: [TEST_ITEM.internalId] },
      { intent: 'minimal', limit: 1 }
    );

    expect(prismaMock.$queryRaw).toHaveBeenCalledOnce();
    expect(items[TEST_ITEM.internalId]).toEqual(mapItemV2(completeRow(), 'minimal'));
  });

  test('uses the query type for both filtering and response keys', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([completeRow()]);

    const items = await getManyItemsV2(
      { type: 'slug', data: [TEST_ITEM.slug] },
      { intent: 'minimal', limit: 1 }
    );

    expect(items[TEST_ITEM.slug]).toEqual(mapItemV2(completeRow(), 'minimal'));
    expect(items[TEST_ITEM.internalId]).toBeUndefined();
  });

  test('empty data returns no rows without querying', async () => {
    const items = await getManyItemsV2({ type: 'id', data: [] }, { intent: 'minimal', limit: 1 });

    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    expect(items).toEqual({});
  });

  test('getItemV2 looks up by id and returns a single mapped item', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([completeRow()]);

    const item = await getItemV2(TEST_ITEM.internalId, { intent: 'minimal' });

    expect(item).toEqual(mapItemV2(completeRow(), 'minimal'));
  });
});

describe('ItemV2 mapper', () => {
  test('projects only minimal fields and maps flags', () => {
    const item = mapItemV2(
      completeRow({
        isWearable: true,
        isBD: true,
        weight: null,
        flags: 'no-unknown, custom',
      }),
      'minimal'
    );

    expect(Object.keys(item)).toEqual([
      'internal_id',
      'item_id',
      'name',
      'slug',
      'image',
      'type',
      'description',
      'status',
    ]);
    expect(item.image).toEqual(TEST_IMAGE);
  });

  test('maps an unknown NP price and its explicit flags', () => {
    const item = mapItemV2(
      completeRow({
        npPrice: null,
        priceAddedAt: null,
        priceInflationId: 1,
        priceManualCheck: 'review',
        priceContext: 'Low volume',
      }),
      'card'
    );

    expect(item.price).toEqual({
      type: 'np',
      value: 0,
      flags: ['inflation', 'unconfirmed', 'unknown'],
      addedAt: '',
      context: 'Low volume',
    });
  });

  test('marks NP prices older than 6 months as outdated', () => {
    const item = mapItemV2(
      completeRow({
        npPrice: 1_000,
        priceAddedAt: new Date('2025-01-01T00:00:00.000Z'),
      }),
      'card'
    );

    expect(item.price).toEqual({
      type: 'np',
      value: 1_000,
      flags: ['outdated'],
      addedAt: '2025-01-01T00:00:00.000Z',
      context: null,
    });
  });

  test('keeps the NC Mall price and the NC trade value side by side', () => {
    const item = mapItemV2(
      completeRow({
        type: 'nc',
        ncMallPrice: 150,
        ncMallSaleBegin: new Date('2026-02-01T00:00:00.000Z'),
        ncMallSaleEnd: null,
        ncMallDiscountBegin: null,
        ncMallDiscountEnd: null,
        ncMallDiscountPrice: null,
        owlsValue: '2-3',
        owlsValueMin: 2,
        owlsPricedAt: new Date('2026-03-01T00:00:00.000Z'),
      }),
      'card',
      { ncValuesType: 'best' }
    );

    // `price` is the acquisition price (NC Mall)...
    expect(item.price).toEqual({
      type: 'ncMall',
      price: 150,
      saleBegin: '2026-02-01T00:00:00.000Z',
      saleEnd: null,
      discountBegin: null,
      discountEnd: null,
      discountPrice: null,
    });
    // ...while the trade value coexists in `ncValue` (owls wins under `best`).
    expect(item.ncValue).toEqual({
      minValue: 2,
      maxValue: 2,
      range: '2-3',
      addedAt: '2026-03-01T00:00:00.000Z',
      source: 'lebron',
    });
  });

  test('falls back from OWLS to ItemDB for the best NC value (in ncValue)', () => {
    const item = mapItemV2(
      completeRow({
        type: 'nc',
        ncMallPrice: null,
        owlsValue: 'null',
        ncValueRange: '3-4',
        ncValueMin: 3,
        ncValueMax: 4,
        ncValueAddedAt: new Date('2026-04-01T00:00:00.000Z'),
      }),
      'card',
      { ncValuesType: 'best' }
    );

    // No NC Mall entry → no acquisition price for an NC item.
    expect(item.price).toBeNull();
    expect(item.ncValue).toEqual({
      minValue: 3,
      maxValue: 4,
      range: '3-4',
      addedAt: '2026-04-01T00:00:00.000Z',
      source: 'itemdb',
    });
  });

  test('omits ncValue for non-NC items', () => {
    const item = mapItemV2(completeRow({ type: 'np' }), 'card');
    expect(item).not.toHaveProperty('ncValue');
  });

  test('returns no price and no ncValue for no-trade items', () => {
    const item = mapItemV2(completeRow({ type: 'nc', status: 'no trade' }), 'card');
    expect(item.price).toBeNull();
    expect(item).not.toHaveProperty('ncValue');
  });

  test('preserves non-standard item statuses', () => {
    const item = mapItemV2(completeRow({ status: 'retired' }), 'card');
    expect(item.status).toBe('retired');
  });

  test('maps slim saleStatus on pricer and omits it on card', () => {
    const pricer = mapItemV2(completeRow(), 'pricer');
    expect(pricer.saleStatus).toEqual({
      status: TEST_SALE_STATUS.status,
      addedAt: TEST_SALE_STATUS.addedAt.toJSON(),
    });

    const card = mapItemV2(completeRow(), 'card');
    expect(card).not.toHaveProperty('saleStatus');
  });

  test('returns null saleStatus when stats are missing', () => {
    const item = mapItemV2(completeRow({ saleStats: null, saleAdded: null }), 'pricer');
    expect(item.saleStatus).toBeNull();
  });
});
