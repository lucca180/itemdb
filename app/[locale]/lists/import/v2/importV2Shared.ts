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
import type { ImportFilterCounts, ImportFilterType } from '@utils/list/filterImportPreviewItems';
import type { ImportSortDir, ImportSortKey } from '@utils/list/sortImportPreviewItems';
import type { ImportSummary } from '@utils/list/computeImportSummary';
import type { ImportItemBadge } from '@utils/list/importItemBadges';
import type { ImportAmbiguity } from '@utils/list/resolveImportItems';

export const IMPORT_V2_PAGE_SIZE = 30;

export type ImportPreviewItemV2 = ImportPreviewItem & { badges: ImportItemBadge[] };

export type LoadImportItemsPageInput = {
  importToken: string;
  page: number;
  pageSize?: number;
  sortBy: ImportSortKey;
  sortDir: ImportSortDir;
  search?: string;
  filter?: ImportFilterType;
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
};

/**
 * Server action response. Expected failures come back as a code instead of being thrown,
 * since thrown server action errors reach the client with a redacted message in production.
 */
export type ImportActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ImportErrorCode };

export type ApplyListImportV2Input = ApplyListImportInput;
export type ApplyListImportV2Result = ApplyListImportResult & {
  /** Session keys skipped because they matched several items. */
  ambiguousCount: number;
};

export type {
  ImportAmbiguity,
  ImportAction,
  ImportErrorCode,
  ImportIgnore,
  ImportPreviewItem,
  ImportItemBadge,
  ImportFilterType,
  ImportSortDir,
  ImportSortKey,
  ImportSummary,
  ImportFilterCounts,
};

export { IMPORT_ERROR, MAX_IMPORT_ITEMS };
