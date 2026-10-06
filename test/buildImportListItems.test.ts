import { describe, expect, it } from 'vitest';
import {
  buildImportListItems,
  importQuantity,
  type ImportApplyItem,
} from '@utils/list/buildImportListItems';
import { resolveImportAmount } from '@utils/list/importQuantityMode';

const item = (
  overrides: Partial<ImportApplyItem> & Pick<ImportApplyItem, 'internal_id' | 'name'>
): ImportApplyItem => ({
  item_id: overrides.item_id ?? overrides.internal_id,
  image: overrides.image ?? { id: `img-${overrides.internal_id}` },
  canonical_id: overrides.canonical_id ?? null,
  ...overrides,
});

describe('importQuantity', () => {
  it('reads the response key first and coerces numeric strings', () => {
    expect(
      importQuantity({ '10': '7' }, item({ internal_id: 10, name: 'Brush', item_id: 10 }), '10')
    ).toBe(7);
  });

  it('falls back to 1 when the session value is missing or invalid', () => {
    expect(importQuantity({}, item({ internal_id: 1, name: 'A' }), 'missing')).toBe(1);
    expect(importQuantity({ missing: 0 }, item({ internal_id: 1, name: 'A' }), 'missing')).toBe(1);
  });
});

describe('buildImportListItems', () => {
  it('uses session quantity for items without canonical_id', () => {
    const rows = buildImportListItems(
      [['101', item({ internal_id: 50, name: 'Apple', item_id: 101 })]],
      { 101: 4 },
      'replace'
    );

    expect(rows).toEqual([{ item_iid: '50', capValue: undefined, amount: '4', imported: true }]);
  });

  it('sums session quantities onto the canonical item and emits one row', () => {
    const canonical = 900;
    const rows = buildImportListItems(
      [
        ['1', item({ internal_id: 11, name: 'Red', item_id: 1, canonical_id: canonical })],
        ['2', item({ internal_id: 12, name: 'Blue', item_id: 2, canonical_id: canonical })],
      ],
      { 1: 2, 2: 3 },
      'replace'
    );

    expect(rows).toEqual([{ item_iid: '900', capValue: undefined, amount: '5', imported: true }]);
  });

  it('adds a clone quantity onto the canonical item when both are in the session', () => {
    const rows = buildImportListItems(
      [
        ['100', item({ internal_id: 100, name: 'Paint Brush', item_id: 100 })],
        [
          '101',
          item({
            internal_id: 101,
            name: 'Red Paint Brush',
            item_id: 101,
            canonical_id: 100,
          }),
        ],
      ],
      { 100: 3, 101: 7 },
      'replace'
    );

    expect(rows).toEqual([{ item_iid: '100', capValue: undefined, amount: '10', imported: true }]);
  });

  it('keeps unrelated items as separate rows', () => {
    const rows = buildImportListItems(
      [
        ['1', item({ internal_id: 1, name: 'A', item_id: 1 })],
        ['2', item({ internal_id: 2, name: 'B', item_id: 2 })],
      ],
      { 1: 1, 2: 8 },
      'replace'
    );

    expect(rows).toEqual([
      { item_iid: '1', capValue: undefined, amount: '1', imported: true },
      { item_iid: '2', capValue: undefined, amount: '8', imported: true },
    ]);
  });

  it('omits amount in keep mode so existing list amounts are kept', () => {
    const rows = buildImportListItems(
      [
        ['1', item({ internal_id: 11, name: 'Red', item_id: 1, canonical_id: 900 })],
        ['2', item({ internal_id: 12, name: 'Blue', item_id: 2, canonical_id: 900 })],
      ],
      { 1: 2, 2: 3 },
      'keep'
    );

    expect(rows).toEqual([
      { item_iid: '900', capValue: undefined, amount: undefined, imported: true },
    ]);
  });

  it('sends the imported amount in sum mode (the upsert adds it to the list)', () => {
    const rows = buildImportListItems(
      [['101', item({ internal_id: 50, name: 'Apple', item_id: 101 })]],
      { 101: 4 },
      'sum'
    );

    expect(rows).toEqual([{ item_iid: '50', capValue: undefined, amount: '4', imported: true }]);
  });
});

describe('resolveImportAmount', () => {
  it.each([
    ['replace', 2, 3, 3],
    ['replace', null, 3, 3],
    ['sum', 2, 3, 5],
    ['sum', null, 3, 3],
    ['keep', 2, 3, 2],
    ['keep', null, 3, 1],
  ] as const)('%s: list %s + imported %s → %s', (mode, current, imported, expected) => {
    expect(resolveImportAmount(mode, current, imported)).toBe(expected);
  });
});
