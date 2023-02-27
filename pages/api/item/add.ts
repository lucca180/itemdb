import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../utils/prisma'
import requestIp from 'request-ip'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )

  const data = JSON.parse(req.body)

  const items = data.items
  const lang = data.lang

  const dataList = []
  for (const item of items) {
    let {
      itemId,
      name,
      description,
      img,
      category,
      rarity,
      estVal,
      subText,
      type,
      weight,
    } = item
    let imageId: string | null = null

    rarity = isNaN(Number(rarity)) ? undefined : Number(rarity)
    estVal = isNaN(Number(estVal)) ? undefined : Number(estVal)
    weight = isNaN(Number(weight)) ? undefined : Number(weight)
    itemId = isNaN(Number(itemId)) ? undefined : Number(itemId)

    if (!name || !img) continue

    if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://')

    if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? null

    if (category === 'Neocash') {
      category = undefined
      type = 'nc'
    }

    let specialTypes = []

    if (subText) {
      if (subText.toLowerCase().includes('neocash')) type = 'nc'
      specialTypes = subText.match(/(?<=\().+?(?=\))/gm)
    }

    let status = 'active'

    if (specialTypes.includes('no trade')) status = 'no trade'

    specialTypes =
      specialTypes?.length > 0 ? specialTypes?.toString() : undefined

    const x = {
      item_id: itemId,
      name: name,
      description: description,
      category: category,
      image: img,
      image_id: imageId,
      rarity: rarity,
      est_val: estVal,
      weight: weight,
      status: status,
      isNC: type === 'nc' || rarity === 500,
      specialType: specialTypes,
      isWearable: !!specialTypes?.includes('wearable'),
      language: lang,
      ip_address: requestIp.getClientIp(req),
    }

    dataList.push(x)
  }

  const result = await prisma.itemProcess.createMany({
    data: dataList,
    skipDuplicates: true,
  })

  res.json(result)
}
