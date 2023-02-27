import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../utils/prisma'
import { ItemLastSeen } from '../../../types'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )

  const item_id = req.query.item_id as string | undefined
  let name = req.query.name as string | undefined
  let image_id = req.query.image_id as string | undefined

  const stats = await prisma.priceProcess.groupBy({
    by: ['type'],
    _max: {
      addedAt: true,
    },
    where: {
      OR: [
        { item_id: item_id ? Number(item_id) : undefined },
        {
          name: name,
          image_id: image_id,
        },
      ],
    },
  })

  if ((!name || !image_id) && item_id) {
    const itemData = await prisma.items.findUnique({
      where: { item_id: Number(item_id) },
    })

    name = itemData?.name
    image_id = itemData?.image_id as string | undefined
  }

  const tradeStats = await prisma.tradeItems.groupBy({
    by: ['name'],
    _max: {
      addedAt: true,
    },
    where: {
      OR: [
        { item_id: item_id ? Number(item_id) : undefined },
        {
          name: name,
          image_id: image_id,
        },
      ],
    },
  })

  const lastSeen: ItemLastSeen = {
    sw: null,
    tp: tradeStats[0]?._max.addedAt?.toJSON() ?? null,
    auction: null,
    restock: null,
  }

  stats.map((s) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    lastSeen[s.type] = s._max.addedAt
  })

  res.json(lastSeen)
}
