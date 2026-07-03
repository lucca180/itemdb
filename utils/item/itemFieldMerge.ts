import type { Items, ItemProcess } from '@prisma/generated/client';
import { categoryToShopID } from '@utils/utils';
import { decodeHtmlEntities } from '@utils/text/decodeHtmlEntities';

export const GENERIC_CATS = ['special', 'gift', 'food', 'clothes', 'neogarden', 'neohome', 'none'];

export const FORCE_MERGE_FIELDS = [
  'type',
  'isNC',
  'isWearable',
  'status',
  'est_val',
  'isBD',
] as const;

export type ForceMergeField = (typeof FORCE_MERGE_FIELDS)[number];

export type MergeItemFieldResult = 'done' | 'continue';

export const isSubset = (arr: unknown[], target: unknown[]) => target.every((v) => arr.includes(v));

export const ITEM_TEXT_DECODE_FIELDS = ['name', 'description'] as const;

export function normalizeText(str: string): string {
  return decodeHtmlEntities(str).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

export function decodeItemTextFields<T extends Items | ItemProcess>(record: T): T {
  const decoded = { ...record };

  for (const field of ITEM_TEXT_DECODE_FIELDS) {
    const value = decoded[field as keyof T];
    if (typeof value === 'string') {
      (decoded as Record<string, unknown>)[field] = decodeHtmlEntities(value);
    }
  }

  return decoded;
}

export function cleanSpecialType(specialType: string): string {
  const skipTypes = ['trading', 'auctioned'];

  return specialType
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter((x) => !skipTypes.includes(x))
    .join(',');
}

function mergeSpecialType(dbItem: Items, incoming: ItemProcess): void {
  const cleanedDb = cleanSpecialType(dbItem.specialType ?? '');
  const cleanedItem = cleanSpecialType(incoming.specialType ?? '');

  const dbArr = cleanedDb.split(',').map((x) => x.trim().toLowerCase());
  const itemArr = cleanedItem.split(',').map((x) => x.trim().toLowerCase());

  if (dbArr.length > itemArr.length && !isSubset(dbArr, itemArr)) {
    throw `'specialType' Merge Conflict with (${dbItem.internal_id})`;
  }

  if (dbArr.length < itemArr.length && isSubset(itemArr, dbArr)) {
    dbItem.specialType = cleanedItem;
  }
}

function mergeForceMergeField(dbItem: Items, incoming: ItemProcess, key: ForceMergeField): void {
  if (
    (key == 'status' && dbItem.status == 'active') ||
    (key == 'type' && dbItem.type == 'np') ||
    (key == 'est_val' && dbItem.est_val)
  ) {
    // @ts-expect-error dynamic field assignment mirrors process.ts
    dbItem[key] = incoming[key];
  }

  // @ts-expect-error dynamic field assignment mirrors process.ts
  dbItem[key] ||= incoming[key] ?? dbItem[key];
}

function mergeDescription(dbItem: Items, incoming: ItemProcess): MergeItemFieldResult {
  if (!incoming.description || !dbItem.description) return 'done';

  const dbDescNorm = normalizeText(dbItem.description);
  const itemDescNorm = normalizeText(incoming.description);

  if (dbDescNorm === itemDescNorm) return 'continue';

  if (dbDescNorm.trim().length < itemDescNorm.trim().length) {
    if (itemDescNorm.trim().includes(dbDescNorm.trim())) {
      dbItem.description = itemDescNorm.trim();
      return 'done';
    }

    throw `'description' Merge Conflict with (${dbItem.internal_id})`;
  }

  return 'done';
}

function mergeCategory(dbItem: Items, incoming: ItemProcess): void {
  const dbCategory = dbItem.category?.toLowerCase() ?? '';
  const itemCategory = incoming.category?.toLowerCase() ?? '';

  if (
    GENERIC_CATS.includes(dbCategory) &&
    !GENERIC_CATS.includes(itemCategory) &&
    !categoryToShopID[dbCategory] &&
    categoryToShopID[itemCategory]
  ) {
    dbItem.category = incoming.category;
    return;
  }

  if (
    itemCategory !== dbCategory &&
    categoryToShopID[itemCategory] &&
    categoryToShopID[dbCategory] &&
    !GENERIC_CATS.includes(itemCategory)
  ) {
    throw `'category' Merge Conflict with (${dbItem.internal_id})`;
  }
}

/**
 * Applies the same per-field merge step used in pages/api/v1/items/process.ts.
 * Mutates dbItem in place. Throws merge conflict strings when the process would.
 */
export function mergeItemFieldKey(
  dbItem: Items,
  incoming: ItemProcess,
  key: keyof Items
): MergeItemFieldResult {
  if (!dbItem[key]) {
    // @ts-expect-error dynamic field assignment mirrors process.ts
    dbItem[key] ||= incoming[key as keyof ItemProcess] ?? dbItem[key];
  }

  if (
    dbItem[key] &&
    incoming[key as keyof ItemProcess] &&
    dbItem[key] !== incoming[key as keyof ItemProcess]
  ) {
    if (key === 'specialType') {
      mergeSpecialType(dbItem, incoming);
    } else if (FORCE_MERGE_FIELDS.includes(key as ForceMergeField)) {
      mergeForceMergeField(dbItem, incoming, key as ForceMergeField);
    } else if (key === 'description') {
      return mergeDescription(dbItem, incoming);
    } else if (key === 'category') {
      mergeCategory(dbItem, incoming);
    } else {
      throw `'${key}' Merge Conflict with (${dbItem.internal_id})`;
    }
  }

  return 'done';
}

/**
 * Returns the field value after merge without throwing. On conflict, returns the current db value.
 */
export function getMergedFieldValue(db: Items, incoming: ItemProcess, field: keyof Items): unknown {
  const dbClone = { ...db };

  try {
    mergeItemFieldKey(dbClone, incoming, field);
    return dbClone[field];
  } catch {
    return db[field];
  }
}

export function wouldFieldChange(db: Items, incoming: ItemProcess, field: keyof Items): boolean {
  const dbValue = db[field];
  const merged = getMergedFieldValue(db, incoming, field);
  return normalizeFieldValue(String(field), dbValue) !== normalizeFieldValue(String(field), merged);
}

export function wouldFieldConflict(db: Items, incoming: ItemProcess, field: keyof Items): boolean {
  const dbClone = { ...db };

  try {
    mergeItemFieldKey(dbClone, incoming, field);
    return false;
  } catch (error) {
    return typeof error === 'string' && error.includes('Merge Conflict');
  }
}

function normalizeFieldValue(field: string, value: unknown): string {
  const formatted = formatFieldValue(value);
  if (field === 'description') return normalizeText(formatted);
  return formatted.trim();
}

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return String(value);
  return decodeHtmlEntities(String(value));
}
