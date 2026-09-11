import { CheckAuth } from '@utils/googleCloud';
import { createSession } from '@utils/api/redis';
import { verifyTurnstileToken } from '@utils/api/turnstile';
import type { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const hasCookie = !!req.cookies['idb-session-exp'] && !!req.cookies['idb-session-id'];
  if (hasCookie) return res.status(400).json({ error: 'Invalid request' });

  const token = typeof req.body?.token === 'string' ? req.body.token : undefined;
  const ip = requestIp.getClientIp(req) || undefined;
  const turnstileOk = await verifyTurnstileToken(token, ip);
  if (!turnstileOk) return res.status(401).json({ error: 'Invalid request' });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
    if (user?.banned) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  } catch (e) {}

  const { session, expires } = createSession(!!user);
  const expExpiration = expires - 12 * 60 * 60; // 12 hours earlier than the actual expiration to be safe

  const cookies = [
    `idb-session-id=${session}; Path=/; Max-Age=${expires}; HttpOnly; Secure; SameSite=None`,
    `idb-session-exp=1; Path=/; Max-Age=${expExpiration}; Secure; SameSite=Lax`,
  ];

  res.setHeader('Set-Cookie', cookies);

  return res.json({ success: true });
}
