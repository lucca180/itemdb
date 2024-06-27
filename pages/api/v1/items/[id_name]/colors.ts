import type { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { getItemColor } from '../colors';
import prisma from '../../../../../utils/prisma';
import { getPallete } from '../process';

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

  if (!isForce && item.color?.hex) {
    const itemColor = await getItemColor([item.image_id]);
    return res.json(itemColor[item.image_id]);
  }

  if (isForce && item.color.hex) {
    await prisma.itemColor.deleteMany({
      where: {
        image_id: item.image_id,
      },
    });
  }

  const pallete = await getPallete(item);

  if (!pallete) return res.status(400).json({ error: 'Invalid Pallete' });

  await prisma.itemColor.createMany({
    data: pallete,
  });

  const itemColor = await getItemColor([item.image_id]);
  return res.json(itemColor[item.image_id]);
}
