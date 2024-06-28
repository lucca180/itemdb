import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/prisma';
import { getItem } from '.';
import { NCMallData } from '../../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);

  const name = isNaN(id) ? id_name : undefined;

  const item = await getItem(name ?? id);

  if (!item || !item.isNC) return res.status(404).json({ error: 'Item not found' });

  const result = await getItemNCMall(item.internal_id);

  res.json(result);
}

export const getItemNCMall = async (item_iid: number): Promise<NCMallData | null> => {
  const result = await prisma.ncMallData.findMany({
    where: {
      item_iid: item_iid,
    },
  });

  const ncMallData = result.find((r) => r.active == true) || result[0] || null;

  if (!ncMallData) return null;

  return {
    internal_id: ncMallData.internal_id,
    item_iid: ncMallData.item_iid,
    item_id: ncMallData.item_id,
    price: ncMallData.price,
    saleBegin: ncMallData.saleBegin ? ncMallData.saleBegin.toJSON() : null,
    saleEnd: ncMallData.saleEnd ? ncMallData.saleEnd.toJSON() : null,
    discountBegin: ncMallData.discountBegin ? ncMallData.discountBegin.toJSON() : null,
    discountEnd: ncMallData.discountEnd ? ncMallData.discountEnd.toJSON() : null,
    discountPrice: ncMallData.discountPrice,
    active: ncMallData.active,
    addedAt: ncMallData.addedAt.toJSON(),
    updatedAt: ncMallData.updatedAt.toJSON(),
  };
};
