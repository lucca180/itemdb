/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import requestIp from 'request-ip';
import hash from 'object-hash';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { checkHash } from '../../../../utils/hash';
import { getManyItems } from './many';
import { Prisma } from '@prisma/generated/client';
import { allCategories } from '@utils/allCats';

const TARNUM_KEY = process.env.TARNUM_KEY;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  let limit = req.query.limit ? Number(req.query.limit) : 50;
  limit = Math.min(limit, 100);
  const includeOld = req.query.includeOld ? req.query.includeOld === 'true' : false;

  const items = await getLatestItems(limit, !includeOld);

  return res.status(200).json(items);
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const tarnumkey = req.headers['tarnumkey'] as string | undefined;
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const items = data.items;
  const lang = data.lang;
  // const dataHash = data.hash;

  // if (!checkHash(dataHash, { items: items }))
  // return res.status(400).json({ error: 'Invalid hash' });

  if (lang !== 'en') return res.status(400).json({ error: 'Language not supported' });

  const meta = req.headers['itemdb-version'];
  if (!meta && tarnumkey !== TARNUM_KEY)
    return res.status(500).json({ error: 'Internal Server Error' });

  const requestMeta = {
    itemdbVersion: meta || 'direct-api',
    dataSource: data.dataSource || 'unknown',
  };

  const dataList = [];
  for (const item of items) {
    let {
      itemId,
      item_id,
      name,
      description,
      img,
      category,
      rarity,
      estVal,
      subText,
      status,
      type,
      weight,
      isBD,
    } = item;
    let imageId: string | undefined = undefined;

    itemId = item_id ?? itemId;

    rarity = isNaN(Number(rarity)) ? undefined : Number(rarity);
    estVal = isNaN(Number(estVal)) ? undefined : Number(estVal);
    weight = isNaN(Number(weight)) ? undefined : Number(weight);
    itemId = isNaN(Number(itemId)) ? undefined : Number(itemId);

    if (!name || !img || /[\d\,\.]+\WNP/gm.test(name)) continue;

    if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');
    if (!img.includes('images.neopets.com/items/')) continue;

    if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';

    if (!imageId) continue;

    if (category === 'Neocash') {
      category = undefined;
      type = 'nc';
    }

    let specialTypes: string[] | string | undefined = [];

    if (subText) {
      if (
        subText.toLowerCase().includes('neocash') ||
        subText.toLowerCase().includes('artifact - 500')
      )
        type = 'nc';

      if (subText.toLowerCase().includes('no trade')) status = 'no trade';

      specialTypes = (subText as string).match(/(?<=\().+?(?=\))/gm) ?? [];
    }

    if (rarity === 500) type = 'nc';
    const isNC = type === 'nc' || rarity === 500;

    if (description?.includes('deluxe paint brush set')) type = 'pb';

    if (type === 'pb') status = 'no trade';

    status = status ?? 'active';

    specialTypes = specialTypes?.length > 0 ? specialTypes?.toString() : undefined;

    if (category && !allCategories.includes(category.toLowerCase())) continue;

    const x: Prisma.ItemProcessCreateManyInput = {
      item_id: itemId,
      name: name.trim(),
      description: description?.trim(),
      category: category,
      image: img,
      image_id: imageId,
      rarity: rarity ?? (isNC ? 500 : undefined),
      est_val: isNC && !estVal ? 0 : estVal,
      weight: isNC && !weight ? 1 : weight,
      status: status,
      type: type ?? 'np',
      isNC: isNC,
      isBD: isBD ?? undefined,
      specialType: specialTypes,
      isWearable: !!specialTypes?.includes('wearable'),
      language: lang as string,
      ip_address: requestIp.getClientIp(req),
      hash: '',
      meta: JSON.stringify(requestMeta),
    };

    x.hash = hash(x, {
      excludeKeys: (key: string) => ['ip_address', 'hash', 'meta'].includes(key),
    });

    dataList.push(x);
  }

  let tries = 0;
  while (tries <= 3) {
    try {
      const result = await prisma.itemProcess.createMany({
        data: dataList,
        skipDuplicates: true,
      });

      return res.json(result);
    } catch (e: any) {
      // prevent race condition
      if (['P2002', 'P2034'].includes(e.code) && tries < 3) {
        tries++;
        continue;
      }

      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(500).json({ error: 'Internal Server Error' });
};

export const getLatestItems = async (limit: number, skipOldIDs = false, onlyWearable = false) => {
  const result = await prisma.items.findMany({
    where: {
      canonical_id: null,
      OR: [{ item_id: null }, { item_id: { gte: skipOldIDs ? 85020 : 0 } }],
      isWearable: onlyWearable ? true : undefined,
    },
    orderBy: [
      {
        addedAt: 'desc',
      },
      {
        internal_id: 'asc',
      },
    ],
    select: {
      internal_id: true,
      addedAt: true,
    },
    take: limit,
  });

  const items = await getManyItems({
    id: result.map((data) => data.internal_id.toString()),
  });

  // sort by addedAt
  return Object.values(items).sort((a, b) => {
    return (
      result.findIndex((data) => data.internal_id === a.internal_id) -
      result.findIndex((data) => data.internal_id === b.internal_id)
    );
  });
};
