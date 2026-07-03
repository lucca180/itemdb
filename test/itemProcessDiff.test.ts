import { describe, expect, it } from 'vitest';
import type { Items, ItemProcess } from '@prisma/generated/client';
import {
  computeItemProcessDiff,
  parseConflictField,
  wouldFieldChange,
} from '@utils/manualCheck/itemProcessDiff';

const baseDb = (): Items =>
  ({
    internal_id: 1,
    item_id: 100,
    name: 'Test Item',
    description: 'Old description',
    image: 'https://images.neopets.com/items/old.gif',
    image_id: 'old',
    category: 'food',
    rarity: 50,
    weight: 1,
    type: 'np',
    est_val: 100,
    specialType: null,
    releaseDate: null,
    retiredDate: null,
    status: 'active',
    comment: null,
    slug: 'test-item',
    addedAt: new Date(),
    updatedAt: new Date(),
    isNC: true,
    isWearable: true,
    isNeohome: false,
    isBD: true,
    canRead: 'unknown',
    canEat: 'unknown',
    canPlay: 'unknown',
    canOpen: 'unknown',
    imgCacheOverride: null,
    flags: null,
    parent_iid: null,
    canonical_id: null,
  }) as Items;

const baseIncoming = (overrides: Partial<ItemProcess> = {}): ItemProcess =>
  ({
    internal_id: 99,
    item_id: 100,
    name: 'Test Item',
    description: 'Old description',
    image: 'https://images.neopets.com/items/old.gif',
    image_id: 'old',
    category: 'food',
    rarity: 50,
    weight: 1,
    type: 'np',
    est_val: 100,
    specialType: null,
    releaseDate: null,
    retiredDate: null,
    status: 'active',
    isNC: true,
    isBD: true,
    isWearable: true,
    addedAt: new Date(),
    updatedAt: new Date(),
    ip_address: null,
    language: 'en',
    hash: null,
    manual_check: "'category' Merge Conflict with (1)",
    processed: false,
    meta: null,
    ...overrides,
  }) as ItemProcess;

describe('parseConflictField', () => {
  it('parses merge conflict field name', () => {
    expect(parseConflictField("'category' Merge Conflict with (12345)")).toBe('category');
  });

  it('returns null for invalid strings', () => {
    expect(parseConflictField('inflation')).toBeNull();
    expect(parseConflictField(null)).toBeNull();
  });
});

describe('wouldFieldChange', () => {
  it('does not change isNC when db is true and incoming is false', () => {
    const db = baseDb();
    const incoming = baseIncoming({ isNC: false });

    expect(wouldFieldChange(db, incoming, 'isNC')).toBe(false);
  });

  it('changes isNC when db is false and incoming is true', () => {
    const db = baseDb();
    db.isNC = false;
    const incoming = baseIncoming({ isNC: true });

    expect(wouldFieldChange(db, incoming, 'isNC')).toBe(true);
  });

  it('does not change type when db is nc and incoming is np', () => {
    const db = baseDb();
    db.type = 'nc';
    const incoming = baseIncoming({ type: 'np' });

    expect(wouldFieldChange(db, incoming, 'type')).toBe(false);
  });

  it('changes type when db is np and incoming is nc', () => {
    const db = baseDb();
    db.type = 'np';
    const incoming = baseIncoming({ type: 'nc' });

    expect(wouldFieldChange(db, incoming, 'type')).toBe(true);
  });

  it('changes est_val when db has a value and incoming differs', () => {
    const db = baseDb();
    const incoming = baseIncoming({ est_val: 200 });

    expect(wouldFieldChange(db, incoming, 'est_val')).toBe(true);
  });

  it('changes est_val when db is empty and incoming has value', () => {
    const db = baseDb();
    db.est_val = null;
    const incoming = baseIncoming({ est_val: 50 });

    expect(wouldFieldChange(db, incoming, 'est_val')).toBe(true);
  });
});

describe('computeItemProcessDiff', () => {
  it('omits equal fields', () => {
    const db = baseDb();
    const incoming = baseIncoming();

    expect(computeItemProcessDiff(db, incoming, 'category')).toEqual([]);
  });

  it('omits isNC when incoming false would not overwrite db true', () => {
    const db = baseDb();
    const incoming = baseIncoming({ isNC: false, category: 'toy' });

    const changes = computeItemProcessDiff(db, incoming, 'category');

    expect(changes.some((change) => change.field === 'isNC')).toBe(false);
    expect(changes.some((change) => change.field === 'category')).toBe(true);
  });

  it('includes isNC when db false and incoming true', () => {
    const db = baseDb();
    db.isNC = false;
    const incoming = baseIncoming({ isNC: true, name: 'Changed Name' });

    const changes = computeItemProcessDiff(db, incoming, 'name');

    expect(changes.some((change) => change.field === 'isNC')).toBe(true);
  });

  it('never includes excluded fields', () => {
    const db = baseDb();
    const incoming = baseIncoming({
      specialType: 'wearable',
      status: 'no trade',
      releaseDate: new Date('2020-01-01'),
      retiredDate: new Date('2021-01-01'),
      category: 'toy',
    });

    const changes = computeItemProcessDiff(db, incoming, 'category');
    const fields = changes.map((change) => change.field);

    expect(fields).not.toContain('specialType');
    expect(fields).not.toContain('status');
    expect(fields).not.toContain('releaseDate');
    expect(fields).not.toContain('retiredDate');
  });

  it('always includes conflict field when values differ', () => {
    const db = baseDb();
    const incoming = baseIncoming({ category: 'toy' });

    const changes = computeItemProcessDiff(db, incoming, 'category');
    const categoryChange = changes.find((change) => change.field === 'category');

    expect(categoryChange?.isConflict).toBe(true);
    expect(categoryChange?.current).toBe('food');
    expect(categoryChange?.incoming).toBe('toy');
  });
});
