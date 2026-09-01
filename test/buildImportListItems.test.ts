import { describe, expect, it } from 'vitest';
import {
  buildImportListItems,
  importQuantity,
  type ImportApplyItem,
} from '@utils/list/buildImportListItems';

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
      false
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
      false
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
      false
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
      false
    );

    expect(rows).toEqual([
      { item_iid: '1', capValue: undefined, amount: '1', imported: true },
      { item_iid: '2', capValue: undefined, amount: '8', imported: true },
    ]);
  });

  it('sets amount to 1 per unique item when ignoring quantities', () => {
    const rows = buildImportListItems(
      [
        ['1', item({ internal_id: 11, name: 'Red', item_id: 1, canonical_id: 900 })],
        ['2', item({ internal_id: 12, name: 'Blue', item_id: 2, canonical_id: 900 })],
      ],
      { 1: 2, 2: 3 },
      true
    );

    expect(rows).toEqual([{ item_iid: '900', capValue: undefined, amount: '1', imported: true }]);
  });
});
