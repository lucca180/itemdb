import { Items as Item, ItemProcess, Items, ItemColor } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import Vibrant from 'node-vibrant';
import { genItemKey } from '../../../../utils/utils';
import Color from 'color';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const processList = await prisma.itemProcess.findMany({
    where: { language: 'en', manual_check: null },
    take: 300,
  });

  // list of unique entries
  const uniqueNames = [...processList].filter(
    (value, index, self) =>
      index === self.findIndex((t) => genItemKey(t) === genItemKey(value))
  );

  const deleteIds: number[] = [];
  const itemAddPromises: Promise<Items | undefined>[] = [];

  // for each unique entry we get the repeated ones and "merge" all the data we have
  for (const item of uniqueNames) {
    const allItemData = processList.filter(
      (x) => genItemKey(x) === genItemKey(item)
    );
    const itemData = { ...item };

    for (const itemOtherData of allItemData) {
      for (const key of Object.keys(itemData))
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
        itemData[key] ??= itemOtherData[key];

      deleteIds.push(itemOtherData.internal_id);
    }

    itemAddPromises.push(updateOrAddDB(itemData));
  }

  // remove the 'undefined' and add new items to db
  const itemAddList = (await Promise.all(itemAddPromises)).filter(
    (x) => !!x
  ) as Item[];

  const itemColorAddList = (
    await Promise.all(itemAddList.map((i) => getPallete(i)))
  )
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
      data:{
        processed: true
      }
    })
  ])
  
  return res.json(result);
}

// If a item does not exist in the DB we use "createMany" but
// there is not a "updateMany" so we update here and return undefined
async function updateOrAddDB(item: ItemProcess): Promise<Items | undefined> {
  try {
    if (!item.image_id || !item.image || !item.name) throw 'invalid data';

    const dbItemList = await prisma.items.findMany({
      where: { name: item.name, image_id: item.image_id },
    });

    // db has none or two items with same name/image_id combo but different ids -> create
    if (
      dbItemList.length === 0 ||
      (dbItemList.length === 1 &&
        dbItemList[0].item_id &&
        item.item_id &&
        dbItemList[0].item_id !== item.item_id)
    ) {
      // delete some useless internal fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newItem = { ...item } as any;
      delete newItem.internal_id;
      delete newItem.updatedAt;
      delete newItem.addedAt;
      delete newItem.language;
      delete newItem.manual_check;
      delete newItem.ip_address;

      return newItem;
    }

    // db has more than one -> manual check
    if (dbItemList.length > 1)
      throw 'More than one entry exists with the same name.';

    const dbItem = dbItemList[0];

    // merge the data we're missing
    let hasChange = false;
    for (const key of Object.keys(dbItem) as Array<keyof typeof dbItem>) {
      if (['internal_id', 'addedAt', 'updatedAt'].includes(key)) continue;

      if (!dbItem[key]) {
        const temp = dbItem[key];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        dbItem[key] ??= item[key];
        hasChange ||= dbItem[key] !== temp;

        //yeah two weird operators in the same block \o/
      }

      // merge conflict
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (dbItem[key] && item[key] && dbItem[key] !== item[key]) {
        // check if we're gaining info with specialType
        if (key === 'specialType') {
          const dbArr = dbItem.specialType?.split(',') ?? [];
          const itemArr = item.specialType?.split(',') ?? [];
          if (dbArr.length > itemArr.length)
            throw `'${key}' Merge Conflict with (${dbItem.internal_id})`;
        } else throw `'${key}' Merge Conflict with (${dbItem.internal_id})`;
      }
    }

    // no new data
    if (!hasChange) return undefined;

    // yay new data
    await prisma.items.update({
      data: dbItem,
      where: { internal_id: dbItem.internal_id },
    });

    return undefined;
  } catch (e) {
    if (typeof e !== 'string') throw e;

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
