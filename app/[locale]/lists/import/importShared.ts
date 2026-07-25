import type { ItemV2For } from '@types';

/** Hard cap for a single import session/apply. */
export const MAX_IMPORT_ITEMS = 10_000;

export const IMPORT_ERROR = {
  TOO_LARGE: 'IMPORT_TOO_LARGE',
  EMPTY: 'IMPORT_EMPTY',
  INVALID_TYPE: 'IMPORT_INVALID_TYPE',
  EXPIRED: 'IMPORT_EXPIRED',
  UNAUTHORIZED: 'IMPORT_UNAUTHORIZED',
  FORBIDDEN_ACTION: 'IMPORT_FORBIDDEN_ACTION',
  LIST_NOT_FOUND: 'IMPORT_LIST_NOT_FOUND',
  NO_ITEMS: 'IMPORT_NO_ITEMS',
} as const;

export type ImportErrorCode = (typeof IMPORT_ERROR)[keyof typeof IMPORT_ERROR];

export type ImportPreviewItem = {
  key: string;
  item: ItemV2For<'card'>;
  quantity: number;
};

export type ImportPreview = {
  items: ImportPreviewItem[];
  totalCount: number;
};

export type ImportAction = 'add' | 'remove' | 'hide';
export type ImportIgnore = 'np' | 'nc' | 'quantity';

export type ApplyListImportInput = {
  importToken: string;
  listId: number;
  action: ImportAction;
  ignore: ImportIgnore[];
};

export type ApplyListImportResult = {
  listPath: string;
  processedCount: number;
  notFoundCount: number;
};
