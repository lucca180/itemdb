import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getManyItems } from './many';
import { formatEffect } from './[id_name]/effects';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const type = req.query.field as string | undefined;
  const name = req.query.name as string | undefined;
  const limit = (req.query.limit as string) || '20';
  const page = (req.query.page as string) || '1';

  // Get all items that have an effect of the specified type
  const items_id = await prisma.items.findMany({
    where: {
      effects: {
        some: {
          type: type || undefined,
          name: name || undefined,
        },
      },
    },
    take: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit),
    orderBy: {
      name: 'asc',
    },
    select: {
      internal_id: true,
    },
  });

  // Get all effects for the items
  const itemEffects = await prisma.itemEffect.findMany({
    where: {
      item_iid: {
        in: items_id.map((item) => item.internal_id),
      },
    },
  });

  // Get full item data
  const itemData = await getManyItems({
    id: items_id.map((item) => item.internal_id.toString()),
  });

  const result = Object.values(itemData)
    .map((item) => {
      const effects = itemEffects
        .filter((effect) => effect.item_iid === item.internal_id)
        .sort((a, b) => b.type.localeCompare(a.type))
        .map((x) => formatEffect(x));
      return {
        ...item,
        effects,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return res.status(200).json(result);
};
