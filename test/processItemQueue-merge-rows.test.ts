import { describe, expect, test, vi } from 'vitest';

vi.mock('@utils/prisma', () => ({
  default: {},
}));

vi.mock('@utils/item/detectWearable', () => ({
  detectWearable: vi.fn(),
}));

import type { Items, ItemProcess } from '@prisma/generated/client';
import { buildNewItemFields, mergeItemProcessRows } from '@utils/item/processItemQueue';
import { mergeItemFieldKey } from '@utils/item/itemFieldMerge';

const itemProcess = (overrides: Partial<ItemProcess> = {}): ItemProcess =>
  ({
    internal_id: 1,
    item_id: null,
    name: 'Luperus Empty Trick-or-Treat Bag',
    description: null,
    image: 'https://images.neopets.com/items/tot_luperus_bag.gif',
    image_id: 'tot_luperus_bag',
    category: null,
    rarity: null,
    weight: null,
    isNC: false,
    isBD: false,
    type: 'np',
    est_val: null,
    specialType: null,
    status: null,
    releaseDate: null,
    retiredDate: null,
    isWearable: false,
    addedAt: new Date(),
    updatedAt: new Date(),
    ip_address: null,
    language: 'en',
    hash: null,
    manual_check: null,
    processed: false,
    meta: null,
    ...overrides,
  }) as ItemProcess;

describe('mergeItemProcessRows', () => {
  test('fills fields the base row is missing from sibling rows', () => {
    const base = itemProcess({ internal_id: 1, category: 'Special', weight: 1 });
    const siblings = [
      itemProcess({ internal_id: 2, item_id: 99975 }),
      itemProcess({ internal_id: 3, item_id: 11111, rarity: 101 }),
    ];

    const merged = mergeItemProcessRows(base, [base, ...siblings]);

    expect(merged.item_id).toBe(99975);
    expect(merged.rarity).toBe(101);
    expect(merged.category).toBe('Special');
    expect(merged.internal_id).toBe(1);
  });

  test('does not mutate the base row', () => {
    const base = itemProcess();

    mergeItemProcessRows(base, [itemProcess({ internal_id: 2, item_id: 99975 })]);

    expect(base.item_id).toBeNull();
  });
});

describe('ignored special types', () => {
  test('buildNewItemFields drops trading and auctioned', () => {
    const fields = buildNewItemFields(itemProcess({ specialType: 'trading,special' }), 'slug');

    expect(fields.specialType).toBe('special');
  });

  test('buildNewItemFields leaves specialType empty when only ignored ones exist', () => {
    const fields = buildNewItemFields(itemProcess({ specialType: 'auctioned,trading' }), 'slug');

    expect(fields.specialType).toBeUndefined();
  });

  test('merge does not copy ignored types into an item without a specialType', () => {
    const dbItem = { internal_id: 1, specialType: null } as Items;

    mergeItemFieldKey(dbItem, itemProcess({ specialType: 'trading,special' }), 'specialType');

    expect(dbItem.specialType).toBe('special');
  });
});
