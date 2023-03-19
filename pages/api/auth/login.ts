import prisma from '../../../utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../utils/googleCloud';
import requestIp from 'request-ip';
import { User, UserRoles } from '../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  try {
    const authRes = await CheckAuth(req);
    const decodedToken = authRes.decodedToken;
    const user = authRes.user;
    let dbUser;
    if (!decodedToken.email) return res.status(401).json({ error: 'Unauthorized' });

    if (!user) {
      dbUser = await prisma.user.create({
        data: {
          id: decodedToken.uid,
          email: decodedToken.email,
          last_ip: requestIp.getClientIp(req),
          last_login: new Date(),
        },
      });
    } else
      dbUser = await prisma.user.update({
        where: { id: decodedToken.uid },
        data: {
          last_ip: requestIp.getClientIp(req),
          last_login: new Date(),
        },
      });

    if (!dbUser) return res.status(401).json({ error: 'Unauthorized' });

    const finalUser: User = {
      id: dbUser.id,
      username: dbUser.username,
      neopetsUser: dbUser.neo_user,
      isAdmin: dbUser.role === 'ADMIN',
      email: '',
      profileColor: dbUser.profile_color,
      profileImage: dbUser.profile_image,
      description: dbUser.description,
      role: dbUser.role as UserRoles,
      lastLogin: new Date(0),
      last_ip: null,
      createdAt: dbUser.createdAt,
      xp: dbUser.xp,
    };

    res.json(finalUser);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
