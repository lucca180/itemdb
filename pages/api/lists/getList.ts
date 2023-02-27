import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../utils/prisma'
import { CheckAuth } from '../../../utils/googleCloud'
import { UserList } from '../../../types'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )

  const username = req.query.username as string
  const list_id = req.query.list_id as string

  if (!username || !list_id)
    return res.status(400).json({ success: false, message: 'Bad Request' })

  let user = null

  try {
    user = (await CheckAuth(req)).user
  } catch (e) {}

  try {
    const listRaw = await prisma.userList.findUnique({
      where: {
        internal_id: parseInt(list_id),
        user: {
          username: username,
        },
      },
      include: {
        items: true,
      },
    })

    if (
      !listRaw ||
      (listRaw.visibility === 'private' && listRaw.user_id !== user?.id)
    )
      return res.status(400).json({ success: false, message: 'List Not Found' })

    const owner = await prisma.user.findUnique({
      where: {
        username: username,
      },
    })

    const list: UserList = {
      internal_id: listRaw.internal_id,
      name: listRaw.name,
      description: listRaw.description,
      cover_url: listRaw.cover_url,
      colorHex: listRaw.colorHex,
      purpose: listRaw.purpose,
      official: listRaw.official,
      visibility: listRaw.visibility,
      user_id: listRaw.user_id,
      user_username: owner?.username ?? '',
      user_neouser: owner?.neo_user ?? '',
      createdAt: listRaw.createdAt,
      updatedAt: listRaw.updatedAt,

      sortBy: listRaw.sortBy,
      sortDir: listRaw.sortDir,
      order: listRaw.order ?? 0,

      itemCount: listRaw.items.length,
      itemInfo: listRaw.items.map((item) => {
        return {
          internal_id: item.internal_id,
          list_id: item.list_id,
          item_iid: item.item_iid,
          addedAt: item.addedAt,
          updatedAt: item.updatedAt,
          amount: item.amount,
          capValue: item.capValue,
          imported: item.imported,
          order: item.order,
          isHighlight: item.isHighlight,
        }
      }),
    }

    return res.status(200).json(list)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
