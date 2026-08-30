import 'server-only';

import { revalidateTag } from 'next/cache';
import { ItemPrices, ItemProcess } from '@prisma/generated/client';
import { LogService } from '@services/ActionLogService';
import { HomeRevalidateTags, itemRootTag, itemSectionTag } from '@utils/appCacheTags';
import {
  computeItemProcessDiff,
  ItemProcessDiffEntry,
  parseConflictField,
} from '@utils/manualCheck/itemProcessDiff';
import prisma from '@utils/prisma';
import { slugify } from '@utils/utils';
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

export async function resolveManualCheck(
  itemId: number,
  body: ResolveManualCheckRequest,
  user: User
): Promise<{ success: true }> {
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
    if ((!correctInfo || !correctInfo.field || !correctInfo.value) && action !== 'reprove') {
      throw new ManualCheckInputError();
    }

    if (action === 'approve') {
      await handleItemUpdate(itemId, String(correctInfo!.field), String(correctInfo!.value), user);

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

async function handleItemUpdate(id: number, field: string, value: string, user: User) {
  let itemSlug = '';
  let image_id = '';

  if (field === 'name') {
    itemSlug = slugify(value);

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
    image_id = (value as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';
  }

  await prisma.items.update({
    where: {
      internal_id: Number(id),
    },
    data: {
      [field]: value,
      slug: itemSlug || undefined,
      image_id: image_id || undefined,
    },
  });

  await LogService.createLog(
    'itemUpdate',
    {
      field,
      value,
    },
    id.toString(),
    user.id
  );
}

function revalidateItemPrices(itemId: number): void {
  revalidateTag(itemRootTag(itemId), 'max');
  revalidateTag(itemSectionTag(itemId, 'np-prices'), 'max');
  revalidateTag(HomeRevalidateTags.latestPrices, 'max');
}
