import type { NextApiRequest, NextApiResponse } from 'next';
import { ItemData, User } from '../../../../../types';
import { getItemFindAtLinks, isMissingInfo, slugify } from '../../../../../utils/utils';
import prisma from '../../../../../utils/prisma';
import { Items, Prisma } from '@prisma/generated/client';
import { CheckAuth } from '../../../../../utils/googleCloud';
import { differenceInCalendarDays } from 'date-fns';
import { getSaleStats } from './saleStats';
import requestIp from 'request-ip';
import { redis_setItemCount } from '../../../redis/checkapi';
import { revalidateItem } from './effects';
import { ItemChangesLog } from '../process';
import { rawToItemData } from '../many';
import { getNCValue } from '../../mall/[iid]';
import { UTCDate } from '@date-fns/utc';

const DISABLE_SALE_STATS = process.env.DISABLE_SALE_STATS === 'true';
const NC_VALUES_TYPE = process.env.NC_VALUES_TYPE; // 'itemdb' or 'lebron'

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'PATCH') return PATCH(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id_name } = req.query;
  if (!id_name) return res.status(400).json({ error: 'Invalid Request' });

  const internal_id = Number(id_name);
  const name = isNaN(internal_id) ? (id_name as string) : undefined;

  const item = await getItem(name ?? internal_id);

  const ip = requestIp.getClientIp(req);
  await redis_setItemCount(ip, 1, req);

  return res.json(item);
};

const PATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const internal_id = Number(req.query.id_name);
  if (isNaN(internal_id)) return res.status(400).json({ error: 'Invalid Request' });

  const itemData = req.body.itemData as ItemData;
  // const itemCats = (req.body.itemCats as string[]) ?? [];
  // const itemTags = (req.body.itemTags as string[]) ?? [];

  if (!itemData) return res.status(400).json({ error: 'Invalid Request' });

  if (isNaN(internal_id) || internal_id !== Number(itemData.internal_id))
    return res.status(400).json({ error: 'Invalid Request' });
  let user: User | null = null;
  try {
    user = (await CheckAuth(req)).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  if (!itemData.image) return res.status(400).json({ error: 'Invalid Request' });

  const imageId = itemData.image.match(/[^\.\/]+(?=\.gif)/)?.[0] ?? undefined;
  if (!imageId) return res.status(400).json({ error: 'Invalid Request' });

  const originalItem = await prisma.items.findUnique({
    where: { internal_id: internal_id },
  });

  const rarity =
    (!itemData.rarity && itemData.rarity !== 0) || isNaN(Number(itemData.rarity))
      ? null
      : Number(itemData.rarity);
  const estVal =
    (!itemData.estVal && itemData.estVal !== 0) || isNaN(Number(itemData.estVal))
      ? null
      : Number(itemData.estVal);
  const weight =
    (!itemData.weight && itemData.weight !== 0) || isNaN(Number(itemData.weight))
      ? null
      : Number(itemData.weight);
  const itemId =
    (!itemData.item_id && itemData.item_id !== 0) || isNaN(Number(itemData.item_id))
      ? null
      : Number(itemData.item_id);

  const canonical_id =
    (!itemData.canonical_id && itemData.canonical_id !== 0) || isNaN(Number(itemData.canonical_id))
      ? null
      : Number(itemData.canonical_id);

  let itemSlug: string | undefined = undefined;

  if (originalItem && itemData.name !== originalItem.name) {
    itemSlug = slugify(itemData.name);

    const dbSlugItems = await prisma.items.findMany({
      where: {
        slug: {
          startsWith: itemSlug,
        },
        NOT: {
          internal_id: internal_id,
        },
      },
    });

    if (dbSlugItems.length > 0) {
      const regex = new RegExp(`^${itemSlug}(-\\d+)?$`);

      const sameSlug = dbSlugItems.filter((x) => regex.test(x.slug ?? ''));

      if (sameSlug.length > 0) {
        itemSlug = `${itemSlug}-${sameSlug.length + 1}`;
      }
    }
  }

  let addedAt: Date | undefined = undefined;

  if (
    itemData.firstSeen &&
    new Date(itemData.firstSeen).getTime() !== originalItem?.addedAt.getTime()
  ) {
    addedAt = new UTCDate(new UTCDate(itemData.firstSeen).setHours(18));
  }

  const item = await prisma.items.update({
    where: { internal_id: internal_id },
    data: {
      item_id: itemId,
      canonical_id: canonical_id,
      name: itemData.name,
      description: itemData.description,
      image: itemData.image,
      image_id: imageId,
      type: itemData.type,
      rarity: rarity,
      est_val: estVal,
      weight: weight,
      isNC: !!itemData.isNC,
      addedAt: addedAt,
      isWearable: !!itemData.isWearable,
      isNeohome: !!itemData.isNeohome,
      category: itemData.category,
      comment: itemData.comment,
      status: itemData.status,
      isBD: itemData.isBD,
      canEat: itemData.useTypes.canEat,
      canPlay: itemData.useTypes.canPlay,
      canRead: itemData.useTypes.canRead,
      canOpen: itemData.useTypes.canOpen,
      slug: itemSlug,
    },
  });

  await logChanges(originalItem!, item, user.id);

  // await processTags(itemTags, itemCats, internal_id);

  await revalidateItem(item.slug!, res);

  return res.status(200).json({ success: true });
};

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const internal_id = Number(req.query.id_name);
  if (isNaN(internal_id)) return res.status(400).json({ error: 'Invalid Request' });

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  const item = await prisma.items.findUnique({
    where: {
      internal_id: internal_id,
    },
  });

  await prisma.items.delete({
    where: { internal_id: internal_id },
  });

  if (item?.slug) await revalidateItem(item.slug, res, false);

  return res.status(200).json({ success: true });
};
// ------------- //

export const getItem = async (id_name: number | string) => {
  const isID = !isNaN(Number(id_name));

  let query;
  if (isID) query = Prisma.sql`a.internal_id = ${id_name}`;
  else query = Prisma.sql`a.slug = ${id_name} or a.name LIKE ${id_name}`;

  const resultRaw = (await prisma.$queryRaw`
    SELECT a.*, b.lab_l, b.lab_a, b.lab_b, b.population, b.rgb_r, b.rgb_g, b.rgb_b, b.hex,
      b.hsv_h, b.hsv_s, b.hsv_v,
      c.addedAt as priceAdded, c.price, c.noInflation_id, c.newPrice,
      d.addedAt as ncValueAddedAt, d.minValue, d.maxValue, d.valueRange,
      o.pricedAt as owlsPriced, o.value as owlsValue, o.valueMin as owlsValueMin,
      n.price as ncPrice, n.saleBegin, n.saleEnd, n.discountBegin, n.discountEnd, n.discountPrice
    FROM Items as a
    LEFT JOIN ItemColor as b on a.image_id = b.image_id and b.type = "Vibrant"
    LEFT JOIN ncValues as d on d.item_iid = a.internal_id and d.isLatest = 1
    LEFT JOIN owlsPrice as o on o.item_iid = a.internal_id and o.isLatest = 1
    LEFT JOIN itemPrices as c on c.item_iid = a.internal_id and c.isLatest = 1
    LEFT JOIN NcMallData as n on n.item_iid = a.internal_id and n.active = 1
    WHERE ${query}
  `) as any[] | null;

  if (!resultRaw || resultRaw.length === 0) return null;

  const result = resultRaw[0];

  const item: ItemData = rawToItemData(result);

  if (
    item.isNC &&
    item.status === 'active' &&
    NC_VALUES_TYPE === 'itemdb' &&
    differenceInCalendarDays(Date.now(), new Date(result.addedAt)) > 3
  )
    item.ncValue = await getNCValue(item.internal_id, item.name, 15, false);

  if (!DISABLE_SALE_STATS && item.price.value && item.price.addedAt)
    item.saleStatus = await getSaleStats(item.internal_id, 15, new Date(item.price.addedAt));

  item.findAt = getItemFindAtLinks(item); // does have all the info we need :)
  item.isMissingInfo = isMissingInfo(item);

  return item;
};

export const getSomeItemIDs = async (limit = 6) => {
  const result = await prisma.items.findMany({
    where: {
      canonical_id: null,
    },
    orderBy: {
      addedAt: 'desc',
    },
    take: limit,
  });

  return result;
};

// ------------------------------ //

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

// ---------------------------- //

const logChanges = async (originalItem: Items, updatedItem: Items, uid: string) => {
  const changes: ItemChangesLog = {};

  const keys = Object.keys(updatedItem) as (keyof Items)[];

  for (const key of keys) {
    if (key === 'addedAt' || key === 'updatedAt') continue;
    const originalVal = originalItem[key];
    const newVal = updatedItem[key];

    if (typeof originalVal === 'undefined' || typeof newVal === 'undefined') continue;

    if (originalVal !== newVal) {
      changes[key] = {
        oldVal: originalVal,
        newVal: newVal,
      };
    }
  }

  await prisma.actionLogs.create({
    data: {
      actionType: 'itemUpdate',
      subject_id: updatedItem.internal_id.toString(),
      user_id: uid,
      logData: changes,
    },
  });
};
