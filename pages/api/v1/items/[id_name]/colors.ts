import type { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { getItemColor } from '../colors';
import prisma from '../../../../../utils/prisma';
import { getPalette } from '../process';
import { ItemData } from '../../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  const { id_name, force } = req.query;
  if (!id_name) return res.status(400).json({ error: 'Invalid Request' });

  const isForce = force === 'true';

  const internal_id = Number(id_name);
  const name = isNaN(internal_id) ? (id_name as string) : undefined;

  const item = await getItem(name ?? internal_id);

  if (!item) return res.status(400).json({ error: 'Invalid Item' });

  const result = await getSingleItemColor(item, isForce);

  return res.json(result);
}

export const getSingleItemColor = async (item: ItemData, force = false) => {
  if (!force && item.color?.hex) {
    const itemColor = await getItemColor([item.image_id]);
    return itemColor[item.image_id];
  }

  if (force && item.color.hex) {
    await prisma.itemColor.deleteMany({
      where: {
        image_id: item.image_id,
      },
    });
  }

  const palette = await getPalette(item);
  if (!palette) {
    throw 'Invalid Pallete for item ' + item.internal_id;
  }

  await prisma.itemColor.createMany({
    data: palette,
  });

  const itemColor = await getItemColor([item.image_id]);
  return itemColor[item.image_id];
};
