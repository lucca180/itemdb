import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ItemColorLab } from '@prisma/client';
import { ColorType, FullItemColors } from '../../../../types';
import Color from 'color';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const image_id = req.query.image_id;

  if (!image_id) return res.status(400).json({ error: 'Missing image_id' });

  const result = (await prisma.$queryRaw`
      SELECT *
      FROM ItemColorLab
      WHERE image_id = ${image_id}
  `) as ItemColorLab[];

  const types = result.map((o) => o.type);

  //preventing duplicate colors (yes we could do this in the query but...)
  const filteredResult = result.filter(
    ({ type }, index) => !types.includes(type, index + 1)
  );

  const colorsData: Partial<FullItemColors> = {};

  for (const color of filteredResult) {
    const type = color.type.toLowerCase() as ColorType;
    const colorlab = Color.lab(color.lab_l, color.lab_a, color.lab_b);

    colorsData[type] = {
      internal_id: color.internal_id,
      population: color.population,
      image: color.image,
      image_id: color.image_id,
      rgb: colorlab.rgb().round().array(),
      lab: colorlab.round().array(),
      type: type,
      hex: colorlab.hex(),
    };
  }

  res.json(colorsData);
}
