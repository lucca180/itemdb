import { cache } from 'react';
import { after } from 'next/server';
import { Prisma } from '@prisma/generated/client';
import { differenceInCalendarDays } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import prisma from '@utils/prisma';
import { getItemFindAtLinks, isMissingInfo } from '@utils/utils';
import type { ItemData } from '@types';
import { rawToItemData } from '@pages/api/v1/items/many';
import { getSaleStats } from '@pages/api/v1/items/[id_name]/saleStats';
import { getNCValue } from '@pages/api/v1/mall/[iid]';
import { ItemRevalidateTags, revalidateItem } from '@utils/revalidateItem';

const DISABLE_SALE_STATS = process.env.DISABLE_SALE_STATS === 'true';
const NC_VALUES_TYPE = process.env.NC_VALUES_TYPE;
const SALE_STATS_MIN_DATE = new UTCDate(1722650400000);
const PRICE_UNKNOWN_AFTER_DAYS = 30 * 15; // 15 months

type RawItemResult = {
  addedAt: Date;
  saleAdded: Date | null;
} & Record<string, unknown>;

function buildItemQuery(idName: number | string) {
  const isId = !Number.isNaN(Number(idName));
  if (isId) return Prisma.sql`a.internal_id = ${idName}`;
  return Prisma.sql`a.slug = ${idName} or a.name LIKE ${idName}`;
}

function shouldRefreshNCValue(item: ItemData) {
  if (!(item.isNC && item.status === 'active' && NC_VALUES_TYPE === 'itemdb')) return false;
  if (!item.ncValue?.addedAt) return true;
  return differenceInCalendarDays(Date.now(), new Date(item.ncValue.addedAt)) > 15;
}

function shouldRefreshSaleStats(item: ItemData) {
  if (DISABLE_SALE_STATS || !item.price.value || !item.price.addedAt) return false;
  if (!item.saleStatus?.addedAt) return true;

  const latestDate = Math.max(
    Date.now() - 5 * 24 * 60 * 60 * 1000,
    new Date(item.price.addedAt).getTime(),
    SALE_STATS_MIN_DATE.getTime()
  );

  return new Date(item.saleStatus.addedAt).getTime() < latestDate;
}

async function markStalePriceAsUnknown(item: ItemData): Promise<boolean> {
  if (!item.price.addedAt || item.price.value === null || item.price.value === 0) return false;

  if (
    differenceInCalendarDays(Date.now(), new Date(item.price.addedAt)) <= PRICE_UNKNOWN_AFTER_DAYS
  ) {
    return false;
  }

  const created = await prisma.$transaction(async (tx) => {
    const latestPrice = await tx.itemPrices.findFirst({
      where: {
        item_iid: item.internal_id,
        isLatest: true,
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    if (!latestPrice || latestPrice.price.toNumber() === 0) return false;

    if (differenceInCalendarDays(Date.now(), latestPrice.addedAt) <= PRICE_UNKNOWN_AFTER_DAYS) {
      return false;
    }

    await tx.itemPrices.update({
      where: {
        internal_id: latestPrice.internal_id,
      },
      data: {
        isLatest: null,
      },
    });

    await tx.itemPrices.create({
      data: {
        item_iid: item.internal_id,
        price: 0,
        addedAt: new Date(),
        usedProcessIDs: 'after_zero_price',
        isLatest: true,
      },
    });

    return true;
  });

  if (created) {
    await revalidateItem(item.internal_id, ItemRevalidateTags.root(item.internal_id));
  }

  return created;
}

const refreshItemDerivedData = cache(async (item: ItemData) => {
  const tasks: Promise<unknown>[] = [];

  tasks.push(markStalePriceAsUnknown(item));

  if (shouldRefreshNCValue(item)) {
    tasks.push(getNCValue(item.internal_id, item.name, 15, false));
  }

  if (shouldRefreshSaleStats(item)) {
    tasks.push(getSaleStats(item.internal_id, 15, new Date(item.price.addedAt!)));
  }

  if (tasks.length === 0) return;

  await Promise.allSettled(tasks);
});

export async function getItemV2(
  idName: number | string,
  includeFlags = false
): Promise<ItemData | null> {
  const query = buildItemQuery(idName);
  const resultRaw = (await prisma.$queryRaw`
    SELECT a.*, b.lab_l, b.lab_a, b.lab_b, b.population, b.rgb_r, b.rgb_g, b.rgb_b, b.hex,
      b.hsv_h, b.hsv_s, b.hsv_v,
      c.addedAt as priceAdded, c.price, c.noInflation_id, c.newPrice,
      d.addedAt as ncValueAddedAt, d.minValue, d.maxValue, d.valueRange,
      o.pricedAt as owlsPriced, o.value as owlsValue, o.valueMin as owlsValueMin,
      s.totalSold, s.totalItems, s.stats, s.daysPeriod, s.addedAt as saleAdded,
      n.price as ncPrice, n.saleBegin, n.saleEnd, n.discountBegin, n.discountEnd, n.discountPrice
    FROM Items as a
    LEFT JOIN ItemColor as b on a.image_id = b.image_id and b.type = "Vibrant"
    LEFT JOIN ncValues as d on d.item_iid = a.internal_id and d.isLatest = 1
    LEFT JOIN owlsPrice as o on o.item_iid = a.internal_id and o.isLatest = 1
    LEFT JOIN itemPrices as c on c.item_iid = a.internal_id and c.isLatest = 1
    LEFT JOIN SaleStats as s on s.item_iid = a.internal_id and s.isLatest = 1 and s.stats != "unknown"
    LEFT JOIN NcMallData as n on n.item_iid = a.internal_id and n.active = 1
    WHERE ${query}
  `) as RawItemResult[] | null;

  if (!resultRaw || resultRaw.length === 0) return null;

  const item = rawToItemData(resultRaw[0], { includeFlags });
  item.findAt = getItemFindAtLinks(item);
  item.isMissingInfo = isMissingInfo(item);

  after(async () => {
    await refreshItemDerivedData(item);
  });

  return item;
}
