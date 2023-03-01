/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getItemFindAtLinks, isMissingInfo } from '../../../../utils/utils';
import { ItemData } from '../../../../types';
import Color from 'color';
import { Prisma } from '@prisma/client';
import qs from 'qs';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  let reqData;

  if (req.method == 'POST')
    reqData = {
      id: req.body.id,
      item_id: req.body.item_id,
      image_id: req.body.image_id,
      name: req.body.name,
    };
  else if (req.method == 'GET' && req.url)
    reqData = qs.parse(req.url.split('?')[1]);

  if (!reqData)
    return res.status(400).json({ success: false, message: 'Invalid request' });

  const ids = reqData.id as string[];
  const item_id = reqData.item_id as string[];
  const image_id = reqData.image_id as string[];
  const name = reqData.name as string[];

  if (!ids && !item_id && !image_id && !name)
    return res.status(400).json({ success: false, message: 'Invalid request' });

  if (
    ids?.length === 0 &&
    item_id?.length === 0 &&
    image_id?.length === 0 &&
    name?.length === 0
  )
    return res.status(400).json({ success: false, message: 'Invalid request' });

  let query;
  if (ids?.length > 0)
    query = Prisma.sql`a.internal_id IN (${Prisma.join(ids)})`;
  else if (item_id?.length > 0)
    query = Prisma.sql`a.item_id IN (${Prisma.join(item_id)})`;
  else if (image_id?.length > 0)
    query = Prisma.sql`a.image_id IN (${Prisma.join(image_id)})`;
  else if (name?.length > 0)
    query = Prisma.sql`a.name IN (${Prisma.join(name)})`;

  if (!query)
    return res.status(400).json({ success: false, message: 'Invalid request' });

  const resultRaw = (await prisma.$queryRaw`
        SELECT a.*, b.lab_l, b.lab_a, b.lab_b, b.population, c.addedAt as priceAdded, c.price, c.noInflation_id 
        FROM Items as a
        LEFT JOIN ItemColor as b on a.image_id = b.image_id
        LEFT JOIN ItemPrices as c on c.internal_id = (
            SELECT internal_id
            FROM ItemPrices
            WHERE (item_id = a.item_id OR (name = a.name AND image_id = a.image_id))
            ORDER BY addedAT DESC
            LIMIT 1
        )
        WHERE b.type = "Vibrant" AND ${query}
    `) as any[];

  if (resultRaw.length === 0) res.json([]);

  const items: { [identifier: string]: ItemData } = {};

  for (const result of resultRaw) {
    const colorlab = Color.lab(result.lab_l, result.lab_a, result.lab_b);

    const x: ItemData = {
      internal_id: result.internal_id,
      image: result.image,
      image_id: result.image_id,
      item_id: result.item_id,
      rarity: result.rarity,
      name: result.name,
      specialType: result.specialType,
      isNC: !!result.isNC,
      est_val: result.est_val,
      weight: result.weight,
      description: result.description ?? '',
      status: result.status,
      category: result.category,
      isNeohome: !!result.isNeohome,
      isWearable:
        !!result.specialType?.includes('wearable') || !!result.isWearable,
      color: {
        rgb: colorlab.rgb().round().array(),
        lab: colorlab.round().array(),
        hex: colorlab.hex(),
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

    if (ids) items[result.internal_id] = x;
    else if (item_id) items[result.item_id] = x;
    else if (image_id) items[result.image_id] = x;
    else if (name) items[result.name] = x;
  }

  res.json(items);
}
