import prisma from '../../../utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';
import { User, UserRoles } from '../../../types';
import { startOfDay } from 'date-fns';
import { User as PrismaUser } from '@prisma/generated/client';
import { consumeMagicToken } from '@utils/auth/magicLink';
import { signSession, SESSION_DURATION_SECONDS } from '@utils/auth/jwt';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  try {
    const { token, email } = req.body as { token: string; email: string };

    if (!token || !email) return res.status(400).json({ error: 'token and email are required' });

    await consumeMagicToken(token, email);

    const ip = requestIp.getClientIp(req) || '';

    const dbUser = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {
        last_ip: ip,
        last_login: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        last_ip: ip,
        last_login: new Date(),
      },
    });

    if (!dbUser) return res.status(401).json({ error: 'Unauthorized' });

    const sessionToken = await signSession({
      uid: dbUser.id,
      email: dbUser.email,
      role: dbUser.role as UserRoles,
    });

    const cookies = [
      `session=${sessionToken};Path=/;HttpOnly;Secure;SameSite=Strict;Max-Age=${SESSION_DURATION_SECONDS};`,
    ];

    if (dbUser.pref_lang && dbUser.pref_lang !== req.cookies.NEXT_LOCALE) {
      cookies.push(
        `NEXT_LOCALE=${dbUser.pref_lang};Path=/;Max-Age=2147483647;SameSite=None;Secure;`
      );
    }

    res.setHeader('Set-Cookie', cookies);

    const finalUser = rawToUser(dbUser);
    res.json(finalUser);
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
