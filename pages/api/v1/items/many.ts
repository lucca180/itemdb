/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getItemFindAtLinks, isMissingInfo } from '../../../../utils/utils';
import { ItemData } from '../../../../types';
import { Prisma } from '@prisma/client';
import qs from 'qs';

const DISABLE_SALE_STATS = process.env.DISABLE_SALE_STATS === 'true';

export const config = {
  api: {
    responseLimit: false,
  },
};

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
      slug: req.body.slug,
    };
  else if (req.method == 'GET' && req.url) reqData = qs.parse(req.url.split('?')[1]);
  if (!reqData) return res.status(400).json({ error: 'Invalid request' });

  const ids = reqData.id as string[];
  const item_id = reqData.item_id as string[];
  const name_image_id = reqData.name_image_id as [string, string][];
  const image_id = reqData.image_id as string[];
  const name = reqData.name as string[];
  const slug = reqData.slug as string[];

  if (!ids && !item_id && !image_id && !name && !name_image_id && !slug)
    return res.status(400).json({ error: 'Invalid request' });

  if (
    ids?.length === 0 &&
    item_id?.length === 0 &&
    image_id?.length === 0 &&
    name?.length === 0 &&
    name_image_id?.length === 0 &&
    slug?.length === 0
  )
    return res.status(400).json({ error: 'Invalid request' });

  const items = await getManyItems(
    {
      id: ids,
      item_id: item_id,
      name_image_id: name_image_id,
      image_id: image_id,
      name: name,
      slug: slug,
    },
    10000
  );

  return res.json(items);
}

export const getManyItems = async (
  queryObj: FindManyQuery,
  limit = 60000
): Promise<{ [identifier: string]: ItemData }> => {
  const { id, item_id, name_image_id, image_id, name, slug } = queryObj;

  let query;
  if (id && id.length > 0) query = Prisma.sql`a.internal_id IN (${Prisma.join(id)})`;
  else if (item_id && item_id.length > 0)
    query = Prisma.sql`a.item_id IN (${Prisma.join(item_id)})`;
  else if (name_image_id && name_image_id.length > 0) {
    const convertToTuple = name_image_id.map((x) => Prisma.sql`(${x[0]}, ${x[1]})`);
    query = Prisma.sql`(a.name, a.image_id) IN (${Prisma.join(
      convertToTuple
    )}) AND a.canonical_id is null`;
  } else if (image_id && image_id.length > 0)
    query = Prisma.sql`a.image_id IN (${Prisma.join(image_id)}) AND a.canonical_id is null`;
  else if (name && name.length > 0)
    query = Prisma.sql`a.name IN (${Prisma.join(name)}) AND a.canonical_id is null`;
  else if (slug && slug.length > 0) query = Prisma.sql`a.slug IN (${Prisma.join(slug)})`;

  if (!query) return {};
  const resultRaw = (await prisma.$queryRaw`
    SELECT a.*, b.lab_l, b.lab_a, b.lab_b, b.population, b.rgb_r, b.rgb_g, b.rgb_b, b.hex,
      b.hsv_h, b.hsv_s, b.hsv_v,
      c.addedAt as priceAdded, c.price, c.noInflation_id, 
      d.pricedAt as owlsPriced, d.value as owlsValue, d.valueMin as owlsValueMin,
      s.totalSold, s.totalItems, s.stats, s.daysPeriod
    FROM Items as a
    LEFT JOIN ItemColor as b on a.image_id = b.image_id and b.type = "Vibrant"
    LEFT JOIN (
      SELECT *
      FROM ItemPrices
      WHERE (item_iid, addedAt) IN (
          SELECT item_iid, MAX(addedAt)
          FROM ItemPrices
          where manual_check is null
          GROUP BY item_iid
      ) AND manual_check IS null
    ) as c on c.item_iid = a.internal_id
    LEFT JOIN (
      SELECT *
      FROM OwlsPrice
      WHERE (item_iid, addedAt) IN (
          SELECT item_iid, MAX(addedAt)
          FROM OwlsPrice
          GROUP BY item_iid
      )
    ) as d on d.item_iid = a.internal_id
    LEFT JOIN (
      SELECT *
      FROM SaleStats
      WHERE (item_iid, addedAt) IN (
          SELECT item_iid, MAX(addedAt)
          FROM SaleStats
          GROUP BY item_iid
      )
    ) as s on s.item_iid = a.internal_id
    WHERE ${query}
    LIMIT ${limit}
    `) as any[];

  if (!resultRaw || resultRaw.length === 0) return {};

  const items: { [identifier: string]: ItemData } = {};

  for (const result of resultRaw) {
    const x: ItemData = {
      internal_id: result.internal_id,
      canonical_id: result.canonical_id ?? null,
      image: result.image,
      image_id: result.image_id,
      item_id: result.item_id,
      rarity: result.rarity,
      name: result.name,
      // specialType: result.specialType,
      isNC: !!result.isNC,
      isBD: !!result.isBD,
      type: result.type,
      estVal: result.est_val,
      weight: result.weight,
      description: result.description ?? '',
      status: result.status,
      category: result.category,
      isNeohome: !!result.isNeohome,
      isWearable: !!result.specialType?.includes('wearable') || !!result.isWearable,
      firstSeen:
        (result.item_id >= 85020 && result.type !== 'pb'
          ? new Date(result.addedAt).toJSON()
          : null) ?? null,
      color: {
        hsv: [result.hsv_h, result.hsv_s, result.hsv_v],
        rgb: [result.rgb_r, result.rgb_g, result.rgb_b],
        lab: [result.lab_l, result.lab_a, result.lab_b],
        hex: result.hex,
        type: 'vibrant',
        population: result.population,
      },
      findAt: getItemFindAtLinks(result), // doesnt have all the info we need :(
      isMissingInfo: false,
      price: {
        value: result.price ? result.price.toNumber() : null,
        addedAt: (result.priceAdded as Date | null)?.toJSON() ?? null,
        inflated: !!result.noInflation_id,
      },
      owls: result.owlsValue
        ? {
            value: result.owlsValue,
            pricedAt: result.owlsPriced?.toJSON() ?? null,
            valueMin: result.owlsValueMin,
            buyable: result.owlsValue.toLowerCase().includes('buyable'),
          }
        : null,
      comment: result.comment ?? null,
      slug: result.slug ?? null,
      saleStatus:
        result.totalSold && !DISABLE_SALE_STATS
          ? {
              sold: result.totalSold,
              total: result.totalItems,
              percent: Math.round((result.totalSold / result.totalItems) * 100),
              status: result.stats,
              type: result.daysPeriod,
            }
          : null,
      useTypes: {
        canEat: result.canEat,
        canRead: result.canRead,
        canOpen: result.canOpen,
        canPlay: result.canPlay,
      },
    };
    x.findAt = getItemFindAtLinks(x); // does have all the info we need :)
    x.isMissingInfo = isMissingInfo(x);

    if (id) items[result.internal_id] = x;
    else if (item_id) items[result.item_id] = x;
    else if (name_image_id) items[`${encodeURI(result.name.toLowerCase())}_${result.image_id}`] = x;
    else if (image_id) items[result.image_id] = x;
    else if (name) items[result.name] = x;
    else if (slug) items[result.slug] = x;
  }

  return items;
};

export type FindManyQuery = {
  id?: string[];
  item_id?: string[];
  name_image_id?: [string, string][];
  image_id?: string[];
  name?: string[];
  slug?: string[];
};
