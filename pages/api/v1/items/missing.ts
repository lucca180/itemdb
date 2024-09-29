import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getManyItems } from './many';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const validTypes = ['item_id', 'category', 'rarity', 'est_val', 'weight', 'description'];

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const field = (req.query.field as string) || 'item_id';
  const limit = (req.query.limit as string) || '100';
  const page = (req.query.page as string) || '1';

  if (!validTypes.includes(field)) return res.status(400).json({ error: 'Invalid field' });

  const items = await prisma.items.findMany({
    where: {
      [field]: null,
      canonical_id: null,
    },
    select: {
      internal_id: true,
    },
    take: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit),
    orderBy: {
      name: 'asc',
    },
  });

  const itemData = await getManyItems({
    id: items.map((x) => x.internal_id.toString()),
  });

  return res.status(200).json(Object.values(itemData));
}
