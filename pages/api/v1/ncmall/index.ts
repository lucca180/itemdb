import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getManyItems } from '../items/many';
import { NCMallData } from '../../../../types';

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

export const getNCMallData = async (limit: number, isLeaving = false): Promise<NCMallData[]> => {
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

  return result.map((data) => ({
    internal_id: data.internal_id,
    item_id: data.item_id,
    item_iid: data.item_iid,
    price: data.price,
    saleBegin: data.saleBegin ? data.saleBegin.toJSON() : null,
    saleEnd: data.saleEnd ? data.saleEnd.toJSON() : null,
    discountBegin: data.discountBegin ? data.discountBegin.toJSON() : null,
    discountEnd: data.discountEnd ? data.discountEnd.toJSON() : null,
    discountPrice: data.discountPrice,
    active: !!data.active,
    addedAt: data.addedAt.toJSON(),
    updatedAt: data.updatedAt.toJSON(),
  }));
};

export const getNCMallItemsData = async (limit: number, isLeaving = false) => {
  const ncMallData = await getNCMallData(limit, isLeaving);

  const items = await getManyItems({
    id: ncMallData.map((data) => data.item_iid.toString()),
  });

  return Object.values(items).sort((a, b) => {
    const aData = ncMallData.find((data) => data.item_iid === a.internal_id);
    const bData = ncMallData.find((data) => data.item_iid === b.internal_id);

    if (!aData || !bData) return 0;

    if (isLeaving) {
      return (
        new Date(aData.saleEnd ?? 0).getTime() - new Date(bData.saleEnd ?? 0).getTime() ||
        a.name.localeCompare(b.name)
      );
    }

    return (
      new Date(bData.saleBegin ?? 0).getTime() - new Date(aData.saleBegin ?? 0).getTime() ||
      a.name.localeCompare(b.name)
    );
  });
};
