import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@utils/auth/getCurrentUser';
import requestIp from 'request-ip';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ip = requestIp.getClientIp(req) || '';
    const { user, refreshedSessionCookie } = await getCurrentUser({
      req,
      updateLastLogin: true,
      ip,
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (refreshedSessionCookie) {
      res.setHeader('Set-Cookie', refreshedSessionCookie);
    }

    return res.json(user);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
