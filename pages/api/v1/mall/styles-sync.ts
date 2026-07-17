import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@utils/prisma';

const TARNUM_KEY = process.env.TARNUM_KEY;
const TARNUM_SERVER = process.env.TARNUM_SERVER;

type StyleData = {
  item_id: number;
  name: string;
  image: string;
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (
    process.env.NODE_ENV !== 'development' &&
    (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
  )
    return res.status(401).json({ error: 'Unauthorized' });

  const stylesRes = await axios.get(TARNUM_SERVER + '/neopets/styles');
  const stylesData = stylesRes.data as StyleData[];

  if (!Array.isArray(stylesData) || stylesData.length === 0)
    return res.status(500).json({ error: 'Failed to fetch data' });

  const itemIds = stylesData.map((style) => style.item_id);

  const existingItems = await prisma.items.findMany({
    where: {
      item_id: {
        in: itemIds,
      },
    },
    select: {
      item_id: true,
      name: true,
      image_id: true,
    },
  });

  const existingById = new Map(existingItems.map((item) => [item.item_id, item]));

  const itemData = stylesData
    .filter((style) => {
      const dbItem = existingById.get(style.item_id);
      if (!dbItem) return true;

      const imageId = style.image.match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';
      return style.name !== dbItem.name || imageId !== dbItem.image_id;
    })
    .map((style) => ({
      itemId: style.item_id,
      name: style.name,
      img: style.image,
      rarity: 500,
      estVal: 0,
      weight: 1,
      subText: '(wearable)',
      category: 'Special',
      type: 'nc',
    }));

  if (itemData.length === 0) {
    return res.json({ count: 0 });
  }

  const createItemRes = await fetch('https://itemdb.com.br/api/v1/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      tarnumkey: process.env.TARNUM_KEY ?? '',
    },
    body: JSON.stringify({
      lang: 'en',
      items: itemData,
      hash: null,
    }),
  });

  if (createItemRes.status !== 200) {
    console.error('Failed to queue style items');
    return res.status(500).json({ error: 'Failed to queue items' });
  }

  const result = await createItemRes.json();
  res.json(result);
}
