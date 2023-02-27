import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../utils/prisma'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )

  const username = req.query.username as string
  if (!username)
    return res.status(400).json({ success: false, message: 'Bad Request' })

  try {
    const user = await prisma.user.findFirst({
      where: {
        username: username,
      },
    })

    if (!user)
      return res.status(400).json({ success: false, message: 'User not found' })

    user.email = ''
    user.last_ip = null
    user.last_login = new Date(0)

    return res.status(200).json(user)
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
