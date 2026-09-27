'use server';

import { updateTag } from 'next/cache';
import { parseManyItemsV2Query } from '@app/api/v2/items/parse';
import { type FindManyItemsV2Query, type FindManyItemsV2Type } from '@app/server/items/v2';
import { ItemService } from '@services/ItemService';
import { ListService } from '@services/ListService';
import { listMutationCacheTags } from '@utils/appCacheTags';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { buildImportListItems, importQuantity } from '@utils/list/buildImportListItems';
import { computeImportSummary } from '@utils/list/computeImportSummary';
import {
  countImportFilterBuckets,
  filterImportPreviewItems,
  isImportFilterType,
} from '@utils/list/filterImportPreviewItems';
import { getImportItemBadges } from '@utils/list/importItemBadges';
import { resolveImportRecommendedListId } from '@utils/list/importMeta';
import { getListImportSession, type ListImportSession } from '@utils/list/importSession';
import {
  isImportSortKey,
  sortImportPreviewItems,
  type ImportSortDir,
} from '@utils/list/sortImportPreviewItems';
import {
  isAmbiguousImportLookupType,
  resolveImportItems,
  type ImportAmbiguity,
} from '@utils/list/resolveImportItems';
import prisma from '@utils/prisma';
import type { ItemV2For } from '@types';
import { dynamicListCan } from '@utils/utils';
import {
  IMPORT_ERROR,
  IMPORT_V2_PAGE_SIZE,
  MAX_IMPORT_ITEMS,
  type ApplyListImportV2Input,
  type ApplyListImportV2Result,
  type ImportActionResult,
  type ImportErrorCode,
  type ImportItemsPageResult,
  type ImportPreviewItem,
  type LoadImportItemsPageInput,
} from './importV2Shared';

/** Expected import failure; turned into `{ success: false, error }` by {@link toImportResult}. */
class ImportError extends Error {
  code: ImportErrorCode;

  constructor(code: ImportErrorCode) {
    super(code);
    this.name = 'ImportError';
    this.code = code;
  }
}

function throwImportError(code: ImportErrorCode): never {
  throw new ImportError(code);
}

/** Returns expected failures as codes; unexpected errors are rethrown (logged server-side). */
async function toImportResult<T>(run: () => Promise<T>): Promise<ImportActionResult<T>> {
  try {
    return { success: true, data: await run() };
  } catch (error) {
    if (error instanceof ImportError) return { success: false, error: error.code };
    throw error;
  }
}

function isLookupType(value: unknown): value is FindManyItemsV2Type {
  return (
    value === 'id' ||
    value === 'item_id' ||
    value === 'name_image_id' ||
    value === 'image_id' ||
    value === 'name' ||
    value === 'slug'
  );
}

function buildImportQuery(
  session: ListImportSession,
  limit = MAX_IMPORT_ITEMS
): FindManyItemsV2Query {
  if (!isLookupType(session.indexType)) {
    throwImportError(IMPORT_ERROR.INVALID_TYPE);
  }

  const keys = Object.keys(session.items);
  if (!keys.length) throwImportError(IMPORT_ERROR.EMPTY);
  if (keys.length > MAX_IMPORT_ITEMS) throwImportError(IMPORT_ERROR.TOO_LARGE);

  const selectedKeys = keys.slice(0, limit);
  const query =
    session.indexType === 'name_image_id'
      ? {
          type: 'name_image_id' as const,
          data: selectedKeys.map((key) => {
            const parts = key.split(/,(?=[^,]*$)/);
            return [parts[0] ?? '', parts[1] ?? ''] as [string, string];
          }),
        }
      : {
          type: session.indexType,
          data: selectedKeys,
        };

  const parsed = parseManyItemsV2Query(query as unknown as Record<string, unknown>);
  if (!parsed) throwImportError(IMPORT_ERROR.INVALID_TYPE);
  return parsed;
}

async function requireImportSession(importToken: string) {
  const session = await getListImportSession(importToken);
  if (!session) throwImportError(IMPORT_ERROR.EXPIRED);
  return session;
}

/**
 * Resolves every session key to items. Keys that can match several items
 * (image / name) go through {@link resolveImportItems} so shared keys are either
 * disambiguated or reported as ambiguous instead of silently collapsing to one item.
 */
async function lookupImportItems<I extends 'card' | 'full'>(
  session: ListImportSession,
  intent: I,
  withAmbiguousItems = false
): Promise<{
  data: Record<string, ItemV2For<I>>;
  ambiguous: ImportAmbiguity[];
  notFoundKeys: string[];
}> {
  const query = buildImportQuery(session);
  const keys = Object.keys(session.items);

  if (!isAmbiguousImportLookupType(query.type)) {
    const data = await ItemService.getManyItems(query, { intent, limit: MAX_IMPORT_ITEMS });
    // Unique lookups key the response by the looked-up value.
    const found = new Set(Object.keys(data).map((key) => key.toLowerCase()));
    const notFoundKeys = keys.filter((key) => !found.has(key.toLowerCase()));
    return { data, ambiguous: [], notFoundKeys };
  }

  const recommendedListId = await resolveImportRecommendedListId({
    meta: session.meta,
    list_id: session.list_id,
  });

  return resolveImportItems({
    indexType: query.type,
    keys,
    keyCounts: session.meta?.keyCounts,
    recommendedListId,
    intent,
    withAmbiguousItems,
  });
}

async function resolveImportPreviewItems(session: ListImportSession): Promise<{
  items: ImportPreviewItem[];
  totalCount: number;
  notFoundKeys: string[];
  ambiguous: ImportAmbiguity[];
}> {
  const totalCount = Object.keys(session.items).length;
  if (totalCount > MAX_IMPORT_ITEMS) throwImportError(IMPORT_ERROR.TOO_LARGE);

  const { data, ambiguous, notFoundKeys } = await lookupImportItems(session, 'card', true);

  const items = Object.entries(data).map(([key, item]) => ({
    key,
    item,
    quantity: importQuantity(session.items, item, key),
  }));

  return { items, totalCount, notFoundKeys, ambiguous };
}

function clampPageSize(pageSize: number | undefined): number {
  if (!pageSize || !Number.isFinite(pageSize)) return IMPORT_V2_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(pageSize), 1), IMPORT_V2_PAGE_SIZE);
}

export async function loadImportItemsPage(
  input: LoadImportItemsPageInput
): Promise<ImportActionResult<ImportItemsPageResult>> {
  return toImportResult(() => loadImportItemsPageData(input));
}

/** Parallel copy of applyListImport for v2 — consolidate on switch. */
export async function applyListImportV2(
  input: ApplyListImportV2Input
): Promise<ImportActionResult<ApplyListImportV2Result>> {
  return toImportResult(() => applyImport(input));
}

async function loadImportItemsPageData(
  input: LoadImportItemsPageInput
): Promise<ImportItemsPageResult> {
  if (!input?.importToken) throwImportError(IMPORT_ERROR.INVALID_TYPE);
  if (!isImportSortKey(input.sortBy)) throwImportError(IMPORT_ERROR.INVALID_TYPE);

  const sortDir: ImportSortDir = input.sortDir === 'asc' ? 'asc' : 'desc';
  const filter = isImportFilterType(input.filter) ? input.filter : 'all';
  const pageSize = clampPageSize(input.pageSize);
  const page = Math.max(1, Math.floor(input.page) || 1);

  const session = await requireImportSession(input.importToken);
  const resolved = await resolveImportPreviewItems(session);
  const summary = computeImportSummary(resolved.items);
  const filterCounts = countImportFilterBuckets(resolved.items);

  const filtered = filterImportPreviewItems(resolved.items, {
    search: input.search,
    filter,
  });
  const sorted = sortImportPreviewItems(filtered, input.sortBy, sortDir);
  const filteredSummary = computeImportSummary(sorted);

  const totalFiltered = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);
  const badges = await getImportItemBadges(pageItems);

  return {
    items: pageItems.map((entry) => ({
      ...entry,
      badges: badges.get(entry.item.internal_id) ?? [],
    })),
    page: safePage,
    pageSize,
    totalFiltered,
    totalPages,
    totalCount: resolved.totalCount,
    notFoundCount: resolved.notFoundKeys.length,
    notFoundKeys: resolved.notFoundKeys,
    ambiguous: resolved.ambiguous,
    summary,
    filteredSummary,
    filterCounts,
  };
}

async function applyImport(input: ApplyListImportV2Input): Promise<ApplyListImportV2Result> {
  const { user } = await getServerCurrentUser();
  if (!user || user.banned) throwImportError(IMPORT_ERROR.UNAUTHORIZED);

  if (
    !input ||
    !Number.isSafeInteger(input.listId) ||
    input.listId <= 0 ||
    !['add', 'remove', 'hide'].includes(input.action) ||
    !Array.isArray(input.ignore) ||
    input.ignore.some((value) => !['np', 'nc', 'quantity'].includes(value))
  ) {
    throwImportError(IMPORT_ERROR.INVALID_TYPE);
  }

  const [session, list] = await Promise.all([
    requireImportSession(input.importToken),
    prisma.userList.findUnique({
      where: { internal_id: input.listId },
      include: { user: true },
    }),
  ]);

  if (!list) throwImportError(IMPORT_ERROR.LIST_NOT_FOUND);
  if (list.user_id !== user.id && !user.isAdmin) {
    throwImportError(IMPORT_ERROR.UNAUTHORIZED);
  }

  const listForPermission = { dynamicType: list.dynamicType };
  if (input.action === 'add' && !dynamicListCan(listForPermission, 'add')) {
    throwImportError(IMPORT_ERROR.FORBIDDEN_ACTION);
  }
  if (input.action === 'remove' && !dynamicListCan(listForPermission, 'remove')) {
    throwImportError(IMPORT_ERROR.FORBIDDEN_ACTION);
  }

  const { data, ambiguous, notFoundKeys } = await lookupImportItems(session, 'full');
  const ignore = new Set(input.ignore);
  const entries = Object.entries(data).filter(([, item]) => {
    if (ignore.has('np') && item.type === 'np') return false;
    if (ignore.has('nc') && item.type === 'nc') return false;
    return true;
  });

  const importData = buildImportListItems(entries, session.items, ignore.has('quantity'));

  if (!importData.length) throwImportError(IMPORT_ERROR.NO_ITEMS);

  if (input.action === 'add') {
    await ListService.upsertItems(list.internal_id, importData);
  } else {
    const itemIids = importData.map((item) => Number(item.item_iid));
    const shouldHide = input.action === 'hide' || list.dynamicType === 'fullSync';
    if (shouldHide) await ListService.hideItems(list.internal_id, itemIids);
    else await ListService.removeItems(list.internal_id, itemIids);
  }

  const username = list.official ? 'official' : (list.user.username ?? '');
  for (const tag of listMutationCacheTags(username, list.internal_id)) {
    updateTag(tag);
  }

  return {
    listPath: `/lists/${username}/${list.internal_id}`,
    processedCount: importData.length,
    notFoundCount: notFoundKeys.length,
    ambiguousCount: ambiguous.length,
  };
}
