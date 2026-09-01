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

export const IMPORT_V2_PAGE_SIZE = 30;

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
  items: ImportPreviewItem[];
  page: number;
  pageSize: number;
  totalFiltered: number;
  totalPages: number;
  /** Keys present in the import session. */
  totalCount: number;
  /** Session keys that did not resolve to an item. */
  notFoundCount: number;
  /** Summary over all resolved items (ignores current filter). */
  summary: ImportSummary;
  /** Summary over the filtered set (before pagination). */
  filteredSummary: ImportSummary;
  /** Bucket counts over all resolved items (for filter chips). */
  filterCounts: ImportFilterCounts;
};

export type ApplyListImportV2Input = ApplyListImportInput;
export type ApplyListImportV2Result = ApplyListImportResult;

export type {
  ImportAction,
  ImportErrorCode,
  ImportIgnore,
  ImportPreviewItem,
  ImportFilterType,
  ImportSortDir,
  ImportSortKey,
  ImportSummary,
  ImportFilterCounts,
};

export { IMPORT_ERROR, MAX_IMPORT_ITEMS };
