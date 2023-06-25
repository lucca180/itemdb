import { Prisma } from '@prisma/client';
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
  });

  const parentData = Object.values(itemsData).find((data: any) => data.name === parentItem.name);
  if (!parentData) return res.status(400).json({ error: 'unknown parent' });
  const opening_id = chance.hash({ length: 15 });

  const ip_address = requestIp.getClientIp(req);

  const openableItems: Prisma.OpenableItemsUncheckedCreateInput[] = items
    .map((item: any): Prisma.OpenableItemsUncheckedCreateInput | undefined => {
      const itemData = Object.values(itemsData).find((data: any) => data.name === item.name);
      if (!itemData) return undefined;

      return {
        opening_id: opening_id,
        item_iid: itemData.internal_id,
        parent_iid: parentData.internal_id,
        limitedEdition: item.isLE || false,
        notes: item.notes || null,
        ip_address: ip_address,
      };
    })
    .filter((a: any) => !!a);

  const openableItemData = await prisma.openableItems.createMany({
    data: openableItems,
  });

  return res.status(200).json(openableItemData);
};
