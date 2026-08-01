import { Items as Item, ItemProcess, ItemColor, Prisma } from '@prisma/generated/client';
import pMap from 'p-map';
import prisma from '@utils/prisma';
import { allBooksCats, allFoodsCats, allPlayCats, genItemKey, slugify } from '@utils/utils';
import { revalidateAppCache, HomeRevalidateTags } from '@utils/item/revalidateItem';
import { getPalette } from '@utils/item/itemPalette';
import { detectWearable } from '@utils/item/detectWearable';
import { processOpenableItems } from '@pages/api/v1/items/open';
import { sendNewItemsHook } from '@utils/discord-hooks';
import { syncAllDynamicLists } from '@pages/api/v1/lists/sync';
import { LogService } from '@services/ActionLogService';
import { mergeItemFieldKey, decodeItemTextFields } from '@utils/item/itemFieldMerge';
import type { ItemData } from '@types';

type ValueOf<T> = T[keyof T];

const ITEM_PROCESS_DB_CONCURRENCY = 7;
const ITEM_PROCESS_PALETTE_CONCURRENCY = 10;
const ITEM_PROCESS_OPENABLE_CONCURRENCY = 5;

export type ProcessItemQueueOptions = {
  limit?: number;
  offset?: number;
  checkAll?: boolean;
  skipColors?: boolean;
};

export type ProcessItemQueueResult = {
  created: number;
  colorsCreated: number;
  processed: number;
  manualChecks: unknown[];
};

type ProcessContext = {
  usedSlugs: Set<string>;
  manualChecks: unknown[];
};

export type ItemChangesLog = {
  [key in keyof Item | keyof ItemData]?: {
    oldVal: unknown;
    newVal: unknown;
  };
};

/** Drain the ItemProcess queue into Items (same behavior as POST /api/v1/items/process). */
export async function processItemProcessQueue(
  options: ProcessItemQueueOptions = {}
): Promise<ProcessItemQueueResult> {
  let limit = Number(options.limit);
  limit = isNaN(limit) ? 300 : limit;
  limit = Math.min(limit, 5000);

  let offset = Number(options.offset);
  offset = isNaN(offset) ? 0 : offset;

  const checkAll = options.checkAll === true;
  const skipColors = options.skipColors === true;

  const ctx: ProcessContext = {
    usedSlugs: new Set<string>(),
    manualChecks: [],
  };

  const processList = await prisma.itemProcess.findMany({
    where: {
      language: 'en',
      processed: checkAll ? undefined : false,
      manual_check: checkAll ? undefined : null,
    },
    take: limit,
    skip: offset * limit,
  });

  const uniqueNames = [...processList].filter(
    (value, index, self) =>
      index === self.findIndex((t) => genItemKey(t, true) === genItemKey(value, true))
  );

  const deleteIds: number[] = [];
  const itemsToProcess: ItemProcess[] = [];

  for (const item of uniqueNames) {
    const allItemData = processList.filter((x) => genItemKey(x, true) === genItemKey(item, true));
    const itemData = { ...item } as ItemProcess;

    for (const itemOtherData of allItemData) {
      for (const key of Object.keys(itemData) as Array<keyof ItemProcess>) {
        (itemData as Record<keyof ItemProcess, ValueOf<ItemProcess>>)[key] ||=
          itemOtherData[key] ?? itemData[key];
      }

      deleteIds.push(itemOtherData.internal_id);
    }

    itemsToProcess.push(decodeItemTextFields(itemData));
  }

  let itemAddList = (
    await pMap(itemsToProcess, (item) => updateOrAddDB(item, ctx), {
      concurrency: ITEM_PROCESS_DB_CONCURRENCY,
    })
  ).filter((x) => !!x) as Item[];

  const itemColorAddList = (
    await pMap(itemAddList, getPalette, { concurrency: ITEM_PROCESS_PALETTE_CONCURRENCY })
  )
    .flat()
    .filter((x) => !!x) as ItemColor[];

  itemAddList = itemAddList.filter(
    (x) => skipColors || itemColorAddList.some((y) => y.image_id === x.image_id)
  );

  const result = await prisma.$transaction([
    prisma.items.createMany({ data: itemAddList, skipDuplicates: true }),
    prisma.itemColor.createMany({
      data: itemColorAddList,
      skipDuplicates: true,
    }),
    prisma.itemProcess.updateMany({
      where: {
        internal_id: { in: deleteIds },
        manual_check: null,
      },
      data: {
        processed: true,
      },
    }),
  ]);

  const newItems = result[0].count;
  await Promise.all([
    newItems ? sendNewItemsHook(newItems) : undefined,
    processOpenables(),
    newItems ? syncAllDynamicLists() : undefined,
  ]);

  if (newItems) {
    await revalidateAppCache([
      HomeRevalidateTags.latestItems,
      HomeRevalidateTags.latestWearableItems,
      HomeRevalidateTags.newItemCount,
      HomeRevalidateTags.trendingItems,
    ]);
  }

  return {
    created: result[0].count,
    colorsCreated: result[1].count,
    processed: result[2].count,
    manualChecks: ctx.manualChecks,
  };
}

async function updateOrAddDB(
  item: ItemProcess,
  ctx: ProcessContext
): Promise<Partial<Item> | undefined> {
  item = decodeItemTextFields(item);

  try {
    if (!item.image_id || !item.image || !item.name) throw 'invalid data';

    let itemSlug = slugify(item.name);
    if (!itemSlug) throw 'invalid data';

    const manualCheck = await prisma.itemProcess.findFirst({
      where: {
        manual_check: {
          not: null,
        },
        processed: false,
        OR: [
          { name: item.name, image_id: item.image_id },
          item.item_id ? { item_id: item.item_id } : {},
        ],
      },
    });

    if (manualCheck) {
      throw manualCheck.manual_check;
    }

    const dbItemListPromise = prisma.items.findMany({
      where: {
        OR: [
          {
            name: item.name,
            image_id: item.image_id,
          },
          item.item_id ? { item_id: item.item_id } : {},
        ],
      },
    });

    const dbSlugItemsPromise = prisma.items.findMany({
      where: {
        slug: {
          startsWith: itemSlug,
        },
      },
    });

    const [dbItemList, dbSlugItems] = await Promise.all([dbItemListPromise, dbSlugItemsPromise]);

    if (dbSlugItems.length > 0 || ctx.usedSlugs.has(itemSlug)) {
      const regex = new RegExp(`^${itemSlug}(-\\d+)?$`);

      const allSlugs = [...dbSlugItems.map((x) => x.slug), ...ctx.usedSlugs.values()];

      const sameSlug = allSlugs.filter((x) => regex.test(x ?? ''));

      if (sameSlug.length > 0) {
        itemSlug = `${itemSlug}-${sameSlug.length + 1}`;
      }
    }

    if (
      dbItemList.length === 0 ||
      (item.item_id && dbItemList.every((x) => x.item_id && x.item_id !== item.item_id))
    ) {
      if (!item.isWearable) item.isWearable = await detectWearable(item.image).catch(() => false);
      ctx.usedSlugs.add(itemSlug);
      return {
        name: item.name,
        description: item.description,
        image_id: item.image_id,
        image: item.image,
        item_id: item.item_id,
        specialType: item.specialType,
        category: item.category,
        rarity: item.rarity,
        weight: item.weight,
        type: item.type,
        isNC: item.isNC,
        slug: itemSlug,
        isWearable: item.isWearable,
        isNeohome: !!item.specialType?.toLowerCase().includes('neohome'),
        est_val: item.est_val,
        isBD: item.isBD,
        canEat: checkEat(item.category) && !item.isWearable ? 'true' : undefined,
        canPlay: checkPlay(item.category) && !item.isWearable ? 'true' : undefined,
        canRead: checkRead(item.category) && !item.isWearable ? 'true' : undefined,
        status: item.status,
      };
    }

    let dbItem = dbItemList[0];

    if (dbItemList.length > 1) {
      const sameItemId = dbItemList.filter((x) => x.item_id === item.item_id);
      if (sameItemId.length === 1) dbItem = sameItemId[0];
      else throw 'More than one entry exists with the same name.';
    }

    const changeObj = {} as ItemChangesLog;

    let hasChange = false;
    for (const key of Object.keys(dbItem) as Array<keyof typeof dbItem>) {
      if (['internal_id', 'addedAt', 'updatedAt', 'hash'].includes(key)) continue;
      const temp = dbItem[key];

      if (mergeItemFieldKey(dbItem, item, key) === 'continue') continue;

      hasChange ||= dbItem[key] !== temp;

      if (dbItem[key] !== temp) {
        logChanges(changeObj, temp, dbItem[key], key);
      }
    }

    if (!hasChange) return undefined;

    const updatedItem: Prisma.ItemsUpdateArgs['data'] = {
      item_id: dbItem.item_id,
      name: dbItem.name,
      description: dbItem.description,
      image_id: dbItem.image_id,
      image: dbItem.image,
      specialType: dbItem.specialType,
      category: dbItem.category,
      rarity: dbItem.rarity,
      weight: dbItem.weight,
      isNC: dbItem.isNC,
      type: dbItem.type,
      isWearable: dbItem.isWearable,
      isNeohome: !!dbItem.specialType?.toLowerCase().includes('neohome'),
      est_val: dbItem.est_val,
      status: dbItem.status,
      isBD: dbItem.isBD,
      canEat:
        dbItem.canEat === 'unknown' && checkEat(dbItem.category) && !dbItem.isWearable
          ? 'true'
          : undefined,
      canPlay:
        dbItem.canPlay === 'unknown' && checkPlay(dbItem.category) && !dbItem.isWearable
          ? 'true'
          : undefined,
      canRead:
        dbItem.canRead === 'unknown' && checkRead(dbItem.category) && !dbItem.isWearable
          ? 'true'
          : undefined,
      updatedAt: new Date(),
    };

    await prisma.items.update({
      data: updatedItem,
      where: { internal_id: dbItem.internal_id },
    });

    await LogService.createLog(
      'itemUpdate',
      changeObj as Prisma.InputJsonValue,
      dbItem.internal_id.toString()
    );

    return undefined;
  } catch (e: any) {
    if (!['P2002'].includes(e?.code) && typeof e !== 'string') {
      console.error({ error: e, item });
      throw { error: e, item };
    }

    await prisma.itemProcess.update({
      data: { manual_check: typeof e == 'string' ? e : e.code },
      where: { internal_id: item.internal_id },
    });

    ctx.manualChecks.push({ error: e, item });

    return undefined;
  }
}

async function processOpenables() {
  const queue = await prisma.openableQueue.findMany({
    where: {
      processed: false,
      manual_check: null,
    },
  });

  await pMap(
    queue,
    async (openable) => {
      try {
        await processOpenableItems(openable);
        await prisma.openableQueue.update({
          data: {
            processed: true,
          },
          where: {
            internal_id: openable.internal_id,
          },
        });
      } catch (e: any) {
        if (typeof e === 'string' && e.includes('unknown')) return;

        console.error(e);

        await prisma.openableQueue.update({
          data: {
            manual_check: typeof e === 'string' ? e.slice(0, 140) : e.message.slice(0, 140),
          },
          where: {
            internal_id: openable.internal_id,
          },
        });
      }
    },
    { concurrency: ITEM_PROCESS_OPENABLE_CONCURRENCY }
  );
}

const checkEat = (category?: string | null) =>
  allFoodsCats.filter((x) => x.toLowerCase() === category?.toLowerCase()).length > 0;
const checkPlay = (category?: string | null) =>
  allPlayCats.filter((x) => x.toLowerCase() === category?.toLowerCase()).length > 0;
const checkRead = (category?: string | null) =>
  allBooksCats.filter((x) => x.toLowerCase() === category?.toLowerCase()).length > 0;

const logChanges = (
  changeArr: ItemChangesLog,
  oldVal: unknown,
  newVal: unknown,
  field: keyof Item | keyof ItemData
) => {
  if (!changeArr[field]) changeArr[field] = { oldVal, newVal };
  else changeArr[field].newVal = newVal;
};
