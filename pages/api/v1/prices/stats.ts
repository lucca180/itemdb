import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ItemLastSeen } from '../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const item_id = req.query.item_id as string | undefined;
  let name = req.query.name as string | undefined;
  let image_id = req.query.image_id as string | undefined;

  const stats = await prisma.priceProcess.groupBy({
    by: ['type'],
    _max: {
      addedAt: true,
    },
    where: {
      OR: [
        { item_id: item_id ? Number(item_id) : undefined },
        {
          name: name,
          image_id: image_id,
        },
      ],
    },
  });

  if ((!name || !image_id) && item_id) {
    const itemData = await prisma.items.findUnique({
      where: { item_id: Number(item_id) },
    });

    name = itemData?.name;
    image_id = itemData?.image_id as string | undefined;
  }

  const tradeStats = await prisma.tradeItems.groupBy({
    by: ['name'],
    _max: {
      addedAt: true,
    },
    where: {
      OR: [
        { item_id: item_id ? Number(item_id) : undefined },
        {
          name: name,
          image_id: image_id,
        },
      ],
    },
  });

  const lastSeen: ItemLastSeen = {
    sw: null,
    tp: tradeStats[0]?._max.addedAt?.toJSON() ?? null,
    auction: null,
    restock: null,
  };

  stats.map((s) => {
    if (!s._max.addedAt) return;

    const type = s.type;

    if (['sw', 'ssw', 'usershop'].includes(type) && s._max.addedAt) {
      if (!lastSeen.sw) lastSeen.sw = s._max.addedAt.toJSON();
      else if (s._max.addedAt > new Date(lastSeen.sw)) lastSeen.sw = s._max.addedAt.toJSON();
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    else lastSeen[s.type] = s._max.addedAt.toJSON();
  });

  res.json(lastSeen);
}
