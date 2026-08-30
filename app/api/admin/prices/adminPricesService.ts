import 'server-only';

import { revalidateTag } from 'next/cache';
import { isValid } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { HomeRevalidateTags, itemRootTag, itemSectionTag } from '@utils/appCacheTags';
import prisma from '@utils/prisma';
import { doProcessPrices, MAX_PAST_DAYS } from '@pages/api/v1/prices/process';
import type { ItemPrices } from '@prisma/generated/client';
import type { User } from '@types';
import { LogService } from '@services/ActionLogService';

export class AdminPricesInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminPricesInputError';
  }
}

export class AdminPricesNotFoundError extends Error {
  constructor(message = 'Price not found') {
    super(message);
    this.name = 'AdminPricesNotFoundError';
  }
}

export type CreateAdminPriceRequest = {
  price?: unknown;
  isInflation?: unknown;
  item_iid?: unknown;
  addedAt?: unknown;
};

export type EditAdminPriceRequest = {
  newPrice?: unknown;
  isInflation?: unknown;
  item_iid?: unknown;
  priceContext?: unknown;
};

export type ProcessAdminPricesRequest = {
  item_iid?: unknown;
};

function parseNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || Number.isNaN(n)) {
    throw new AdminPricesInputError('Invalid input');
  }
  return n;
}

function revalidateItemPrices(itemId: number): void {
  revalidateTag(itemRootTag(itemId), 'max');
  revalidateTag(itemSectionTag(itemId, 'np-prices'), 'max');
  revalidateTag(HomeRevalidateTags.latestPrices, 'max');
}

export async function createAdminPrice(body: CreateAdminPriceRequest): Promise<ItemPrices> {
  const price = parseNumber(body.price);
  const item_iid = parseNumber(body.item_iid);
  const addedAtRaw = typeof body.addedAt === 'string' ? body.addedAt : String(body.addedAt ?? '');

  if (!isValid(new Date(addedAtRaw))) {
    throw new AdminPricesInputError('Invalid input');
  }

  const lastPrice = await prisma.itemPrices.findFirst({
    where: { item_iid },
    orderBy: { addedAt: 'desc' },
  });

  let noInflation_id: number | null = null;
  if (body.isInflation && lastPrice) {
    noInflation_id = lastPrice.noInflation_id ?? lastPrice.internal_id;
  }

  const utcAddedAt = new UTCDate(new UTCDate(addedAtRaw).setHours(18));
  const newIsLatest = lastPrice ? lastPrice.addedAt.getTime() < utcAddedAt.getTime() : true;

  if (newIsLatest && lastPrice) {
    await prisma.itemPrices.update({
      where: { internal_id: lastPrice.internal_id },
      data: { isLatest: null },
    });
  }

  const newPrice = await prisma.itemPrices.create({
    data: {
      item_iid,
      price,
      noInflation_id,
      addedAt: utcAddedAt,
      usedProcessIDs: 'admin_price',
      isLatest: newIsLatest && price > 0 ? true : null,
    },
  });

  revalidateItemPrices(item_iid);
  return newPrice;
}

export async function processAdminPrices(body: ProcessAdminPricesRequest) {
  const item_iid = parseNumber(body.item_iid);

  const lastPrice = await prisma.itemPrices.findFirst({
    where: { item_iid },
    orderBy: { addedAt: 'desc' },
  });

  const maxPast = Math.max(
    Date.now() - MAX_PAST_DAYS * 24 * 60 * 60 * 1000,
    lastPrice?.addedAt.getTime() ?? 0
  );

  const priceProcess = await prisma.priceProcess2.findMany({
    where: {
      item_iid,
      processed: false,
      addedAt: { gte: new Date(maxPast) },
    },
  });

  if (!priceProcess.length) {
    throw new AdminPricesInputError('Nothing to process');
  }

  const result = await doProcessPrices(priceProcess, [item_iid], true);
  revalidateItemPrices(item_iid);
  return result;
}

export async function editAdminPrice(
  priceId: number,
  body: EditAdminPriceRequest,
  user: User
): Promise<ItemPrices> {
  const item_iid = parseNumber(body.item_iid);
  const newPrice = parseNumber(body.newPrice);
  const priceContext = typeof body.priceContext === 'string' ? body.priceContext : '';

  const originalPrice = await prisma.itemPrices.findUnique({
    where: { internal_id: priceId },
  });

  if (!originalPrice) throw new AdminPricesNotFoundError();

  let noInflation_id: number | null | undefined = originalPrice.noInflation_id;

  if (body.isInflation === false) {
    noInflation_id = null;
  }

  if (body.isInflation && !noInflation_id) {
    const lastInflationPrice = await prisma.itemPrices.findFirst({
      where: {
        item_iid,
        internal_id: { not: priceId },
        noInflation_id: null,
      },
      orderBy: { addedAt: 'desc' },
    });

    noInflation_id = lastInflationPrice ? lastInflationPrice.internal_id : null;
  }

  const updated = await prisma.itemPrices.update({
    where: { internal_id: priceId },
    data: {
      noInflation_id,
      price: newPrice,
      usedProcessIDs: 'manual_edit',
      priceContext: priceContext || null,
    },
  });

  await LogService.createLog(
    'editPrice',
    { originalPrice, updatedPrice: updated },
    item_iid.toString(),
    user.id
  );

  revalidateItemPrices(item_iid);
  return updated;
}

export async function deleteAdminPrice(priceId: number, user: User): Promise<true> {
  const originalPrice = await prisma.itemPrices.findUnique({
    where: { internal_id: priceId },
  });

  if (!originalPrice) throw new AdminPricesNotFoundError();

  await prisma.itemPrices.delete({
    where: { internal_id: priceId },
  });

  await LogService.createLog(
    'deletePrice',
    originalPrice,
    originalPrice.item_iid?.toString(),
    user.id
  );

  if (originalPrice.isLatest) {
    const lastOne = await prisma.itemPrices.findFirst({
      where: { item_iid: originalPrice.item_iid },
      orderBy: { addedAt: 'desc' },
    });

    if (lastOne) {
      await prisma.itemPrices.update({
        where: { internal_id: lastOne.internal_id },
        data: { isLatest: true },
      });
    }
  }

  if (originalPrice.item_iid) {
    revalidateItemPrices(originalPrice.item_iid);
  }

  return true;
}
