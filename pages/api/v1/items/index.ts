/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ItemData } from '../../../../types';
import { getItemFindAtLinks, isMissingInfo } from '../../../../utils/utils';
import requestIp from 'request-ip';
import hash from 'object-hash';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { checkHash } from '../../../../utils/hash';

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
    ORDER BY a.addedAt DESC
    LIMIT ${limit}
  `) as any;

  const filteredResult = resultRaw;

  const itemList: ItemData[] = filteredResult.map((result: any) => {
    const item: ItemData = {
      internal_id: result.internal_id,
      image: result.image ?? '',
      image_id: result.image_id ?? '',
      item_id: result.item_id,
      rarity: result.rarity,
      name: result.name,
      specialType: result.specialType,
      type: result.type,
      isNC: !!result.isNC,
      estVal: result.est_val,
      weight: result.weight,
      description: result.description ?? '',
      category: result.category,
      status: result.status,
      isNeohome: !!result.isNeohome,
      isWearable: !!result.specialType?.includes('wearable') || !!result.isWearable,
      color: {
        hsv: [result.hsv_h, result.hsv_s, result.hsv_v],
        rgb: [result.rgb_r, result.rgb_g, result.rgb_b],
        lab: [result.lab_l, result.lab_a, result.lab_b],
        hex: result.hex,
        type: 'vibrant',
        population: result.population,
      },
      findAt: getItemFindAtLinks(result),
      isMissingInfo: false,
      price: {
        value: result.price,
        addedAt: result.priceAdded,
        inflated: !!result.noInflation_id,
      },
      comment: result.comment ?? null,
      slug: result.slug ?? null,
    };

    item.findAt = getItemFindAtLinks(item); // does have all the info we need :)
    item.isMissingInfo = isMissingInfo(item);

    return item;
  });

  return res.json(itemList);
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const items = data.items;
  const lang = data.lang;
  const dataHash = data.hash;

  // if (!checkHash(dataHash, { items: items }))
  // return res.status(400).json({ error: 'Invalid hash' });

  if (lang !== 'en') return res.status(400).json({ error: 'Language not supported' });

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
    } = item;
    let imageId: string | undefined = undefined;

    itemId = item_id ?? itemId;

    rarity = isNaN(Number(rarity)) ? undefined : Number(rarity);
    estVal = isNaN(Number(estVal)) ? undefined : Number(estVal);
    weight = isNaN(Number(weight)) ? undefined : Number(weight);
    itemId = isNaN(Number(itemId)) ? undefined : Number(itemId);

    if (!name || !img) continue;

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

    const x = {
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
      specialType: specialTypes,
      isWearable: !!specialTypes?.includes('wearable'),
      language: lang as string,
      ip_address: requestIp.getClientIp(req),
      hash: '',
    };

    x.hash = hash(x, {
      excludeKeys: (key: string) => ['ip_address', 'hash'].includes(key),
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
