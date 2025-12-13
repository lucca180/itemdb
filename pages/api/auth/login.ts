import prisma from '../../../utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Auth, CheckAuth } from '../../../utils/googleCloud';
import requestIp from 'request-ip';
import { User, UserRoles } from '../../../types';
import { startOfDay } from 'date-fns';
import { User as PrismaUser } from '@prisma/generated/client';

const expiresIn = 24 * 60 * 60 * 1000;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  try {
    const authRes = await CheckAuth(req, undefined, undefined, true);
    const decodedToken = authRes.decodedToken;

    if (!decodedToken.email) return res.status(401).json({ error: 'Unauthorized' });

    const ip = requestIp.getClientIp(req) || '';

    const dbUser = await prisma.user.upsert({
      where: { id: decodedToken.uid },
      update: {
        last_ip: ip,
        last_login: new Date(),
      },
      create: {
        id: decodedToken.uid,
        email: decodedToken.email,
        last_ip: ip,
        last_login: new Date(),
      },
    });

    if (!dbUser) return res.status(401).json({ error: 'Unauthorized' });

    const token = req.headers.authorization?.split('Bearer ')[1];
    const session = req.cookies.session;
    const cookies = [];

    // temporarily overwrite sessionCookie to fix expiration issue
    const isFixed = req.cookies.fixedCookie;

    if (token && (!session || !isFixed)) {
      const sessionCookie = await Auth.createSessionCookie(token, { expiresIn: expiresIn * 14 });
      res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');

      cookies.push(`fixedCookie=1;Path=/;Max-Age=2147483647;SameSite=None;Secure;`);

      // expire cookie before token expires
      cookies.push(
        `session=${sessionCookie};Path=/;httpOnly=true;secure=true;SameSite=Lax;Max-Age=${(expiresIn * 13) / 1000};`
      );
    }

    if (dbUser.pref_lang && dbUser.pref_lang !== req.cookies.NEXT_LOCALE) {
      cookies.push(
        `NEXT_LOCALE=${dbUser.pref_lang};Path=/;Max-Age=2147483647;SameSite=None;Secure;`
      );
    }

    if (cookies.length) res.setHeader('Set-Cookie', cookies);

    const finalUser = rawToUser(dbUser);

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

  const user = rawToUser(dbUser);

  return user;
};

export const rawToUser = (rawUser: PrismaUser, removeMail = false): User => {
  return {
    id: rawUser.id,
    username: rawUser.username,
    neopetsUser: rawUser.neo_user,
    isAdmin: rawUser.role === 'ADMIN',
    email: removeMail ? '' : rawUser.email,
    profileColor: rawUser.profile_color,
    profileImage: rawUser.profile_image,
    description: rawUser.description,
    role: rawUser.role as UserRoles,
    prefLang: rawUser.pref_lang,
    lastLogin: startOfDay(rawUser.last_login).toJSON(),
    createdAt: rawUser.createdAt.toJSON(),
    xp: rawUser.xp,
    profileMode: (rawUser.profile_mode as 'default' | 'groups') ?? 'default',
    banned: rawUser.xp < -1000,
  };
};
