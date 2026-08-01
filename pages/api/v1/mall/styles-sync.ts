import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@utils/prisma';
import { fetchAllNeopetsColors } from '@utils/pet-colors';
import { syncPetStylesFromTarnumSnapshot, type TarnumStyleData } from '@utils/petStyles/sync';
import { enqueueAndProcessItems } from '@utils/item/enqueueItemProcess';
import { processItemProcessQueue } from '@utils/item/processItemQueue';

const TARNUM_KEY = process.env.TARNUM_KEY;
const TARNUM_SERVER = process.env.TARNUM_SERVER;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (
    process.env.NODE_ENV !== 'development' &&
    (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
  )
    return res.status(401).json({ error: 'Unauthorized' });

  const stylesRes = await axios.get(TARNUM_SERVER + '/neopets/styles');
  const stylesData = stylesRes.data as TarnumStyleData[];

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

  let itemsResult:
    | Awaited<ReturnType<typeof enqueueAndProcessItems>>
    | { enqueued: number; process: Awaited<ReturnType<typeof processItemProcessQueue>> };

  if (itemData.length > 0) {
    itemsResult = await enqueueAndProcessItems(itemData, {
      language: 'en',
      meta: {
        itemdbVersion: 'styles-sync',
        dataSource: 'styles-sync',
      },
      // Process enough to cover newly enqueued styles plus any backlog.
      limit: Math.min(1000, Math.max(300, itemData.length + 100)),
    });
  } else {
    // Still flush pending queue so previously enqueued styles can resolve.
    const process = await processItemProcessQueue({ limit: 300 });
    itemsResult = { enqueued: 0, process };
  }

  const colors = await fetchAllNeopetsColors();
  const styleSync = await syncPetStylesFromTarnumSnapshot(stylesData, colors);

  res.json({
    items: itemsResult,
    ...styleSync,
  });
}
