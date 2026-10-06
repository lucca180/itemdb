import type { ImportPreviewItem } from '@app/[locale]/lists/import/importShared';
import {
  IMPORT_ERROR,
  MAX_IMPORT_ITEMS,
  type ApplyListImportInput,
  type ApplyListImportResult,
  type ImportAction,
  type ImportErrorCode,
  type ImportIgnore,
} from '@app/[locale]/lists/import/importShared';
import type { ImportQuantityMode } from '@utils/list/importQuantityMode';
import type { ImportFilterCounts, ImportFilterType } from '@utils/list/filterImportPreviewItems';
import type { ImportSortDir, ImportSortKey } from '@utils/list/sortImportPreviewItems';
import type { ImportSummary } from '@utils/list/computeImportSummary';
import type { ImportItemBadge } from '@utils/list/importItemBadges';
import type { ImportAmbiguity } from '@utils/list/resolveImportItems';

export const IMPORT_V2_PAGE_SIZE = 30;

export type ImportPreviewItemV2 = ImportPreviewItem & {
  badges: ImportItemBadge[];
  /** Amount already in the target list; `null` when not in it or no list was given. */
  listAmount: number | null;
};

export type LoadImportItemsPageInput = {
  importToken: string;
  page: number;
  pageSize?: number;
  sortBy: ImportSortKey;
  sortDir: ImportSortDir;
  search?: string;
  filter?: ImportFilterType;
  /** Target list (owned by the user) to read current amounts from. */
  listId?: number;
};

export type ImportItemsPageResult = {
  items: ImportPreviewItemV2[];
  page: number;
  pageSize: number;
  totalFiltered: number;
  totalPages: number;
  /** Keys present in the import session. */
  totalCount: number;
  /** Session keys that did not resolve to an item. */
  notFoundCount: number;
  /** The session keys behind `notFoundCount`. */
  notFoundKeys: string[];
  /** Session keys matching several items we could not tell apart (not applied). */
  ambiguous: ImportAmbiguity[];
  /** Summary over all resolved items (ignores current filter). */
  summary: ImportSummary;
  /** Summary over the filtered set (before pagination). */
  filteredSummary: ImportSummary;
  /** Bucket counts over all resolved items (for filter chips). */
  filterCounts: ImportFilterCounts;
  /** Resolved items already in the target list; `null` when no list was given. */
  inListCount: number | null;
};

/**
 * Server action response. Expected failures come back as a code instead of being thrown,
 * since thrown server action errors reach the client with a redacted message in production.
 */
export type ImportActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ImportErrorCode };

/** Quantities are handled by `quantityMode` in v2. */
export type ImportIgnoreV2 = Exclude<ImportIgnore, 'quantity'>;

export type ApplyListImportV2Input = Omit<ApplyListImportInput, 'ignore'> & {
  ignore: ImportIgnoreV2[];
  quantityMode: ImportQuantityMode;
};
export type ApplyListImportV2Result = ApplyListImportResult & {
  /** Session keys skipped because they matched several items. */
  ambiguousCount: number;
};

export type {
  ImportAmbiguity,
  ImportAction,
  ImportErrorCode,
  ImportIgnore,
  ImportQuantityMode,
  ImportPreviewItem,
  ImportItemBadge,
  ImportFilterType,
  ImportSortDir,
  ImportSortKey,
  ImportSummary,
  ImportFilterCounts,
};

export { IMPORT_ERROR, MAX_IMPORT_ITEMS };
