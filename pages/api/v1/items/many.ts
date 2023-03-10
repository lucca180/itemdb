/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getItemFindAtLinks, isMissingInfo } from '../../../../utils/utils';
import { ItemData } from '../../../../types';
import { Prisma } from '@prisma/client';
import qs from 'qs';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    return res.status(200).json({});
  }

  if (req.method !== 'GET' && req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  let reqData;

  if (req.method == 'POST')
    reqData = {
      id: req.body.id,
      item_id: req.body.item_id,
      name_image_id: req.body.name_image_id,
      image_id: req.body.image_id,
      name: req.body.name,
    };
  else if (req.method == 'GET' && req.url) reqData = qs.parse(req.url.split('?')[1]);
  if (!reqData) return res.status(400).json({ error: 'Invalid request' });

  const ids = reqData.id as string[];
  const item_id = reqData.item_id as string[];
  const name_image_id = reqData.name_image_id as [string, string][];
  const image_id = reqData.image_id as string[];
  const name = reqData.name as string[];

  if (!ids && !item_id && !image_id && !name && !name_image_id)
    return res.status(400).json({ error: 'Invalid request' });

  if (
    ids?.length === 0 &&
    item_id?.length === 0 &&
    image_id?.length === 0 &&
    name?.length === 0 &&
    name_image_id?.length === 0
  )
    return res.status(400).json({ error: 'Invalid request' });

  const items = await getManyItems({
    id: ids,
    item_id: item_id,
    name_image_id: name_image_id,
    image_id: image_id,
    name: name,
  });

  res.json(items);
}

export const getManyItems = async (queryObj: {
  id?: string[];
  item_id?: string[];
  name_image_id?: [string, string][];
  image_id?: string[];
  name?: string[];
}) => {
  const { id, item_id, name_image_id, image_id, name } = queryObj;

  let query;
  if (id && id.length > 0) query = Prisma.sql`a.internal_id IN (${Prisma.join(id)})`;
  else if (item_id && item_id.length > 0)
    query = Prisma.sql`a.item_id IN (${Prisma.join(item_id)})`;
  else if (name_image_id && name_image_id.length > 0) {
    const convertToTuple = name_image_id.map((x) => Prisma.sql`(${x[0]}, ${x[1]})`);
    query = Prisma.sql`(a.name, a.image_id) IN (${Prisma.join(convertToTuple)})`;
  } else if (image_id && image_id.length > 0)
    query = Prisma.sql`a.image_id IN (${Prisma.join(image_id)})`;
  else if (name && name.length > 0) query = Prisma.sql`a.name IN (${Prisma.join(name)})`;

  if (!query) return {};
  const resultRaw = (await prisma.$queryRaw`
    SELECT a.*, b.lab_l, b.lab_a, b.lab_b, b.population, b.rgb_r, b.rgb_g, b.rgb_b, b.hex, 
      c.addedAt as priceAdded, c.price, c.noInflation_id
    FROM Items as a
    LEFT JOIN ItemColor as b on a.image_id = b.image_id and b.type = "Vibrant"
    LEFT JOIN (
      SELECT *
      FROM ItemPrices
      WHERE (item_iid, addedAt) IN (
          SELECT item_iid, MAX(addedAt)
          FROM ItemPrices
          GROUP BY item_iid
      ) AND manual_check IS null
    ) as c on c.item_iid = a.internal_id
    WHERE ${query}
    `) as any[];

  if (!resultRaw || resultRaw.length === 0) return {};

  const items: { [identifier: string]: ItemData } = {};

  for (const result of resultRaw) {
    const x: ItemData = {
      internal_id: result.internal_id,
      image: result.image,
      image_id: result.image_id,
      item_id: result.item_id,
      rarity: result.rarity,
      name: result.name,
      specialType: result.specialType,
      isNC: !!result.isNC,
      type: result.type,
      estVal: result.est_val,
      weight: result.weight,
      description: result.description ?? '',
      status: result.status,
      category: result.category,
      isNeohome: !!result.isNeohome,
      isWearable: !!result.specialType?.includes('wearable') || !!result.isWearable,
      color: {
        rgb: [result.rgb_r, result.rgb_g, result.rgb_b],
        lab: [result.lab_l, result.lab_a, result.lab_b],
        hex: result.hex,
        type: 'vibrant',
        population: result.population,
      },
      findAt: getItemFindAtLinks(result), // doesnt have all the info we need :(
      isMissingInfo: false,
      price: {
        value: result.price,
        addedAt: result.priceAdded,
        inflated: !!result.noInflation_id,
      },
      comment: result.comment ?? null,
    };
    x.findAt = getItemFindAtLinks(x); // does have all the info we need :)
    x.isMissingInfo = isMissingInfo(x);

    if (id) items[result.internal_id] = x;
    else if (item_id) items[result.item_id] = x;
    else if (name_image_id) items[`${encodeURI(result.name.toLowerCase())}_${result.image_id}`] = x;
    else if (image_id) items[result.image_id] = x;
    else if (name) items[result.name] = x;
  }

  return items;
};
