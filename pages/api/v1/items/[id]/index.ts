import Color from 'color';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ItemData } from '../../../../../types';
import { getItemFindAtLinks, isMissingInfo } from '../../../../../utils/utils';
import prisma from '../../../../../utils/prisma';
import { CheckAuth } from '../../../../../utils/googleCloud';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'PATCH') return PATCH(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

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
        WHERE b.type = "Vibrant" AND a.internal_id = ${id}
        
    `) as any[];

  if (resultRaw.length === 0) res.json(null);

  const result = resultRaw[0];
  const colorlab = Color.lab(result.lab_l, result.lab_a, result.lab_b);

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
    isWearable: !!result.specialType?.includes('wearable') || !!result.isWearable,
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
};

const PATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const internal_id = Number(req.query.id);

  const itemData = req.body.itemData;
  const itemCats = (req.body.itemCats as string[]) ?? [];
  const itemTags = (req.body.itemTags as string[]) ?? [];

  if (!itemData) return res.status(400).json({ error: 'Invalid Request' });

  if (isNaN(internal_id) || internal_id !== Number(itemData.internal_id))
    return res.status(400).json({ error: 'Invalid Request' });

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role !== 'ADMIN') res.status(403).json({ error: 'Forbidden' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  if (!itemData.image) return res.status(400).json({ error: 'Invalid Request' });

  const imageId = itemData.image.match(/[^\.\/]+(?=\.gif)/)?.[0] ?? undefined;

  const rarity =
    itemData.rarity === '' || isNaN(Number(itemData.rarity)) ? null : Number(itemData.rarity);
  const estVal =
    itemData.est_val === '' || isNaN(Number(itemData.est_val)) ? null : Number(itemData.est_val);
  const weight =
    itemData.weight === '' || isNaN(Number(itemData.weight)) ? null : Number(itemData.weight);
  const itemId =
    itemData.item_id === '' || isNaN(Number(itemData.item_id)) ? null : Number(itemData.item_id);

  await prisma.items.update({
    where: { internal_id },
    data: {
      item_id: itemId,
      name: itemData.name,
      description: itemData.description,
      image: itemData.image,
      image_id: imageId,
      rarity: rarity,
      est_val: estVal,
      weight: weight,
      isNC: !!itemData.isNC,
      isWearable: !!itemData.isWearable,
      isNeohome: !!itemData.isNeohome,
      category: itemData.category,
      comment: itemData.comment,
      status: itemData.status,
    },
  });

  await processTags(itemTags, itemCats, internal_id);

  return res.status(200).json({ success: true });
};

export const processTags = async (itemTags: string[], itemCats: string[], internal_id: number) => {
  const tagRaw = await prisma.itemTags.findMany({
    where: {
      item_iid: internal_id,
    },
    select: {
      tag: {
        select: {
          tag_id: true,
          name: true,
          description: true,
          type: true,
        },
      },
    },
  });

  const tagsStr = tagRaw.filter((x) => x.tag.type === 'tag').map((raw) => raw.tag.name);
  const catsStr = tagRaw.filter((x) => x.tag.type === 'category').map((raw) => raw.tag.name);

  const newTags = itemTags.filter((x) => !tagsStr.includes(x));
  const newCats = itemCats.filter((x) => !catsStr.includes(x));

  for (const tag of newTags) {
    await prisma.itemTags.create({
      data: {
        tag: {
          connectOrCreate: {
            where: {
              name: tag,
            },
            create: {
              name: tag,
              type: 'tag',
            },
          },
        },
        item: {
          connect: {
            internal_id: internal_id,
          },
        },
      },
      include: {
        tag: true,
        item: true,
      },
    });
  }

  for (const cat of newCats) {
    await prisma.itemTags.create({
      data: {
        tag: {
          connectOrCreate: {
            where: {
              name: cat,
            },
            create: {
              name: cat,
              type: 'category',
            },
          },
        },
        item: {
          connect: {
            internal_id: internal_id,
          },
        },
      },
      include: {
        tag: true,
        item: true,
      },
    });
  }

  const delTags = tagsStr.filter((x) => !itemTags.includes(x));
  const delCats = catsStr.filter((x) => !itemCats.includes(x));

  await prisma.itemTags.deleteMany({
    where: {
      item_iid: internal_id,
      tag: {
        name: {
          in: [...delCats, ...delTags],
        },
      },
    },
  });
};
