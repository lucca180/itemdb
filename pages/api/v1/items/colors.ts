import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ColorType, FullItemColors } from '../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const image_id = req.query.image_id;

  if (!image_id) return res.status(400).json({ error: 'Missing image_id' });

  const colorsData = await getItemColor(image_id as string);

  return res.json(colorsData);
}

export const getItemColor = async (image_id: string) => {
  const result = await prisma.itemColor.findMany({
    where: {
      image_id,
    },
  });

  const colorsData: Partial<FullItemColors> = {};

  for (const color of result) {
    const type = color.type.toLowerCase() as ColorType;

    colorsData[type] = {
      internal_id: color.internal_id,
      population: color.population,
      image: color.image,
      image_id: color.image_id,
      rgb: [color.rgb_r, color.rgb_g, color.rgb_b],
      lab: [color.lab_l, color.lab_a, color.lab_b],
      type: type,
      hex: color.hex,
    };
  }

  return colorsData;
};
