import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ItemLastSeen } from '../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const item_iid = req.query.item_iid as string | undefined;
  const item_id = req.query.item_id as string | undefined;
  const name = req.query.name as string | undefined;
  const image_id = req.query.image_id as string | undefined;

  const lastSeen = await getLastSeen({ item_iid, item_id, name, image_id });

  res.json(lastSeen);
}

type getLastSeenParams = {
  item_iid?: string | number | null;
  item_id?: string | number | null;
  name?: string;
  image_id?: string;
};

export const getLastSeen = async (params: getLastSeenParams) => {
  let { item_iid, item_id, name, image_id } = params;

  if (!item_iid) {
    const itemData = await prisma.items.findFirst({
      where: {
        OR: [
          {
            item_id: item_id ? Number(item_id) : undefined,
          },
          {
            name: name,
            image_id: image_id,
          },
        ],
      },
    });

    if (!itemData || itemData.isNC || itemData.status === 'no trade')
      return {
        sw: null,
        tp: null,
        auction: null,
        restock: null,
      };

    item_iid = itemData?.internal_id;
  }

  const stats = await prisma.lastSeen.findMany({
    where: {
      item_iid: Number(item_iid),
    },
  });

  const lastSeen: ItemLastSeen = {
    sw: null,
    tp: null,
    auction: null,
    restock: null,
  };

  stats.map((s) => {
    const type = s.type;

    if (['sw', 'ssw', 'usershop'].includes(type)) {
      if (!lastSeen.sw) lastSeen.sw = s.lastSeen.toJSON();
      else if (s.lastSeen > new Date(lastSeen.sw)) lastSeen.sw = s.lastSeen.toJSON();
    }

    if (type === 'trade') {
      if (!lastSeen.tp) lastSeen.tp = s.lastSeen.toJSON();
      else if (s.lastSeen > new Date(lastSeen.tp)) lastSeen.tp = s.lastSeen.toJSON();
    }

    //@ts-ignore
    else lastSeen[s.type] = s.lastSeen.toJSON();
  });

  return lastSeen;
};
