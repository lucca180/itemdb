import { describe, expect, it } from 'vitest';
import type { Items, ItemProcess } from '@prisma/generated/client';
import {
  computeItemProcessDiff,
  formatFieldValue,
  parseConflictField,
} from '@utils/manualCheck/itemProcessDiff';
import { normalizeText, wouldFieldChange } from '@utils/item/itemFieldMerge';

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

  it('changes est_val when db is empty and incoming has value', () => {
    const db = baseDb();
    db.est_val = null;
    const incoming = baseIncoming({ est_val: 50 });

    expect(wouldFieldChange(db, incoming, 'est_val')).toBe(true);
  });
});

describe('formatFieldValue', () => {
  it('decodes common HTML entities in text fields', () => {
    expect(formatFieldValue('Say &quot;hello&quot; &amp; &lt;goodbye&gt;')).toBe(
      'Say "hello" & <goodbye>'
    );
  });
});

describe('normalizeText', () => {
  it('decodes HTML entities before normalizing line endings', () => {
    expect(normalizeText('Say &quot;hello&quot;\r\nworld')).toBe('Say "hello"\nworld');
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
    expect(changes.some((change) => change.field === 'category' && change.isConflict)).toBe(true);
  });

  it('includes mergeable and hidden conflict fields in other differences', () => {
    const db = baseDb();
    db.isNC = false;
    db.specialType = 'wearable,Neocash';
    const incoming = baseIncoming({
      category: 'toy',
      isNC: true,
      specialType: 'no trade',
      manual_check: "'category' Merge Conflict with (1)",
    });

    const changes = computeItemProcessDiff(db, incoming, 'category');
    const otherFields = changes
      .filter((change) => !change.isConflict)
      .map((change) => change.field);

    expect(otherFields).toContain('isNC');
    expect(otherFields).toContain('specialType');
    expect(changes.find((change) => change.field === 'isNC')?.rawApplied).toBe(true);
    expect(changes.find((change) => change.field === 'specialType')?.rawApplied).toBe('no trade');
  });

  it('does not include fields blocked by force-merge defaults', () => {
    const db = baseDb();
    db.type = 'nc';
    const incoming = baseIncoming({ type: 'np', name: 'Changed Name' });

    const changes = computeItemProcessDiff(db, incoming, 'name');

    expect(changes.some((change) => change.field === 'type')).toBe(false);
  });

  it('includes excluded conflict field when it is the merge conflict', () => {
    const db = baseDb();
    db.specialType = 'wearable,Neocash';
    const incoming = baseIncoming({
      specialType: 'no trade',
      manual_check: "'specialType' Merge Conflict with (1)",
    });

    const changes = computeItemProcessDiff(db, incoming, 'specialType');
    const specialTypeChange = changes.find((change) => change.field === 'specialType');

    expect(specialTypeChange?.isConflict).toBe(true);
    expect(changes.some((change) => !change.isConflict)).toBe(false);
  });

  it('decodes HTML entities in description diff display', () => {
    const db = baseDb();
    db.description = 'Say &quot;hello&quot;';
    const incoming = baseIncoming({
      description: 'Say &quot;hello&quot; world',
      manual_check: "'description' Merge Conflict with (1)",
    });

    const changes = computeItemProcessDiff(db, incoming, 'description');
    const descriptionChange = changes.find((change) => change.field === 'description');

    expect(descriptionChange?.current).toBe('Say "hello"');
    expect(descriptionChange?.incoming).toBe('Say "hello" world');
  });
});
