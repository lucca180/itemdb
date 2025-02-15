import prisma from '../../../utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Auth, CheckAuth } from '../../../utils/googleCloud';
import requestIp from 'request-ip';
import { User, UserRoles } from '../../../types';
import { startOfDay } from 'date-fns';

const expiresIn = 14 * 24 * 60 * 60 * 1000; // 31 days in milliseconds;

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

    const token = req.headers.authorization?.split('Bearer ')[1];
    const cookies = [];
    if (token) {
      const sessionCookie = await Auth.createSessionCookie(token, { expiresIn: expiresIn });
      res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
      cookies.push(
        `session=${sessionCookie};Path=/;httpOnly=true;secure=true;SameSite=Lax;Max-Age=${expiresIn};`
      );
    }

    if (dbUser.pref_lang) {
      cookies.push(`NEXT_LOCALE=${dbUser.pref_lang};Path=/;Max-Age=2147483647;`);
    }

    if (cookies.length) res.setHeader('Set-Cookie', cookies);

    const finalUser: User = {
      id: dbUser.id,
      username: dbUser.username,
      neopetsUser: dbUser.neo_user,
      isAdmin: dbUser.role === 'ADMIN',
      email: dbUser.email,
      profileColor: dbUser.profile_color,
      profileImage: dbUser.profile_image,
      description: dbUser.description,
      role: dbUser.role as UserRoles,
      lastLogin: startOfDay(dbUser.last_login).toJSON(),
      createdAt: dbUser.createdAt.toJSON(),
      prefLang: dbUser.pref_lang,
      xp: dbUser.xp,
      banned: dbUser.xp < -300,
    };

    res.json(finalUser);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export const getUserById = async (uid: string) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: uid },
  });

  if (!dbUser) return null;

  const user: User = {
    id: dbUser.id,
    username: dbUser.username,
    neopetsUser: dbUser.neo_user,
    isAdmin: dbUser.role === 'ADMIN',
    email: dbUser.email,
    profileColor: dbUser.profile_color,
    profileImage: dbUser.profile_image,
    description: dbUser.description,
    role: dbUser.role as UserRoles,
    prefLang: dbUser.pref_lang,
    lastLogin: startOfDay(dbUser.last_login).toJSON(),
    createdAt: dbUser.createdAt.toJSON(),
    xp: dbUser.xp,
    banned: dbUser.xp < -300,
  };

  return user;
};
