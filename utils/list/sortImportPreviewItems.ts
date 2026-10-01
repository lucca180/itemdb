import type { ImportPreviewItem } from '@app/[locale]/lists/import/importShared';
import type { ItemV2For } from '@types';
import { getSortPriceV2 } from '@utils/item/v2';

export type ImportSortKey =
  | 'name'
  | 'quantity'
  | 'price'
  | 'price_qty'
  | 'rarity'
  | 'item_id'
  | 'type';

export type ImportSortDir = 'asc' | 'desc';

export const IMPORT_SORT_KEYS: ImportSortKey[] = [
  'name',
  'quantity',
  'price',
  'price_qty',
  'rarity',
  'item_id',
  'type',
];

export function isImportSortKey(value: unknown): value is ImportSortKey {
  return typeof value === 'string' && (IMPORT_SORT_KEYS as string[]).includes(value);
}

function compareNumbers(a: number, b: number, sortDir: ImportSortDir): number {
  return sortDir === 'asc' ? a - b : b - a;
}

function compareStrings(a: string, b: string, sortDir: ImportSortDir): number {
  return sortDir === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
}

function getImportSortPrice(item: ItemV2For<'card'>, quantity: number, withQty: boolean): number {
  if (withQty) {
    const unit = getSortPriceV2(item);
    if (unit === -1 || unit === Infinity) return unit;
    return unit * quantity;
  }
  return getSortPriceV2(item);
}

/** Sort import preview rows — used by import v2 server actions. */
export function sortImportPreviewItems(
  items: ImportPreviewItem[],
  sortBy: ImportSortKey,
  sortDir: ImportSortDir
): ImportPreviewItem[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    const itemA = a.item;
    const itemB = b.item;

    if (sortBy === 'name') return compareStrings(itemA.name, itemB.name, sortDir);
    if (sortBy === 'quantity') return compareNumbers(a.quantity, b.quantity, sortDir);
    if (sortBy === 'price') {
      return compareNumbers(getSortPriceV2(itemA), getSortPriceV2(itemB), sortDir);
    }
    if (sortBy === 'price_qty') {
      return compareNumbers(
        getImportSortPrice(itemA, a.quantity, true),
        getImportSortPrice(itemB, b.quantity, true),
        sortDir
      );
    }
    if (sortBy === 'rarity') {
      return compareNumbers(itemA.rarity ?? 0, itemB.rarity ?? 0, sortDir);
    }
    if (sortBy === 'item_id') {
      return compareNumbers(itemA.item_id ?? 0, itemB.item_id ?? 0, sortDir);
    }
    if (sortBy === 'type') {
      const typeCmp = compareStrings(itemA.type, itemB.type, sortDir);
      if (typeCmp !== 0) return typeCmp;
      return compareStrings(itemA.name, itemB.name, 'asc');
    }
    return 0;
  });

  return sorted;
}
