import prisma from '../../../utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../utils/googleCloud';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const itemData = req.body.itemData;
  const itemCats = (req.body.itemCats as string[]) ?? [];
  const itemTags = (req.body.itemTags as string[]) ?? [];

  if (!itemData) return res.status(400).json({ error: 'Invalid Request' });

  try {
    const { user } = await CheckAuth(req);
    if (!user) throw new Error('User not found');

    if (user.role !== 'ADMIN') throw new Error('Unauthorized Permission');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { internal_id } = itemData;

  if (!itemData.image)
    return res.status(400).json({ error: 'Invalid Request' });

  const imageId = itemData.image.match(/[^\.\/]+(?=\.gif)/)?.[0] ?? undefined;

  const rarity =
    itemData.rarity === '' || isNaN(Number(itemData.rarity))
      ? null
      : Number(itemData.rarity);
  const estVal =
    itemData.est_val === '' || isNaN(Number(itemData.est_val))
      ? null
      : Number(itemData.est_val);
  const weight =
    itemData.weight === '' || isNaN(Number(itemData.weight))
      ? null
      : Number(itemData.weight);
  const itemId =
    itemData.item_id === '' || isNaN(Number(itemData.item_id))
      ? null
      : Number(itemData.item_id);

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
}

export const processTags = async (
  itemTags: string[],
  itemCats: string[],
  internal_id: number
) => {
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

  const tagsStr = tagRaw
    .filter((x) => x.tag.type === 'tag')
    .map((raw) => raw.tag.name);
  const catsStr = tagRaw
    .filter((x) => x.tag.type === 'category')
    .map((raw) => raw.tag.name);

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
