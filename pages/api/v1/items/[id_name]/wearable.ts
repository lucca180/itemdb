import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);

  const itemQuery = isNaN(id) ? id_name : id;

  const item = await getItem(itemQuery);
  if (!item) return res.status(400).json({ error: 'Item not found' });
  if (!item.isWearable) return res.status(400).json({ error: 'Item is not wearable' });

  const data = await getWearableData(id);

  return res.status(200).json(data);
}

export const getWearableData = async (iid: number) => {
  const data = await prisma.wearableData.findMany({
    where: {
      item_iid: iid,
    },
  });

  return data;
};
