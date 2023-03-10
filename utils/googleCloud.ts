import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextApiRequest } from 'next';
import prisma from './prisma';
import { Storage } from '@google-cloud/storage';
import { User, UserRoles } from '../types';
import { User as dbUser } from '@prisma/client';

if (!getApps().length) initializeApp({ credential: cert('./firebase-key.json') });

const Auth = getAuth();

export const CheckAuth = async (req: NextApiRequest) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) throw new Error('No token provided');

  const decodedToken = await Auth.verifyIdToken(token);

  const dbUser = (await prisma.user.findUnique({
    where: { id: decodedToken.uid },
  })) as dbUser | null;

  if (!dbUser) return { decodedToken: decodedToken, user: null };

  const user: Partial<User> = {
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

  return {
    decodedToken: decodedToken,
    user: user,
  };
};

export const GoogleStorage = new Storage({
  keyFilename: './firebase-key.json',
});

export const ImageBucket = GoogleStorage.bucket('itemdb-1db58.appspot.com');
