import prisma from '../../../utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../utils/googleCloud';
import { User, UserRoles } from '../../../types';
import { User as dbUser } from '@prisma/client';
import { startOfDay } from 'date-fns';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const { neopetsUser, prefLang } = req.body as { neopetsUser: string; prefLang: string };

  try {
    const authRes = await CheckAuth(req);
    const decodedToken = authRes.decodedToken;
    const authUser = authRes.user;
    if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

    const dbUser = (await prisma.user.update({
      where: { id: decodedToken.uid },
      data: {
        neo_user: neopetsUser,
        username: username,
        pref_lang: prefLang,
      },
    })) as dbUser;

    if (!dbUser) return res.status(400).json({ error: 'user not found' });

    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      neopetsUser: dbUser.neo_user,
      isAdmin: dbUser.role === 'ADMIN',
      email: '',
      profileColor: dbUser.profile_color,
      profileImage: dbUser.profile_image,
      description: dbUser.description,
      role: dbUser.role as UserRoles,
      lastLogin: startOfDay(dbUser.last_login).toJSON(),
      createdAt: dbUser.createdAt.toJSON(),
      prefLang: dbUser.pref_lang,
      xp: dbUser.xp,
    };

    res.json(user);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e?.message ?? 'Something went wrong' });
  }
}
