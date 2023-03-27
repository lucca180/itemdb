import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ColorType, FullItemColors } from '../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  let image_ids;

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  if (req.method === 'GET') image_ids = req.query.image_id;
  else if (req.method === 'POST') image_ids = req.body.image_id;
  else return res.status(405).json({ error: 'Method not allowed' });

  if (!image_ids) return res.status(400).json({ error: 'Missing image_id' });
  if (!Array.isArray(image_ids)) image_ids = [image_ids];

  const colorsData = await getItemColor(image_ids);

  return res.json(colorsData);
}

export const getItemColor = async (image_ids: string[]) => {
  const result = await prisma.itemColor.findMany({
    where: {
      image_id: { in: image_ids },
    },
  });

  const colorsData: { [image_id: string]: Partial<FullItemColors> } = {};
  for (const color of result) {
    const type = color.type.toLowerCase() as ColorType;

    const colorData = colorsData[color.image_id] ?? {};

    colorData[type] = {
      internal_id: color.internal_id,
      population: color.population,
      image: color.image,
      image_id: color.image_id,
      hsv: [color.hsv_h, color.hsv_s, color.hsv_v].map((v) => Math.round(v)),
      rgb: [color.rgb_r, color.rgb_g, color.rgb_b].map((v) => Math.round(v)),
      lab: [color.lab_l, color.lab_a, color.lab_b].map((v) => Math.round(v)),
      type: type,
      hex: color.hex,
    };

    colorsData[color.image_id] = colorData;
  }

  return colorsData;
};
