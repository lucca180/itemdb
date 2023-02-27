import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../utils/prisma'
import { PriceData } from '../../../types'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )

  const item_id = req.query.item_id as string
  const name = req.query.name as string
  const image_id = req.query.image_id as string

  const pricesRaw = await prisma.itemPrices.findMany({
    where: {
      OR: [
        { item_id: item_id ? Number(item_id) : undefined },
        {
          name: name,
          image_id: image_id,
        },
      ],
    },
    orderBy: { addedAt: 'desc' },
  })

  const prices: PriceData[] = pricesRaw.map((p) => {
    return {
      value: p.price,
      addedAt: p.addedAt.toJSON(),
      inflated: !!p.noInflation_id,
    }
  })

  res.json(prices)
}
