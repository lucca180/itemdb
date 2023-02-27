/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { getItemFindAtLinks, isMissingInfo } from '../../../utils/utils';
import { ItemData } from '../../../types';
import Color from 'color';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const id = req.query.id;

  const resultRaw = (await prisma.$queryRaw`
        SELECT a.*, b.l, b.a, b.b, b.population, c.addedAt as priceAdded, c.price, c.noInflation_id 
        FROM Items as a
        LEFT JOIN ItemColorLab as b on a.image_id = b.image_id
        LEFT JOIN ItemPrices as c on c.internal_id = (
            SELECT internal_id
            FROM ItemPrices
            WHERE (item_id = a.item_id OR (name = a.name AND image_id = a.image_id))
            ORDER BY addedAT DESC
            LIMIT 1
        )
        WHERE b.type = "Vibrant" AND a.internal_id = ${id}
        
    `) as any[];

  if (resultRaw.length === 0) res.json(null);

  const result = resultRaw[0];
  const colorlab = Color.lab(result.l, result.a, result.b);

  const item: ItemData = {
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

  item.findAt = getItemFindAtLinks(item); // does have all the info we need :)
  item.isMissingInfo = isMissingInfo(item);

  res.json(item);
}
