import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../utils/prisma'
import { PriceData } from '../../../../types'
import requestIp from 'request-ip'
import hash from 'object-hash'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') return GET(req, res)
  if (req.method === 'POST') return POST(req, res)

  return res.status(405).json({ error: 'Method not allowed' })
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
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

  return res.json(prices)
}

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const data = JSON.parse(req.body)

  const itemPrices = data.itemPrices
  const lang = data.lang

  const dataList = []
  for (const priceInfo of itemPrices) {
    let { name, img, owner, stock, value, otherInfo, type, item_id } = priceInfo
    let imageId: string | null = null

    stock = isNaN(Number(stock)) ? undefined : Number(stock)
    value = isNaN(Number(value)) ? undefined : Number(value)
    item_id = isNaN(Number(item_id)) ? undefined : Number(item_id)

    if (!name || !value) continue

    if (typeof stock === undefined || typeof value === undefined)
      return res.status(401).send('Invalid Data')

    if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://')

    if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? null

    const x = {
      name: name,
      item_id: item_id,
      image: img,
      image_id: imageId,
      owner: owner.slice(0, 3).padEnd(6, '*'),
      type: type,
      stock: stock,
      price: value,
      otherInfo: otherInfo?.toString(),

      language: lang,
      ip_address: requestIp.getClientIp(req),

      hash: '',
    }

    x.hash = hash(x, {
      excludeKeys: (key: string) =>
        ['ip_address', 'hash', 'stock'].includes(key),
    })

    dataList.push(x)
  }

  const result = await prisma.priceProcess.createMany({
    data: dataList,
    skipDuplicates: true,
  })

  return res.json(result)
}
