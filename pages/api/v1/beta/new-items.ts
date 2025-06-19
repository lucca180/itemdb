import prisma from '@utils/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
async function GET(req: NextApiRequest, res: NextApiResponse) {
  let { days } = req.query;

  if (!days) days = '7';

  if (typeof days !== 'string') {
    return res.status(400).json({ error: 'Invalid query parameter' });
  }

  const daysInt = parseInt(days, 10);
  if (isNaN(daysInt) || daysInt <= 0 || daysInt > 30) {
    return res.status(400).json({ error: 'Invalid number of days' });
  }

  try {
    const newItems = await getNewItemsInfo(daysInt);
    return res.status(200).json(newItems);
  } catch (error) {
    console.error('Error fetching new items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const getNewItemsInfo = async (days = 7) => {
  const newItems = await prisma.items.findMany({
    where: {
      addedAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
      OR: [
        { item_id: null },
        {
          item_id: {
            gte: 85020,
          },
        },
      ],
      type: {
        not: 'pb',
      },
      canonical_id: null,
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  let paidItems = 0;
  let freeItems = 0;

  newItems.forEach((item) => {
    if (item.isNC) paidItems++;
    else if (
      item.description?.toLowerCase().includes('item code') ||
      item.description?.toLowerCase().includes('prize code')
    )
      paidItems++;
    else freeItems++;
  });

  return {
    paidItems,
    freeItems,
  };
};
