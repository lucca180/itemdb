/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Items as Item, ItemProcess, Items, ItemColor, Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import Vibrant from 'node-vibrant';
import {
  allBooksCats,
  allFoodsCats,
  allPlayCats,
  categoryToShopID,
  genItemKey,
  slugify,
} from '../../../../utils/utils';
import Color from 'color';
import { detectWearable } from '../../../../utils/detectWearable';
import { processOpenableItems } from './open';
import { CheckAuth } from '../../../../utils/googleCloud';

type ValueOf<T> = T[keyof T];

const TARNUM_KEY = process.env.TARNUM_KEY;

const usedSlugs = new Set<string>();

let manualChecks: any = [];

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (
    !req.headers.authorization ||
    (req.headers.authorization !== TARNUM_KEY && !req.headers.authorization.includes('Bearer'))
  )
    return res.status(401).json({ error: 'Unauthorized' });

  if (req.headers.authorization.includes('Bearer')) {
    try {
      const user = (await CheckAuth(req)).user;
      if (!user || !user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  usedSlugs.clear();
  manualChecks = [];

  let limit = Number(req.body.limit);
  limit = isNaN(limit) ? 300 : limit;
  limit = Math.min(limit, 5000);

  let offset = Number(req.body.offset);
  offset = isNaN(offset) ? 0 : offset;

  const checkAll = req.body.checkAll === 'true';

  const processList = await prisma.itemProcess.findMany({
    where: {
      language: 'en',
      processed: checkAll ? undefined : false,
      manual_check: checkAll ? undefined : null,
    },
    take: limit,
    skip: offset * limit,
  });

  // list of unique entries
  const uniqueNames = [...processList].filter(
    (value, index, self) =>
      index === self.findIndex((t) => genItemKey(t, true) === genItemKey(value, true))
  );

  const deleteIds: number[] = [];
  const itemAddPromises: Promise<Partial<Items> | undefined>[] = [];

  // for each unique entry we get the repeated ones and "merge" all the data we have
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

    itemAddPromises.push(updateOrAddDB(itemData));
  }

  // remove the 'undefined' and add new items to db
  const itemAddList = (await Promise.all(itemAddPromises)).filter((x) => !!x) as Item[];

  const itemColorAddList = (await Promise.all(itemAddList.map((i) => getPallete(i))))
    .flat()
    .filter((x) => !!x) as ItemColor[];

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

  await processOpenables();
  return res.json({ ...result, manualChecks });
}

// If a item does not exist in the DB we use "createMany" but
// there is not a "updateMany" so we update here and return undefined
async function updateOrAddDB(item: ItemProcess): Promise<Partial<Item> | undefined> {
  try {
    if (!item.image_id || !item.image || !item.name) throw 'invalid data';

    let itemSlug = slugify(item.name);
    if (!itemSlug) throw 'invalid data';

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

    // check if we have same slug
    if (dbSlugItems.length > 0 || usedSlugs.has(itemSlug)) {
      const regex = new RegExp(`^${itemSlug}(-\\d+)?$`);

      const allSlugs = [...dbSlugItems.map((x) => x.slug), ...usedSlugs.values()];

      const sameSlug = allSlugs.filter((x) => regex.test(x ?? ''));

      if (sameSlug.length > 0) {
        itemSlug = `${itemSlug}-${sameSlug.length + 1}`;
      }
    }

    // db has no entry -> add
    // db has other entries but it's not the same item_id-> add
    if (
      dbItemList.length === 0 ||
      (item.item_id && dbItemList.every((x) => x.item_id && x.item_id !== item.item_id))
    ) {
      if (!item.isWearable) item.isWearable = await detectWearable(item.image);
      usedSlugs.add(itemSlug);
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

    // db has more than one -> manual check
    if (dbItemList.length > 1) {
      //check if we have the same item_id
      const sameItemId = dbItemList.filter((x) => x.item_id === item.item_id);
      if (sameItemId.length === 1) dbItem = sameItemId[0];
      else throw 'More than one entry exists with the same name.';
    }

    // merge the data we're missing
    let hasChange = false;
    const forceMerge = ['type', 'isNC', 'isWearable', 'status', 'est_val', 'isBD'];
    for (const key of Object.keys(dbItem) as Array<keyof typeof dbItem>) {
      if (['internal_id', 'addedAt', 'updatedAt', 'hash'].includes(key)) continue;
      const temp = dbItem[key];

      if (!dbItem[key]) {
        // @ts-ignore
        dbItem[key] ||= item[key] ?? dbItem[key];
      }

      // merge conflict
      // @ts-ignore
      if (dbItem[key] && item[key] && dbItem[key] !== item[key]) {
        // check if we're gaining info with specialType
        if (key === 'specialType') {
          const dbArr = dbItem.specialType?.split(',') ?? [];
          const itemArr = item.specialType?.split(',') ?? [];

          if (dbArr.length > itemArr.length && !checker(dbArr, itemArr))
            throw `'${key}' Merge Conflict with (${dbItem.internal_id})`;
          else if (dbArr.length < itemArr.length && checker(itemArr, dbArr))
            dbItem.specialType = item.specialType;
        }

        // check some default values
        // neopets sometimes changes est_val randomly
        else if (forceMerge.includes(key)) {
          if (
            (key == 'status' && dbItem.status == 'active') ||
            (key == 'type' && dbItem.type == 'np') ||
            (key == 'est_val' && dbItem.est_val)
          )
            //@ts-ignore
            dbItem[key] = item[key];

          // @ts-ignore
          dbItem[key] ||= item[key] ?? dbItem[key];
        }

        // check if we're gaining info with description
        else if (key === 'description' && item.description && dbItem.description) {
          if (dbItem.description.trim().length < item.description.trim().length) {
            if (item.description.trim().includes(dbItem.description.trim()))
              dbItem.description = item.description;
            else throw `'${key}' Merge Conflict with (${dbItem.internal_id})`;
          }
        }

        // sdb sometimes calls things "special" when they're not
        else if (key === 'category') {
          const dbCatetory = dbItem.category?.toLowerCase() ?? '';
          const itemCategory = item.category?.toLowerCase() ?? '';

          if (
            (genericCats.includes(dbCatetory) && !genericCats.includes(itemCategory)) ||
            (!categoryToShopID[dbCatetory] && categoryToShopID[itemCategory])
          )
            dbItem.category = item.category;
          else if (
            itemCategory !== dbCatetory &&
            !genericCats.includes(itemCategory) &&
            !genericCats.includes(dbCatetory) &&
            categoryToShopID[itemCategory] &&
            categoryToShopID[dbCatetory]
          )
            throw `'${key}' Merge Conflict with (${dbItem.internal_id})`;
        } else throw `'${key}' Merge Conflict with (${dbItem.internal_id})`;
      }

      hasChange ||= dbItem[key] !== temp;
    }

    // no new data
    if (!hasChange) return undefined;

    // yay new data
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

    manualChecks.push({ error: e, item });

    return undefined;
  }
}

export async function getPallete(item: Items) {
  if (!item.image || !item.image_id) return undefined;
  const pallete = await Vibrant.from(item.image).quality(1).getPalette();

  const colors = [];
  let maxPop: [string, number] = ['', 0];

  for (const [key, val] of Object.entries(pallete)) {
    const color = Color.rgb(val?.rgb ?? [255, 255, 255]);
    const lab = color.lab().array();
    const hsv = color.hsv().array();
    const hex = color.hex();

    const colorData = {
      image_id: item.image_id,
      image: item.image,

      lab_l: lab[0],
      lab_a: lab[1],
      lab_b: lab[2],

      hsv_h: hsv[0],
      hsv_s: hsv[1],
      hsv_v: hsv[2],

      rgb_r: val?.rgb[0] ?? 255,
      rgb_g: val?.rgb[1] ?? 255,
      rgb_b: val?.rgb[2] ?? 255,

      hex: hex,

      type: key.toLowerCase(),
      population: val?.population ?? 0,
      isMaxPopulation: false,
    };

    if (colorData.population > maxPop[1]) maxPop = [colorData.type, colorData.population];

    colors.push(colorData);
  }

  const i = colors.findIndex((x) => x.type === maxPop[0]);
  colors[i].isMaxPopulation = true;

  return colors;
}

async function processOpenables() {
  const queue = await prisma.openableQueue.findMany({
    where: {
      processed: false,
      manual_check: null,
    },
  });

  const processPromises = queue.map(async (openable) => {
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
  });

  await Promise.all(processPromises);
}

// check if all elements in target are in arr
const checker = (arr: any[], target: any[]) => target.every((v) => arr.includes(v));

const genericCats = ['special', 'gift', 'food', 'clothes', 'neogarden', 'neohome'];

const checkEat = (category?: string | null) =>
  allFoodsCats.filter((x) => x.toLowerCase() === category?.toLowerCase()).length > 0;
const checkPlay = (category?: string | null) =>
  allPlayCats.filter((x) => x.toLowerCase() === category?.toLowerCase()).length > 0;
const checkRead = (category?: string | null) =>
  allBooksCats.filter((x) => x.toLowerCase() === category?.toLowerCase()).length > 0;
