import { CheckAuth } from '@utils/googleCloud';
import { createSession } from '@utils/redis';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
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
