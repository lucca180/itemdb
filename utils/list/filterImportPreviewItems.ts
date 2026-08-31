import type { ImportPreviewItem } from '@app/[locale]/lists/import/importShared';
import { getNpPriceValue } from '@utils/item/v2';

export type ImportFilterType = 'all' | 'np' | 'nc' | 'pb' | 'unpriced';

export function isImportFilterType(value: unknown): value is ImportFilterType {
  return (
    value === 'all' || value === 'np' || value === 'nc' || value === 'pb' || value === 'unpriced'
  );
}

function isUnpriced(item: ImportPreviewItem['item']): boolean {
  if (item.type === 'np' || item.type === 'pb') {
    return getNpPriceValue(item.price) === null;
  }
  if (item.type === 'nc') {
    return !item.price && !item.ncValue;
  }
  return false;
}

export type ImportFilterCounts = {
  all: number;
  np: number;
  nc: number;
  pb: number;
  unpriced: number;
};

export function countImportFilterBuckets(items: ImportPreviewItem[]): ImportFilterCounts {
  let np = 0;
  let nc = 0;
  let pb = 0;
  let unpriced = 0;

  for (const { item } of items) {
    if (item.type === 'np') np += 1;
    else if (item.type === 'nc') nc += 1;
    else if (item.type === 'pb') pb += 1;
    if (isUnpriced(item)) unpriced += 1;
  }

  return { all: items.length, np, nc, pb, unpriced };
}

export function filterImportPreviewItems(
  items: ImportPreviewItem[],
  opts: { search?: string; filter?: ImportFilterType }
): ImportPreviewItem[] {
  let result = items;
  const search = opts.search?.trim().toLowerCase();
  const filter = opts.filter ?? 'all';

  if (search) {
    result = result.filter(
      ({ item }) =>
        item.name.toLowerCase().includes(search) ||
        (item.category?.toLowerCase().includes(search) ?? false) ||
        (item.item_id != null && String(item.item_id).includes(search))
    );
  }

  if (filter === 'np') result = result.filter(({ item }) => item.type === 'np');
  else if (filter === 'nc') result = result.filter(({ item }) => item.type === 'nc');
  else if (filter === 'pb') result = result.filter(({ item }) => item.type === 'pb');
  else if (filter === 'unpriced') result = result.filter(({ item }) => isUnpriced(item));

  return result;
}
