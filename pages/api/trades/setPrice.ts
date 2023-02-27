import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../utils/prisma'
import { TradeData } from '../../../types'
import { CheckAuth } from '../../../utils/googleCloud'
import requestIp from 'request-ip'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )

  const trade = req.body.trade as TradeData
  try {
    const { user } = await CheckAuth(req)

    if (!user) throw new Error('User not found')

    if (user.role !== 'ADMIN') throw new Error('User doenst have privileges')
  } catch (e) {
    console.error(e)
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    await processTradePrice(trade)
    res.status(200).json({ success: true, message: false })
  } catch (e) {
    console.error(e)
    res.status(500).json({ success: false, message: 'error' })
  }
}

export const processTradePrice = async (
  trade: TradeData,
  req?: NextApiRequest
) => {
  const updateTrade = prisma.trades.update({
    where: { trade_id: trade.trade_id },
    data: {
      priced: true,
      processed: true,
    },
  })

  const updateItems = trade.items.map((item) => {
    return prisma.tradeItems.update({
      where: { internal_id: item.internal_id },
      data: {
        price: item.price,
      },
    })
  })

  const addPriceProcess = trade.items
    .filter((x) => x.price)
    .map((item) => {
      return {
        name: item.name,
        price: item.price as number,
        image: item.image,
        image_id: item.image_id,
        type: 'trade',
        owner: trade.owner,
        addedAt: trade.addedAt,
        language: 'en',
        ip_address: req ? requestIp.getClientIp(req) : undefined,
      }
    })

  const priceProcess = prisma.priceProcess.createMany({
    data: addPriceProcess,
    skipDuplicates: true,
  })

  return await prisma.$transaction([updateTrade, ...updateItems, priceProcess])
}
