import type { PutListItemInput } from '@services/list/listItemsWrite';
import type { ListImportSession } from '@utils/list/importSession';

type ImportQuantitySource = ListImportSession['items'] | Record<string | number, unknown>;

export type ImportQuantityLookupItem = {
  item_id: number | null;
  name: string;
  image: { id: string };
};

export type ImportApplyItem = ImportQuantityLookupItem & {
  internal_id: number;
  canonical_id: number | null;
};

function toPositiveAmount(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

/** Session quantity for a resolved item, falling back through common lookup keys. */
export function importQuantity(
  source: ImportQuantitySource,
  item: ImportQuantityLookupItem,
  responseKey: string
): number {
  const raw =
    source[responseKey] ??
    source[item.item_id ?? -1] ??
    source[item.name] ??
    source[item.image.id] ??
    source[`${item.name},${item.image.id}`] ??
    1;

  return toPositiveAmount(raw) ?? 1;
}

/**
 * Collapse resolved import rows onto list `item_iid`s.
 * Clones (`canonical_id`) share the canonical item; amounts are summed from session qty.
 */
export function buildImportListItems(
  entries: Array<[string, ImportApplyItem]>,
  sessionItems: ImportQuantitySource,
  ignoreQuantity: boolean
): PutListItemInput[] {
  const amounts = new Map<number, number>();

  for (const [responseKey, item] of entries) {
    const iid = item.canonical_id ?? item.internal_id;
    const qty = importQuantity(sessionItems, item, responseKey);
    amounts.set(iid, (amounts.get(iid) ?? 0) + qty);
  }

  return [...amounts.entries()].map(([iid, amount]) => ({
    item_iid: String(iid),
    capValue: undefined,
    amount: String(ignoreQuantity ? 1 : amount),
    imported: true,
  }));
}
