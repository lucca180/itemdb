import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../utils/prisma'
import { ItemColorLab } from '@prisma/client'
import { ColorType, FullItemColors } from '../../../types'
import Color from 'color'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )

  const image_id = req.query.image_id

  const result = (await prisma.$queryRaw`
        SELECT *
        FROM ItemColorLab
        WHERE image_id = ${image_id}
    `) as ItemColorLab[]

  const types = result.map((o) => o.type)
  const filteredResult = result.filter(
    ({ type }, index) => !types.includes(type, index + 1)
  )

  const colorsData: Partial<FullItemColors> = {}

  for (const color of filteredResult) {
    const type = color.type.toLowerCase() as ColorType
    const colorlab = Color.lab(color.l, color.a, color.b)

    colorsData[type] = {
      internal_id: color.internal_id,
      population: color.population,
      image: color.image,
      image_id: color.image_id,
      rgb: colorlab.rgb().round().array(),
      lab: colorlab.round().array(),
      type: type,
      hex: colorlab.hex(),
    }
  }

  res.json(colorsData)
}
