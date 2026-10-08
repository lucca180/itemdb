/**
 * How imported quantities combine with items already in the target list.
 *
 * - `replace`: list amount becomes the imported amount (default).
 * - `sum`: imported amount is added to the list amount.
 * - `keep`: list amount is left untouched; new items get 1.
 */
export const IMPORT_QUANTITY_MODES = ['replace', 'sum', 'keep'] as const;

export type ImportQuantityMode = (typeof IMPORT_QUANTITY_MODES)[number];

export function isImportQuantityMode(value: unknown): value is ImportQuantityMode {
  return IMPORT_QUANTITY_MODES.includes(value as ImportQuantityMode);
}

/** List amount after the import, mirroring the upsert SQL. `current` is `null` for new items. */
export function resolveImportAmount(
  mode: ImportQuantityMode,
  current: number | null,
  imported: number
): number {
  if (mode === 'sum') return (current ?? 0) + imported;
  if (mode === 'keep') return current ?? 1;
  return imported;
}
