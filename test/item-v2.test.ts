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
  type RawItemV2Row,
} from '@app/server/items/v2';

const completeRow = (overrides: RawItemV2Row = {}): RawItemV2Row => ({
  internal_id: 42,
  item_id: 85020,
  name: 'Test Item',
  description: 'A complete item.',
  image: 'https://images.neopets.com/items/test.gif',
  image_id: 'test',
  imgCacheOverride: 'hash',
  category: 'Toy',
  rarity: 90,
  weight: 1,
  type: 'np',
  isWearable: false,
  isNeohome: false,
  isBD: false,
  est_val: 500,
  status: 'active',
  slug: 'test-item',
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
    expect(getItemV2QueryPlan('card').joins).toEqual([
      'color',
      'npPrice',
      'ncValue',
      'owlsPrice',
      'ncMall',
    ]);
  });

  test('pricer intent joins price sources without color', () => {
    expect(getItemV2QueryPlan('pricer').joins).toEqual([
      'npPrice',
      'ncValue',
      'owlsPrice',
      'ncMall',
    ]);
    expect(getItemV2QueryPlan('pricer').columns).not.toContain('colorHex');
  });

  test('full intent includes every ItemV2 field without a hand-written list', () => {
    const plan = getItemV2QueryPlan('full');

    expect(plan.fields).toEqual(
      expect.arrayContaining([
        'internal_id',
        'weight',
        'estVal',
        'comment',
        'canonical_id',
        'firstSeen',
        'useTypes',
        'colorHex',
        'price',
      ])
    );
    expect(plan.fields).toHaveLength(19);
    expect(plan.joins).toEqual(['color', 'npPrice', 'ncValue', 'owlsPrice', 'ncMall']);
  });

  test('getMany maps rows and preserves v1 identifier keys', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([completeRow()]);

    const items = await getManyItemsV2({ id: [42] }, { intent: 'minimal', limit: 1 });

    expect(prismaMock.$queryRaw).toHaveBeenCalledOnce();
    expect(items['42']).toEqual(mapItemV2(completeRow(), 'minimal'));
  });

  test('uses the same non-empty filter for querying and response keys', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([completeRow()]);

    const items = await getManyItemsV2(
      { id: [], slug: ['test-item'] },
      { intent: 'minimal', limit: 1 }
    );

    expect(items['test-item']).toEqual(mapItemV2(completeRow(), 'minimal'));
    expect(items['42']).toBeUndefined();
  });

  test('getItemV2 looks up by id and returns a single mapped item', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([completeRow()]);

    const item = await getItemV2(42, { intent: 'minimal' });

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
      'flags',
      'description',
      'status',
    ]);
    expect(item.flags).toEqual(['wearable', 'bd', 'missingInfo', 'no-unknown', 'custom']);
    expect(item.image).toEqual({
      url: 'https://images.neopets.com/items/test.gif',
      id: 'test',
      hash: 'hash',
    });
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

  test('prefers an active NC Mall price over NC value sources', () => {
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

    expect(item.price).toEqual({
      type: 'ncMall',
      price: 150,
      saleBegin: '2026-02-01T00:00:00.000Z',
      saleEnd: null,
      discountBegin: null,
      discountEnd: null,
      discountPrice: null,
    });
  });

  test('falls back from OWLS to ItemDB for the best NC value', () => {
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

    expect(item.price).toEqual({
      type: 'ncValue',
      minValue: 3,
      maxValue: 4,
      range: '3-4',
      addedAt: '2026-04-01T00:00:00.000Z',
      source: 'itemdb',
    });
  });

  test('returns no price for no-trade items', () => {
    const item = mapItemV2(completeRow({ status: 'no trade' }), 'card');
    expect(item.price).toBeNull();
  });

  test('preserves non-standard item statuses', () => {
    const item = mapItemV2(completeRow({ status: 'retired' }), 'card');
    expect(item.status).toBe('retired');
  });
});
