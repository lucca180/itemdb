import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import type { NextApiRequest } from 'next';
import prisma from './prisma';
import { Storage } from '@google-cloud/storage';
import { User, UserRoles } from '../types';
import { User as dbUser } from '@prisma/client';
import { startOfDay } from 'date-fns';

if (!getApps().length) initializeApp({ credential: cert('./firebase-key.json') });

export const Auth = getAuth();

export const CheckAuth = async (
  req: NextApiRequest | null,
  token?: string,
  session?: string,
  skipUser = false,
) => {
  token = token || req?.headers.authorization?.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    if (!token) throw new Error('No token provided');
    decodedToken = await Auth.verifyIdToken(token);
  } catch (err) {
    if ((!req || !req.cookies.session) && !session) throw err;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    decodedToken = await Auth.verifySessionCookie((session ?? req?.cookies.session)!, !skipUser);
  }

  if (skipUser) return { decodedToken: decodedToken, user: null };

  const dbUser = (await prisma.user.findUnique({
    where: { id: decodedToken.uid, email: decodedToken.email },
  })) as dbUser | null;

  if (!dbUser) return { decodedToken: decodedToken, user: null };

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

  return {
    decodedToken: decodedToken,
    user: user,
  };
};

export const GoogleStorage = new Storage({
  keyFilename: './firebase-key.json',
});

export const ImageBucket = GoogleStorage.bucket('itemdb-1db58.appspot.com');
