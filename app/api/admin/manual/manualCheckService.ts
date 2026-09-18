import 'server-only';

import { revalidateTag } from 'next/cache';
import { ItemPrices, ItemProcess, Prisma } from '@prisma/generated/client';
import { LogService } from '@services/ActionLogService';
import { HomeRevalidateTags, itemRootTag, itemSectionTag } from '@utils/appCacheTags';
import {
  computeItemProcessDiff,
  ItemProcessDiffEntry,
  parseConflictField,
} from '@utils/manualCheck/itemProcessDiff';
import prisma from '@utils/prisma';
import { slugify } from '@utils/utils';
import { decodeItemTextFields } from '@utils/item/itemFieldMerge';
import { buildNewItemFields } from '@utils/item/processItemQueue';
import { detectWearable } from '@utils/item/detectWearable';
import type { User } from '@types';

export class ManualCheckInputError extends Error {
  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'ManualCheckInputError';
  }
}

export type ItemManualCheckInfoData = {
  process: ItemProcess;
  conflictField: string | null;
  changes: ItemProcessDiffEntry[];
};

export type ItemManualCheckData = {
  inflation: ItemPrices | null;
  info: ItemManualCheckInfoData | null;
};

export type ResolveManualCheckRequest = {
  type?: unknown;
  action?: unknown;
  checkID?: unknown;
  correctInfo?: { field?: unknown; value?: unknown };
};

export async function getItemManualCheck(itemInternalId: number): Promise<ItemManualCheckData> {
  const inflation = await prisma.itemPrices.findFirst({
    where: {
      item_iid: itemInternalId,
      manual_check: 'inflation',
    },
  });

  const process = await prisma.itemProcess.findFirst({
    where: {
      processed: false,
      manual_check: {
        not: null,
        contains: `(${itemInternalId})`,
      },
    },
  });

  const dbItem = await prisma.items.findUnique({
    where: { internal_id: itemInternalId },
  });

  if (!process || !dbItem) {
    return { inflation, info: null };
  }

  const conflictField = parseConflictField(process.manual_check);
  const changes = computeItemProcessDiff(dbItem, process, conflictField);

  return {
    inflation,
    info: {
      process,
      conflictField,
      changes,
    },
  };
}

export type ManualCheckConflictCategory = 'rename' | 're-art' | 'other';

export type PendingInfoCheckGroup = {
  targetId: number;
  conflictField: string | null;
  category: ManualCheckConflictCategory;
  info: ItemManualCheckInfoData;
};

function categorizeConflictField(field: string | null): ManualCheckConflictCategory {
  if (field === 'name') return 'rename';
  if (field === 'image') return 're-art';
  return 'other';
}

/**
 * Pending `manual_check` "info" (ItemProcess merge conflict) entries, grouped by the target
 * Items.internal_id they reference (one item can have several stacked-up pending rows) and
 * categorized by conflict field so the dashboard can section them (rename / re-art / other).
 */
export async function listPendingInfoChecks({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}): Promise<{
  groups: PendingInfoCheckGroup[];
  total: number;
}> {
  const rows = await prisma.itemProcess.findMany({
    where: { processed: false, manual_check: { not: null, contains: 'Merge' } },
    select: { manual_check: true, addedAt: true },
    orderBy: { addedAt: 'desc' },
  });

  const targetIds: number[] = [];
  const seen = new Set<number>();
  for (const row of rows) {
    const match = row.manual_check?.match(/\((\d+)\)$/);
    if (!match) continue;
    const targetId = Number(match[1]);
    if (seen.has(targetId)) continue;
    seen.add(targetId);
    targetIds.push(targetId);
  }

  const total = targetIds.length;
  const pageIds = targetIds.slice((page - 1) * pageSize, page * pageSize);

  const groups: PendingInfoCheckGroup[] = [];
  for (const targetId of pageIds) {
    const { info } = await getItemManualCheck(targetId);
    if (!info) continue;

    groups.push({
      targetId,
      conflictField: info.conflictField,
      category: categorizeConflictField(info.conflictField),
      info,
    });
  }

  return { groups, total };
}

export async function resolveManualCheck(
  itemId: number,
  body: ResolveManualCheckRequest,
  user: User
): Promise<{ success: true; createdId?: number }> {
  const { type, action, checkID, correctInfo } = body;

  if (type === 'inflation') {
    const check = (await prisma.itemPrices.findFirst({
      where: {
        internal_id: Number(checkID),
      },
    })) as ItemPrices;

    if (action === 'approve' || action === 'not_inflated') {
      const updateResult = await prisma.itemPrices.updateMany({
        where: {
          item_iid: check.item_iid,
          isLatest: true,
          addedAt: {
            lte: check.addedAt,
          },
        },
        data: {
          isLatest: null,
        },
      });

      await prisma.itemPrices.update({
        where: {
          internal_id: Number(checkID),
        },
        data: {
          manual_check: null,
          noInflation_id: action === 'not_inflated' ? null : undefined,
          isLatest: updateResult.count > 0 || null,
        },
      });

      if (check.item_iid) revalidateItemPrices(check.item_iid);
      return { success: true };
    }

    if (action === 'reprove') {
      const processIds = check.usedProcessIDs.split(',').map(Number);

      await prisma.itemPrices.delete({
        where: {
          internal_id: Number(checkID),
        },
      });

      await prisma.priceProcess2.updateMany({
        where: {
          internal_id: {
            in: processIds,
          },
        },
        data: {
          processed: false,
        },
      });

      if (check.item_iid) revalidateItemPrices(check.item_iid);
      return { success: true };
    }
  }

  if (type === 'info') {
    if (
      (!correctInfo || !correctInfo.field || !correctInfo.value) &&
      !['reprove', 'force_create', 'mark_clone'].includes(String(action))
    ) {
      throw new ManualCheckInputError();
    }

    if (action === 'force_create' || action === 'mark_clone') {
      if (!Number.isFinite(Number(checkID))) throw new ManualCheckInputError();

      const created = await handleForceCreate(
        itemId,
        Number(checkID),
        user,
        action === 'mark_clone'
      );

      return { success: true, createdId: created.internal_id };
    }

    if (action === 'approve') {
      await handleItemUpdate(itemId, String(correctInfo!.field), correctInfo!.value, user);

      await prisma.itemProcess.updateMany({
        where: {
          processed: false,
          manual_check: {
            contains: `(${itemId})`,
          },
        },
        data: {
          manual_check: null,
        },
      });

      revalidateTag(itemRootTag(itemId), 'max');
      return { success: true };
    }

    if (action === 'reprove') {
      await prisma.itemProcess.update({
        where: {
          internal_id: Number(checkID),
        },
        data: {
          processed: true,
        },
      });

      return { success: true };
    }

    if (action === 'correct') {
      await prisma.itemProcess.update({
        where: {
          internal_id: Number(checkID),
        },
        data: {
          [String(correctInfo!.field)]: correctInfo!.value,
          manual_check: null,
        },
      });

      return { success: true };
    }
  }

  throw new ManualCheckInputError();
}

async function handleItemUpdate(id: number, field: string, value: unknown, user: User) {
  let itemSlug = '';
  let image_id = '';

  if (field === 'name') {
    itemSlug = slugify(String(value));

    const dbSlugItems = await prisma.items.findMany({
      where: {
        slug: {
          startsWith: itemSlug,
        },
        NOT: {
          internal_id: Number(id),
        },
      },
    });

    if (dbSlugItems.length > 0) {
      const regex = new RegExp(`^${itemSlug}-\\d+$`);

      const sameSlug = dbSlugItems.filter((x) => regex.test(x.slug ?? ''));

      if (sameSlug.length > 0) {
        itemSlug = `${itemSlug}-${sameSlug.length + 1}`;
      }
    }
  }

  if (field === 'image') {
    image_id = String(value).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';
  }

  const parsedValue = ['weight', 'rarity', 'est_val', 'item_id'].includes(field)
    ? Number(value)
    : value;

  await prisma.items.update({
    where: {
      internal_id: Number(id),
    },
    data: {
      [field]: parsedValue,
      slug: itemSlug || undefined,
      image_id: image_id || undefined,
    },
  });

  await LogService.createLog(
    'itemUpdate',
    {
      field,
      value: String(value),
    },
    id.toString(),
    user.id
  );
}

/**
 * Resolves a stuck 'name'/'image' merge conflict by treating the queued submission as a
 * genuinely different item instead of a rename/re-art of `targetId` — creates it as a brand new
 * Items row (optionally linked to `targetId` via canonical_id) and leaves the target untouched.
 */
async function handleForceCreate(targetId: number, checkID: number, user: User, asClone: boolean) {
  const process = decodeItemTextFields(
    await prisma.itemProcess.findUniqueOrThrow({ where: { internal_id: checkID } })
  );

  if (!process.isWearable) {
    process.isWearable = await detectWearable(process.image ?? '').catch(() => false);
  }

  let itemSlug = slugify(process.name);
  const dbSlugItems = await prisma.items.findMany({
    where: { slug: { startsWith: itemSlug } },
    select: { slug: true },
  });

  if (dbSlugItems.length > 0) {
    const regex = new RegExp(`^${itemSlug}(-\\d+)?$`);
    const sameSlug = dbSlugItems.filter((x) => regex.test(x.slug ?? ''));
    if (sameSlug.length > 0) itemSlug = `${itemSlug}-${sameSlug.length + 1}`;
  }

  const fields = buildNewItemFields(process, itemSlug);

  const created = await prisma.items.create({
    data: {
      ...fields,
      name: fields.name!,
      isNC: fields.isNC ?? false,
      canonical_id: asClone ? targetId : undefined,
    } as Prisma.ItemsCreateInput,
  });

  await prisma.itemProcess.updateMany({
    where: { processed: false, manual_check: { contains: `(${targetId})` } },
    data: { processed: true, manual_check: null },
  });

  await LogService.createLog(
    'itemUpdate',
    {
      reason: asClone ? 'manual-check:mark_clone' : 'manual-check:force_create',
      createdFromProcessId: checkID,
      conflictTargetId: targetId,
      canonical_id: asClone ? targetId : null,
    },
    created.internal_id.toString(),
    user.id
  );

  revalidateTag(itemRootTag(created.internal_id), 'max');

  return created;
}

function revalidateItemPrices(itemId: number): void {
  revalidateTag(itemRootTag(itemId), 'max');
  revalidateTag(itemSectionTag(itemId, 'np-prices'), 'max');
  revalidateTag(HomeRevalidateTags.latestPrices, 'max');
}
