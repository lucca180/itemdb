import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '@utils/googleCloud';
import { signSession, needsRefresh, SESSION_DURATION_SECONDS } from '@utils/auth/jwt';
import { UserRoles } from '../../../types';
import prisma from '@utils/prisma';
import requestIp from 'request-ip';

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

    const ip = requestIp.getClientIp(req) || '';

    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_ip: ip,
        last_login: new Date(),
      },
    });

    return res.json(user);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
