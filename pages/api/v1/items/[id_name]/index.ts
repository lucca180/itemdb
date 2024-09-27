import type { NextApiRequest, NextApiResponse } from 'next';
import { ItemData, OwlsPriceData } from '../../../../../types';
import { getItemFindAtLinks, isMissingInfo, slugify } from '../../../../../utils/utils';
import prisma from '../../../../../utils/prisma';
import { Prisma } from '@prisma/client';
import { CheckAuth } from '../../../../../utils/googleCloud';
import axios from 'axios';
import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { getSaleStats } from './saleStats';
import requestIp from 'request-ip';
import { redis_setItemCount } from '../../../redis/checkapi';

const DISABLE_SALE_STATS = process.env.DISABLE_SALE_STATS === 'true';

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
  const itemCats = (req.body.itemCats as string[]) ?? [];
  const itemTags = (req.body.itemTags as string[]) ?? [];

  if (!itemData) return res.status(400).json({ error: 'Invalid Request' });

  if (isNaN(internal_id) || internal_id !== Number(itemData.internal_id))
    return res.status(400).json({ error: 'Invalid Request' });

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  if (!itemData.image) return res.status(400).json({ error: 'Invalid Request' });

  const imageId = itemData.image.match(/[^\.\/]+(?=\.gif)/)?.[0] ?? undefined;
  if (!imageId) return res.status(400).json({ error: 'Invalid Request' });

  const originalItem = await getItem(internal_id);

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
      const regex = new RegExp(`^${itemSlug}-\\d+$`);

      const sameSlug = dbSlugItems.filter((x) => regex.test(x.slug ?? ''));

      if (sameSlug.length > 0) {
        itemSlug = `${itemSlug}-${sameSlug.length + 1}`;
      }
    }
  }

  await prisma.items.update({
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

  await processTags(itemTags, itemCats, internal_id);

  try {
    await res.revalidate(`/item/${itemSlug ?? itemData.slug}`, { unstable_onlyGenerated: true });
  } catch (e) {}

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

  await prisma.items.delete({
    where: { internal_id: internal_id },
  });

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
      c.addedAt as priceAdded, c.price, c.noInflation_id
    FROM Items as a
    LEFT JOIN ItemColor as b on a.image_id = b.image_id and b.type = "Vibrant"
    LEFT JOIN itemPrices as c on c.item_iid = a.internal_id and c.isLatest = 1
    WHERE ${query}
  `) as any[] | null;

  if (!resultRaw || resultRaw.length === 0) return null;

  const result = resultRaw[0];

  const item: ItemData = {
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
    owls: null,
    comment: result.comment ?? null,
    slug: result.slug ?? null,
    saleStatus: null,
    useTypes: {
      canEat: result.canEat,
      canRead: result.canRead,
      canOpen: result.canOpen,
      canPlay: result.canPlay,
    },
  };

  if (item.isNC && item.status !== 'no trade' && item.isWearable)
    item.owls = await fetchOwlsData(item.name, item);

  if (!DISABLE_SALE_STATS && item.price.value && item.price.addedAt)
    item.saleStatus = await getSaleStats(item.internal_id, 15, new Date(item.price.addedAt));

  item.findAt = getItemFindAtLinks(item); // does have all the info we need :)
  item.isMissingInfo = isMissingInfo(item);

  return item;
};

export const getSomeItemIDs = async () => {
  const result = await prisma.items.findMany({
    where: {
      canonical_id: null,
    },
    orderBy: {
      addedAt: 'desc',
    },
    take: 6,
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

export const fetchOwlsData = async (
  itemName: string,
  item?: ItemData,
): Promise<OwlsPriceData | null> => {
  let lastOwls;
  if (item) {
    const owls = await prisma.owlsPrice.findFirst({
      where: {
        item_iid: item.internal_id,
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    lastOwls = owls;
    // check if last check was in the last 15 days
    if (owls && differenceInCalendarDays(new Date(), owls.lastChecked) < 15) {
      return {
        value: owls.value,
        valueMin: owls.valueMin,
        pricedAt: owls.pricedAt.toJSON(),
        buyable: owls.value.toLowerCase().includes('buyable'),
      };
    }
  }

  try {
    const res = await axios.get(`https://neo-owls.net/itemdata/${encodeURIComponent(itemName)}`);
    const data = res.data as { last_updated: string; owls_value: string } | null;

    if (!data || !data.owls_value) return null;

    let price = Number(data.owls_value.split('-')[0]);
    if (isNaN(price)) price = 0;
    const lastUpdated = data.last_updated ? new Date(data.last_updated) : new Date();

    if ((!lastOwls && item) || (lastOwls && item && !isSameDay(lastOwls.pricedAt, lastUpdated))) {
      const updateAll = prisma.owlsPrice.updateMany({
        where: {
          item_iid: item.internal_id,
          isLatest: true,
        },
        data: {
          isLatest: null,
        },
      });

      const createAll = prisma.owlsPrice.create({
        data: {
          item_iid: item.internal_id,
          value: data.owls_value,
          valueMin: price,
          pricedAt: lastUpdated,
          isLatest: true,
        },
      });

      await prisma.$transaction([updateAll, createAll]);
    } else if (lastOwls && isSameDay(lastOwls.pricedAt, lastUpdated)) {
      await prisma.owlsPrice.update({
        where: {
          internal_id: lastOwls.internal_id,
        },
        data: {
          lastChecked: new Date(),
        },
      });
    }

    return {
      value: data.owls_value,
      valueMin: price,
      pricedAt: lastUpdated.toJSON(),
      buyable: data.owls_value.toLowerCase().includes('buyable'),
    };
  } catch (e) {
    return lastOwls
      ? {
          value: lastOwls.value,
          valueMin: lastOwls.valueMin,
          pricedAt: lastOwls.pricedAt.toJSON(),
          buyable: lastOwls.value.toLowerCase().includes('buyable'),
        }
      : null;
  }
};
