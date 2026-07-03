import type { Items, ItemProcess } from '@prisma/generated/client';
import { formatFieldValue, normalizeText, wouldFieldChange } from '@utils/item/itemFieldMerge';

export { formatFieldValue, normalizeText };

export const DIFF_FIELDS = [
  'item_id',
  'name',
  'description',
  'image',
  'image_id',
  'category',
  'rarity',
  'weight',
  'type',
  'est_val',
  'isNC',
  'isBD',
  'isWearable',
] as const;

export type DiffField = (typeof DIFF_FIELDS)[number];

export type ItemProcessDiffEntry = {
  field: string;
  current: string;
  incoming: string;
  isConflict: boolean;
  rawCurrent: unknown;
  rawIncoming: unknown;
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

function getFieldValue(record: Items | ItemProcess, field: DiffField): unknown {
  return record[field as keyof typeof record];
}

function getRecordFieldValue(record: Items | ItemProcess, field: string): unknown {
  return record[field as keyof typeof record];
}

export function computeItemProcessDiff(
  db: Items,
  incoming: ItemProcess,
  conflictField: string | null
): ItemProcessDiffEntry[] {
  const changes: ItemProcessDiffEntry[] = [];

  for (const field of DIFF_FIELDS) {
    const rawCurrent = getFieldValue(db, field);
    const rawIncoming = getFieldValue(incoming, field);

    if (normalizeFieldValue(field, rawCurrent) === normalizeFieldValue(field, rawIncoming)) {
      continue;
    }

    const isConflict = field === conflictField;
    if (!wouldFieldChange(db, incoming, field) && !isConflict) {
      continue;
    }

    changes.push({
      field,
      current: formatFieldValue(rawCurrent),
      incoming: formatFieldValue(rawIncoming),
      isConflict,
      rawCurrent,
      rawIncoming,
    });
  }

  if (conflictField && !changes.some((change) => change.field === conflictField)) {
    const rawCurrent = getRecordFieldValue(db, conflictField);
    const rawIncoming = getRecordFieldValue(incoming, conflictField);

    if (
      normalizeFieldValue(conflictField, rawCurrent) !==
      normalizeFieldValue(conflictField, rawIncoming)
    ) {
      changes.unshift({
        field: conflictField,
        current: formatFieldValue(rawCurrent),
        incoming: formatFieldValue(rawIncoming),
        isConflict: true,
        rawCurrent,
        rawIncoming,
      });
    }
  }

  return changes;
}

export { wouldFieldChange };
