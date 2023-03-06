/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Items as Item, ItemProcess, Items, ItemColor } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import Vibrant from 'node-vibrant';
import { genItemKey } from '../../../../utils/utils';
import Color from 'color';

type ValueOf<T> = T[keyof T];

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let limit = Number(req.body.limit) ?? 300;
  limit = isNaN(limit) ? 300 : limit;
  limit = Math.min(limit, 1000);

  const processList = await prisma.itemProcess.findMany({
    where: { language: 'en', manual_check: null, processed: false },
    take: limit,
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

  return res.json(result);
}

// If a item does not exist in the DB we use "createMany" but
// there is not a "updateMany" so we update here and return undefined
async function updateOrAddDB(item: ItemProcess): Promise<Partial<Item> | undefined> {
  try {
    if (!item.image_id || !item.image || !item.name) throw 'invalid data';

    const dbItemList = await prisma.items.findMany({
      where: { name: item.name, image_id: item.image_id },
    });

    // db has no entry -> add
    // db has one entry but it's not the same -> add
    if (
      dbItemList.length === 0 ||
      (dbItemList.length === 1 &&
        dbItemList[0].item_id &&
        item.item_id &&
        dbItemList[0].item_id !== item.item_id)
    ) {
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
        isWearable: item.isWearable,
        isNeohome: !!item.specialType?.toLowerCase().includes('neohome'),
        est_val: item.est_val,
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
    const forceMerge = ['type', 'isNC', 'isWearable', 'status', 'est_val'];
    for (const key of Object.keys(dbItem) as Array<keyof typeof dbItem>) {
      if (['internal_id', 'addedAt', 'updatedAt'].includes(key)) continue;

      if (!dbItem[key]) {
        const temp = dbItem[key];
        // @ts-ignore
        dbItem[key] ||= item[key] ?? dbItem[key];
        hasChange ||= dbItem[key] !== temp;
      }

      // merge conflict
      // @ts-ignore
      if (dbItem[key] && item[key] && dbItem[key] !== item[key]) {
        // check if we're gaining info with specialType
        if (key === 'specialType') {
          const dbArr = dbItem.specialType?.split(',') ?? [];
          const itemArr = item.specialType?.split(',') ?? [];

          if (dbArr.length > itemArr.length)
            throw `'${key}' Merge Conflict with (${dbItem.internal_id})`;

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
        else if (key === 'description') {
          if ((dbItem.description?.length ?? 0) < (item.description?.length ?? 0)) {
            dbItem.description = item.description;
          }
        }

        // sdb sometimes calls things "special" when they're not (this sounded mean)
        else if (key === 'category' && dbItem.category === 'special') {
          dbItem.category = item.category;
        } else throw `'${key}' Merge Conflict with (${dbItem.internal_id})`;
      }
    }

    // no new data
    if (!hasChange) return undefined;

    // yay new data
    const updatedItem = {
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
      updatedAt: new Date(),
    };

    await prisma.items.update({
      data: updatedItem,
      where: { internal_id: dbItem.internal_id },
    });

    return undefined;
  } catch (e) {
    if (typeof e !== 'string') {
      console.error(e);
      throw e;
    }

    await prisma.itemProcess.update({
      data: { manual_check: e },
      where: { internal_id: item.internal_id },
    });

    return undefined;
  }
}

async function getPallete(item: Items) {
  if (!item.image || !item.image_id) return undefined;
  const pallete = await Vibrant.from(item.image).getPalette();

  const colors = [];

  for (const [key, val] of Object.entries(pallete)) {
    if (!val) continue;
    const color = Color.rgb(val.rgb);
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

      rgb_r: val.rgb[0],
      rgb_g: val.rgb[1],
      rgb_b: val.rgb[2],

      hex: hex,

      type: key.toLowerCase(),
      population: val.population,
    };

    colors.push(colorData);
  }

  return colors;
}
