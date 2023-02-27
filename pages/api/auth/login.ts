import prisma from '../../../utils/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'
import { CheckAuth } from '../../../utils/googleCloud'
import requestIp from 'request-ip'
import { UserRoles } from '../../../types'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )

  try {
    const authRes = await CheckAuth(req)
    const decodedToken = authRes.decodedToken
    let user = authRes.user
    let dbUser;
    if(!decodedToken.email)
      return res.status(401).json({ error: 'Unauthorized' })

    if (!user) {
      dbUser = await prisma.user.create({
        data: {
          id: decodedToken.uid,
          email: decodedToken.email,
          last_ip: requestIp.getClientIp(req),
          last_login: new Date(),
        },
      })
    } else
      dbUser = await prisma.user.update({
        where: { id: decodedToken.uid },
        data: {
          last_ip: requestIp.getClientIp(req),
          last_login: new Date(),
        },
      })
    
    if(!dbUser) return res.status(401).json({ error: 'Unauthorized' });

    user = {
      ...dbUser,
      role: dbUser.role as UserRoles,
      isAdmin: dbUser.role === 'ADMIN',
    }

    res.json(user)
    
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e)
    res.status(401).json({ error: 'Unauthorized' })
  }
}
