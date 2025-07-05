import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { NcMallData as dbMallData, Prisma } from '@prisma/generated/client';

const TARNUM_KEY = process.env.TARNUM_KEY;
const TARNUM_SERVER = process.env.TARNUM_SERVER;
const ITEMDB_SERVER = process.env.ITEMDB_SERVER;

type NCMallData = {
  id: number;
  name: string;
  img: string;
  description: string;
  price: number;
  saleBegin?: number;
  saleEnd?: number;
  discountBegin?: number;
  discountEnd?: number;
  discountPrice?: number;
  isAvailable: boolean;
  isBuyable: boolean;
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (
    process.env.NODE_ENV !== 'development' &&
    (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
  )
    return res.status(401).json({ error: 'Unauthorized' });

  const ncMallRes = await axios.get(TARNUM_SERVER + '/neopets/ncmall');
  const ncMallData = ncMallRes.data as { [id: number]: NCMallData };

  if (!ncMallData || Object.values(ncMallData).length === 0)
    return res.status(500).json({ error: 'Failed to fetch data' });

  const allCurrentData = await prisma.ncMallData.findMany({
    where: {
      active: true,
    },
  });

  const allIds = new Set(allCurrentData.map((data) => data.item_id));
  const removeIds = new Set(allCurrentData.map((data) => data.item_id));

  const create: Prisma.NcMallDataCreateManyInput[] = [];
  const update = [];

  const allItems = await prisma.items.findMany({
    where: {
      item_id: {
        in: Object.keys(ncMallData).map((id) => parseInt(id)),
      },
    },
    select: {
      item_id: true,
      name: true,
      description: true,
      internal_id: true,
    },
  });

  const inexistentIds = [];

  for (const id in ncMallData) {
    const item = ncMallData[id];
    const dbItem = allItems.find((i) => item.id === i.item_id);

    if (!allIds.has(item.id)) {
      if (!dbItem) {
        inexistentIds.push(item.id);
        continue;
      }

      // send item data to process queue
      if (item.name !== dbItem.name || item.description.trim() !== dbItem.description?.trim())
        inexistentIds.push(item.id);

      if (!item.isAvailable) continue;

      create.push({
        item_iid: dbItem.internal_id,
        item_id: item.id,
        price: item.price,
        saleBegin: item.saleBegin ? new Date(item.saleBegin * 1000) : null,
        saleEnd: item.saleEnd ? new Date(item.saleEnd * 1000) : null,
        discountBegin: item.discountBegin ? new Date(item.discountBegin * 1000) : null,
        discountEnd: item.discountEnd ? new Date(item.discountEnd * 1000) : null,
        discountPrice: item.discountPrice,
        active: true,
      });
    } else {
      if (dbItem) {
        // send item data to process queue
        if (item.name !== dbItem.name || item.description.trim() !== dbItem.description?.trim())
          inexistentIds.push(item.id);
      }

      if (!item.isAvailable || !item.isBuyable) continue;

      removeIds.delete(item.id);
      const existentData = allCurrentData.find((data) => data.item_id === item.id);
      if (!checkDataChanged(existentData!, item)) continue;
      update.push(
        prisma.ncMallData.update({
          where: {
            internal_id: allCurrentData.find((data) => data.item_id === item.id)!.internal_id,
            item_id: item.id,
            active: true,
          },
          data: {
            price: item.price,
            saleBegin: item.saleBegin ? new Date(item.saleBegin * 1000) : null,
            saleEnd: item.saleEnd ? new Date(item.saleEnd * 1000) : null,
            discountBegin: item.discountBegin ? new Date(item.discountBegin * 1000) : null,
            discountEnd: item.discountEnd ? new Date(item.discountEnd * 1000) : null,
            discountPrice: item.discountPrice,
            active: true,
          },
        })
      );
    }
  }

  update.unshift(
    prisma.ncMallData.updateMany({
      where: {
        item_id: {
          in: Array.from(removeIds),
        },
        active: true,
      },
      data: {
        active: null,
      },
    })
  );

  const itemData = inexistentIds.map((id) => {
    const item = ncMallData[id];
    return {
      item_id: item.id,
      name: item.name,
      img: item.img,
      rarity: 500,
      category: 'Special',
      type: 'nc',
      description: item.description,
    };
  });

  const createItemRes = await fetch(ITEMDB_SERVER + '/api/v1/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lang: 'en',
      items: itemData,
      hash: null,
    }),
  });

  if (createItemRes.status !== 200) {
    console.error('Failed to create items');
  }

  const response = await prisma.$transaction([
    prisma.ncMallData.createMany({ data: create, skipDuplicates: true }),
    ...update,
  ]);
  res.json(response);
}

const checkDataChanged = (currentData: dbMallData, newData: NCMallData) => {
  // comparing dates
  return (
    (currentData.saleBegin?.getTime() ?? 0) !== (newData.saleBegin ?? 0) * 1000 ||
    (currentData.saleEnd?.getTime() ?? 0) !== (newData.saleEnd ?? 0) * 1000 ||
    (currentData.discountBegin?.getTime() ?? 0) !== (newData.discountBegin ?? 0) * 1000 ||
    (currentData.discountEnd?.getTime() ?? 0) !== (newData.discountEnd ?? 0) * 1000 ||
    // comparing prices
    currentData.price !== newData.price ||
    currentData.discountPrice !== newData.discountPrice
  );
};
