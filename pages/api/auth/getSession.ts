import { CheckAuth } from '@utils/googleCloud';
import { createSession } from '@utils/redis';
import type { NextApiRequest, NextApiResponse } from 'next';

const isDev = process.env.NODE_ENV === 'development';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (isDev) return res.status(200).json({ success: true });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  const { session, expires } = await createSession(!!user);

  const cookies = [
    `idb-session-id=${session}; Path=/; Max-Age=${expires}; HttpOnly; Secure; SameSite=None`,
    `idb-session-exp=1; Path=/; Max-Age=${expires}; Secure; SameSite=Strict`,
  ];

  res.setHeader('Set-Cookie', cookies);

  return res.json({ success: true });
}
