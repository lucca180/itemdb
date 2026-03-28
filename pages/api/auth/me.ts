import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '@utils/googleCloud';
import { verifyLegacyFirebaseSession } from '@utils/auth/firebaseAdmin';
import { signSession, needsRefresh, SESSION_DURATION_SECONDS } from '@utils/auth/jwt';
import { rawToUser } from './login';
import { UserRoles } from '../../../types';
import prisma from '@utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // New JWT path
  try {
    const { user, decodedToken } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Sliding-window refresh: if the token expires in less than 7 days, issue a new one.
    if (needsRefresh(decodedToken.exp)) {
      const newToken = await signSession({
        uid: user.id,
        email: user.email,
        role: user.role as UserRoles,
      });
      res.setHeader(
        'Set-Cookie',
        `session=${newToken};Path=/;HttpOnly;Secure;SameSite=Strict;Max-Age=${SESSION_DURATION_SECONDS};`
      );
    }

    return res.json(user);
  } catch {
    // JWT verification failed — fall through to legacy migration
  }

  // Legacy Firebase session cookie migration path.
  // If the cookie is a still-valid Firebase session cookie, issue a new JWT
  // and transparently upgrade the session in one round-trip.
  try {
    const sessionCookie = req.cookies.session;
    if (!sessionCookie) return res.status(401).json({ error: 'Unauthorized' });
    const { uid } = await verifyLegacyFirebaseSession(sessionCookie);

    const dbUser = await prisma.user.findUnique({ where: { id: uid } });
    if (!dbUser) return res.status(401).json({ error: 'Unauthorized' });

    const newToken = await signSession({
      uid: dbUser.id,
      email: dbUser.email,
      role: dbUser.role as UserRoles,
    });

    res.setHeader(
      'Set-Cookie',
      `session=${newToken};Path=/;HttpOnly;Secure;SameSite=Strict;Max-Age=${SESSION_DURATION_SECONDS};`
    );

    return res.json(rawToUser(dbUser));
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
