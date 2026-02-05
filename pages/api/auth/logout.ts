import { Auth, CheckAuth } from '@utils/googleCloud';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const { user } = await CheckAuth(req);

  if (!user) return res.status(404).json({ error: 'user not found' });

  Auth.revokeRefreshTokens(user.id).catch((e) => console.error('Error revoking tokens:', e));

  res.setHeader('Set-Cookie', 'session=deleted;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.setHeader('Location', '/');
  res.status(302).end();
}
