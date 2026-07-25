'use server';

import { updateTag } from 'next/cache';
import { parseManyItemsV2Query } from '@app/api/v2/items/parse';
import { type FindManyItemsV2Query, type FindManyItemsV2Type } from '@app/server/items/v2';
import { ItemService } from '@services/ItemService';
import { ListService, type PutListItemInput } from '@services/ListService';
import type { ItemV2For } from '@types';
import { listMutationCacheTags } from '@utils/appCacheTags';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getListImportSession, type ListImportSession } from '@utils/list/importSession';
import prisma from '@utils/prisma';
import { dynamicListCan } from '@utils/utils';
import {
  IMPORT_ERROR,
  MAX_IMPORT_ITEMS,
  type ApplyListImportInput,
  type ApplyListImportResult,
  type ImportErrorCode,
  type ImportPreview,
} from './importShared';

const PREVIEW_LIMIT = 30;

function throwImportError(code: ImportErrorCode): never {
  throw new Error(code);
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

function importQuantity(
  source: ListImportSession['items'],
  item: ItemV2For<'full'> | ItemV2For<'card'>,
  responseKey: string
): number {
  return (
    source[responseKey] ??
    source[item.item_id ?? -1] ??
    source[item.name] ??
    source[item.image.id] ??
    source[`${item.name},${item.image.id}`] ??
    1
  );
}

async function requireImportSession(importToken: string) {
  const session = await getListImportSession(importToken);
  if (!session) throwImportError(IMPORT_ERROR.EXPIRED);
  return session;
}

export async function loadImportPreview(importToken: string): Promise<ImportPreview> {
  const session = await requireImportSession(importToken);
  const query = buildImportQuery(session, PREVIEW_LIMIT);
  const data = await ItemService.getManyItems(query, {
    intent: 'card',
    limit: PREVIEW_LIMIT,
  });

  return {
    items: Object.entries(data).map(([key, item]) => ({
      key,
      item,
      quantity: importQuantity(session.items, item, key),
    })),
    totalCount: Object.keys(session.items).length,
  };
}

export async function applyListImport(input: ApplyListImportInput): Promise<ApplyListImportResult> {
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

  const query = buildImportQuery(session);
  const data = await ItemService.getManyItems(query, {
    intent: 'full',
    limit: MAX_IMPORT_ITEMS,
  });
  const ignore = new Set(input.ignore);
  const entries = Object.entries(data).filter(([, item]) => {
    if (ignore.has('np') && item.type === 'np') return false;
    if (ignore.has('nc') && item.type === 'nc') return false;
    return true;
  });

  const canonicalAmount: Record<number, number> = {};
  for (const [, item] of entries) {
    if (item.canonical_id) {
      canonicalAmount[item.canonical_id] = (canonicalAmount[item.canonical_id] ?? 0) + 1;
    }
  }

  const importData: PutListItemInput[] = entries.map(([responseKey, item]) => ({
    item_iid: String(item.canonical_id ?? item.internal_id),
    capValue: undefined,
    amount: String(
      ignore.has('quantity')
        ? 1
        : item.canonical_id
          ? canonicalAmount[item.canonical_id]
          : importQuantity(session.items, item, responseKey)
    ),
    imported: true,
  }));

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
    notFoundCount: Object.keys(session.items).length - Object.keys(data).length,
  };
}
