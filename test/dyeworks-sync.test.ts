import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import {
  expandDyeworksEntries,
  extractCategoriesLiteral,
  flattenDyeworksCategories,
  parseCategoriesLiteral,
  parseDyeworksHtml,
} from '@utils/dyeworks/parseCategories';
import {
  diffDyeworksListMembership,
  imageIdFromUrl,
  parseDyeworksEndDate,
} from '@utils/dyeworks/sync';

const fixtureHtml = readFileSync(join(__dirname, 'fixtures/dyeworks-categories.html'), 'utf8');

describe('parseDyeworksHtml', () => {
  test('extracts and flattens base items from categories', () => {
    const items = parseDyeworksHtml(fixtureHtml);
    expect(items.length).toBe(2);
    expect(items[0]).toMatchObject({
      item_id: 52790,
      name: 'Elegant Mutant Cape',
      categoryName: 'Accessories',
    });
    expect(items[0].colors.length).toBeGreaterThan(0);
    expect(items[0].colors[0]).toMatchObject({
      item_id: 70688,
      color: 'Green',
    });
  });

  test('throws when categories is missing', () => {
    expect(() => parseDyeworksHtml('<html></html>')).toThrow(/categories object not found/);
  });
});

describe('expandDyeworksEntries', () => {
  test('includes originals and color variants', () => {
    const items = parseDyeworksHtml(fixtureHtml);
    const entries = expandDyeworksEntries(items);
    const originals = entries.filter((e) => e.kind === 'original');
    const colors = entries.filter((e) => e.kind === 'color');

    expect(originals.map((e) => e.item_id).sort()).toEqual([52790, 57627]);
    expect(colors.length).toBeGreaterThan(0);
    expect(colors[0]).toMatchObject({
      item_id: 70688,
      kind: 'color',
      name: 'Dyeworks Green: Elegant Mutant Cape',
    });
  });

  test('preserves mm/dd end strings', () => {
    const items = parseDyeworksHtml(fixtureHtml);
    const withEnd = items.find((i) => i.end === '09/22');
    expect(withEnd).toBeTruthy();
    const entries = expandDyeworksEntries([withEnd!]);
    expect(entries.every((e) => e.end === '09/22')).toBe(true);
  });
});

describe('parseDyeworksEndDate', () => {
  test('parses mm/dd into UTC 18:00 series date', () => {
    const now = new Date(Date.UTC(2026, 7, 24)); // Aug 24 2026
    const end = parseDyeworksEndDate('09/22', now);
    expect(end?.toISOString()).toBe('2026-09-22T18:00:00.000Z');
  });

  test('uses next year when mm/dd has already passed', () => {
    const now = new Date(Date.UTC(2026, 9, 1)); // Oct 1 2026
    const end = parseDyeworksEndDate('09/22', now);
    expect(end?.toISOString()).toBe('2027-09-22T18:00:00.000Z');
  });

  test('returns null for missing end', () => {
    expect(parseDyeworksEndDate(null)).toBeNull();
    expect(parseDyeworksEndDate('nope')).toBeNull();
  });
});

describe('parseCategoriesLiteral', () => {
  test('evaluates unquoted JS object keys', () => {
    const literal = extractCategoriesLiteral(fixtureHtml);
    const categories = parseCategoriesLiteral(literal);
    const flat = flattenDyeworksCategories(categories);
    expect(flat.map((i) => i.item_id).sort()).toEqual([52790, 57627]);
  });
});

describe('diffDyeworksListMembership', () => {
  test('adds new iids and removes missing ones', () => {
    const { toAdd, toRemove } = diffDyeworksListMembership([1, 2, 3], [2, 4]);
    expect(toAdd.sort()).toEqual([1, 3]);
    expect(toRemove).toEqual([4]);
  });

  test('no-ops when sets match', () => {
    const { toAdd, toRemove } = diffDyeworksListMembership([1, 2], [1, 2]);
    expect(toAdd).toEqual([]);
    expect(toRemove).toEqual([]);
  });
});

describe('imageIdFromUrl', () => {
  test('extracts gif basename', () => {
    expect(imageIdFromUrl('https://images.neopets.com/items/mall_mutant_cape.gif')).toBe(
      'mall_mutant_cape'
    );
  });
});
