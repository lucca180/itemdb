import { OpenableQueue, Prisma } from '@prisma/generated/client';
import Chance from 'chance';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getManyItems } from './many';
import requestIp from 'request-ip';

const chance = new Chance();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const items = data.items;
  const parentItem = data.parentItem;
  const gramInfo = data.gramInfo as
    | {
        cash_id: string;
        options: string[];
      }
    | undefined;
  const lang = data.lang;

  if (lang !== 'en') return res.status(400).json({ error: 'Language not supported' });

  const name_image_id = items
    .map((item: any) => {
      let { name, img } = item;
      let imageId: string | undefined = undefined;

      if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');
      if (!img.includes('images.neopets.com/items/')) return undefined;
      if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';
      if (!imageId) return undefined;

      return [name, imageId];
    })
    .filter((item: any) => item);

  let parent_name_image_id = undefined;
  if (parentItem) {
    let { name, img } = parentItem;
    let imageId: string | undefined = undefined;

    if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');
    if (!img.includes('images.neopets.com/items/'))
      return res.status(400).json({ error: 'invalid parent' });
    if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';
    if (!imageId) return res.status(400).json({ error: 'invalid parent' });

    parent_name_image_id = [name, imageId];
  }

  const itemsData = await getManyItems({
    name_image_id: [...name_image_id, parent_name_image_id],
    includeFlags: true,
  });

  const opening_id = gramInfo?.cash_id || chance.hash({ length: 15 });

  const exists = await prisma.openableItems.findFirst({
    where: {
      opening_id: opening_id,
    },
    select: {
      opening_id: true,
    },
  });

  if (exists) return res.status(400).json({ error: 'opening_id already exists' });

  const ip_address = requestIp.getClientIp(req);

  const parentData = Object.values(itemsData).find((data: any) => data.name === parentItem.name);

  if (!parentData) {
    const queueProm = items.map(async (item: any) => {
      await addToQueue(item, parentItem, opening_id, ip_address);
    });

    await Promise.all(queueProm);
    return res.status(400).json({ error: 'unknown parent' });
  }

  let noUnknownList: number[] = [];
  if (parentData.itemFlags && parentData.itemFlags.includes('no-unknown')) {
    const existingOpenResults = await prisma.openableItems.findMany({
      distinct: ['item_iid'],
      where: {
        parent_iid: parentData.internal_id,
      },
      select: {
        item_iid: true,
      },
    });

    noUnknownList = existingOpenResults.map((x) => x.item_iid);
  }

  const openableItemsPromise: Promise<Prisma.OpenableItemsUncheckedCreateInput | undefined>[] =
    items.map(async (item: any): Promise<Prisma.OpenableItemsUncheckedCreateInput | undefined> => {
      const itemData = Object.values(itemsData).find((data: any) => data.name === item.name);
      if (!itemData) {
        await addToQueue(item, parentItem, opening_id, ip_address);
        return undefined;
      }

      if (noUnknownList.length) {
        if (!noUnknownList.includes(itemData.internal_id)) return undefined;
      }

      return {
        opening_id: opening_id,
        item_iid: itemData.internal_id,
        parent_iid: parentData.internal_id,
        limitedEdition: item.isLE || false,
        notes: item.notes || null,
        ip_address: ip_address,
      };
    });

  const openableItems = (await Promise.all(openableItemsPromise)).filter(
    (item) => item
  ) as Prisma.OpenableItemsUncheckedCreateInput[];

  if (gramInfo?.options?.length) {
    const itemNameData = await getManyItems({
      name: gramInfo.options as string[],
    });

    Object.values(itemNameData).map((itemData) => {
      if (!itemData.isNC) return;

      const data = {
        opening_id: opening_id,
        item_iid: itemData.internal_id,
        parent_iid: parentData.internal_id,
        limitedEdition: false,
        notes: 'gramOption',
        ip_address: ip_address,
      };

      openableItems.push(data);
    });
  }

  const openableItemData = await prisma.openableItems.createMany({
    data: openableItems,
  });

  return res.status(200).json(openableItemData);
};

export const processOpenableItems = async (openableItem: OpenableQueue) => {
  const { opening_id, ip_address } = openableItem;
  const item = {
    name: openableItem.name,
    img: openableItem.image,
    notes: openableItem.notes,
    isLE: openableItem.limitedEdition,
  };

  const parentItem = {
    name: openableItem.parent_name,
    img: openableItem.parent_image,
  };

  let { name, img } = item;
  let imageId: string | undefined = undefined;

  if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');
  if (!img.includes('images.neopets.com/items/')) throw 'invalid item';
  if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';
  if (!imageId) throw 'invalid item';

  const name_image_id: [string, string] = [name, imageId];

  let parent_name_image_id: [string, string] | undefined = undefined;
  if (parentItem) {
    let { name, img } = parentItem;
    let imageId: string | undefined = undefined;

    if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');
    if (!img.includes('images.neopets.com/items/')) throw 'invalid parent';
    if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';
    if (!imageId) throw 'invalid parent';

    parent_name_image_id = [name, imageId];
  }
  if (!parent_name_image_id) throw 'invalid parent';

  const itemsData = await getManyItems({
    name_image_id: [name_image_id, parent_name_image_id],
  });

  const parentData = Object.values(itemsData).find((data: any) => data.name === parentItem.name);

  if (!parentData) throw 'unknown parent';

  const openableItemsPromise: Promise<Prisma.OpenableItemsUncheckedCreateInput | undefined>[] = [
    item,
  ].map(async (item: any): Promise<Prisma.OpenableItemsUncheckedCreateInput | undefined> => {
    const itemData = Object.values(itemsData).find((data: any) => data.name === item.name);
    if (!itemData) {
      throw 'unknown item';
    }

    return {
      opening_id: opening_id,
      item_iid: itemData.internal_id,
      parent_iid: parentData.internal_id,
      limitedEdition: item.isLE || false,
      notes: item.notes || null,
      ip_address: ip_address,
    };
  });

  const openableItems = (await Promise.all(openableItemsPromise)).filter(
    (item) => item
  ) as Prisma.OpenableItemsUncheckedCreateInput[];

  const openableItemData = await prisma.openableItems.createMany({
    data: openableItems,
  });

  return openableItemData;
};

const addToQueue = async (
  item: any,
  parent: any,
  opening_id: string,
  ip_address: string | null
) => {
  return prisma.openableQueue.create({
    data: {
      parent_name: parent.name,
      parent_image: parent.img,
      name: item.name,
      image: item.img,
      notes: item.notes,
      opening_id: opening_id,
      limitedEdition: item.isLE || false,
      ip_address: ip_address,
    },
  });
};
