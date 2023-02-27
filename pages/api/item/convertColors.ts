import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../utils/prisma'
import Color from 'color'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )

  const colors = await prisma.itemColor.findMany()

  const newColors = []

  for (const color of colors) {
    const lab = Color.hsl(color.h, color.s, color.l).lab().array()
    // const rgb = HSLToRGB(color.h, color.s, color.l);
    // const lab = rgb2lab(rgb[0], rgb[1], rgb[2]);

    newColors.push({
      image_id: color.image_id,
      image: color.image,
      l: lab[0],
      a: lab[1],
      b: lab[2],
      population: color.population,
      type: color.type,
    })
  }

  const result = await prisma.itemColorLab.createMany({
    data: newColors,
  })

  res.json(result)
}
