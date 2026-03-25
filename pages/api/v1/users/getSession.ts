import { CheckAuth } from '@utils/googleCloud';
import { createSession } from '@utils/redis';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const hasCookie = !!req.cookies['idb-session-exp'] && !!req.cookies['idb-session-id'];
  const hasProof = !!req.headers['x-itemdb-proof'];
  if (hasCookie || !hasProof) return res.status(400).json({ error: 'Invalid request' });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  const { session, expires } = createSession(!!user);
  const expExpiration = expires - 12 * 60 * 60; // 12 hours earlier than the actual expiration to be safe

  const cookies = [
    `idb-session-id=${session}; Path=/; Max-Age=${expires}; HttpOnly; Secure; SameSite=None`,
    `idb-session-exp=1; Path=/; Max-Age=${expExpiration}; Secure; SameSite=Strict`,
  ];

  res.setHeader('Set-Cookie', cookies);

  return res.json({ success: true });
}
