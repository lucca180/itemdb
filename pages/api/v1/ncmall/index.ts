import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getManyItems } from '../items/many';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const limit = req.query.limit ? Number(req.query.limit) : 16;

  const result = await getNCMallData(limit);

  return res.status(200).json(result);
}

export const getNCMallData = async (limit: number, isLeaving = false) => {
  const result = await prisma.ncMallData.findMany({
    where: {
      active: true,
      OR: [
        {
          saleEnd: {
            gte: new Date(),
          },
        },
        { saleEnd: isLeaving ? undefined : null },
      ],
    },
    orderBy: isLeaving
      ? { saleEnd: 'asc' }
      : {
          saleBegin: 'desc',
        },
    take: limit,
  });

  return result;
};

export const getNCMallItemsData = async (limit: number, isLeaving = false) => {
  const ncMallData = await getNCMallData(limit, isLeaving);

  const items = await getManyItems({
    id: ncMallData.map((data) => data.item_iid.toString()),
  });

  return Object.values(items).sort((a, b) => {
    return (
      ncMallData.findIndex((data) => data.item_iid === a.internal_id) -
      ncMallData.findIndex((data) => data.item_iid === b.internal_id)
    );
  });
};
