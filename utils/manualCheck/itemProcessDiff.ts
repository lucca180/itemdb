import type { Items, ItemProcess } from '@prisma/generated/client';
import {
  formatFieldValue,
  getMergedFieldValue,
  normalizeText,
  wouldFieldChange,
  wouldFieldConflict,
} from '@utils/item/itemFieldMerge';

export { formatFieldValue, normalizeText };

const MERGE_SKIP_KEYS = new Set(['internal_id', 'addedAt', 'updatedAt', 'hash']);

export type ItemProcessDiffEntry = {
  field: string;
  current: string;
  incoming: string;
  isConflict: boolean;
  rawCurrent: unknown;
  rawIncoming: unknown;
  rawApplied: unknown;
};

export function parseConflictField(manualCheck: string | null | undefined): string | null {
  if (!manualCheck) return null;
  const match = manualCheck.match(/^'(\w+)' Merge Conflict/);
  return match?.[1] ?? null;
}

function normalizeFieldValue(field: string, value: unknown): string {
  const formatted = formatFieldValue(value);
  if (field === 'description') return normalizeText(formatted);
  return formatted.trim();
}

function getRecordFieldValue(record: Items | ItemProcess, field: string): unknown {
  return record[field as keyof typeof record];
}

function getAppliedValue(db: Items, incoming: ItemProcess, field: keyof Items): unknown {
  if (wouldFieldConflict(db, incoming, field)) {
    return incoming[field as keyof ItemProcess] ?? null;
  }

  return getMergedFieldValue(db, incoming, field);
}

function shouldIncludeOtherField(
  db: Items,
  incoming: ItemProcess,
  field: keyof Items,
  conflictField: string | null
): boolean {
  if (field === conflictField) return false;
  if (MERGE_SKIP_KEYS.has(field as string)) return false;

  return wouldFieldChange(db, incoming, field) || wouldFieldConflict(db, incoming, field);
}

function buildDiffEntry(
  db: Items,
  incoming: ItemProcess,
  field: string,
  isConflict: boolean
): ItemProcessDiffEntry {
  const key = field as keyof Items;
  const rawCurrent = db[key];
  const rawIncoming = getRecordFieldValue(incoming, field);
  const rawApplied = isConflict ? rawIncoming : getAppliedValue(db, incoming, key);

  return {
    field,
    current: formatFieldValue(rawCurrent),
    incoming: formatFieldValue(rawIncoming),
    isConflict,
    rawCurrent,
    rawIncoming,
    rawApplied,
  };
}

export function computeItemProcessDiff(
  db: Items,
  incoming: ItemProcess,
  conflictField: string | null
): ItemProcessDiffEntry[] {
  const changes: ItemProcessDiffEntry[] = [];

  if (conflictField) {
    const rawCurrent = getRecordFieldValue(db, conflictField);
    const rawIncoming = getRecordFieldValue(incoming, conflictField);

    if (
      normalizeFieldValue(conflictField, rawCurrent) !==
      normalizeFieldValue(conflictField, rawIncoming)
    ) {
      changes.push(buildDiffEntry(db, incoming, conflictField, true));
    }
  }

  for (const key of Object.keys(db) as Array<keyof Items>) {
    if (!shouldIncludeOtherField(db, incoming, key, conflictField)) continue;

    changes.push(buildDiffEntry(db, incoming, String(key), false));
  }

  return changes;
}
