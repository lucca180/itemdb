import { CheckAuth } from '@utils/googleCloud';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user } = await CheckAuth(req);

  if (!user) return res.status(404).json({ error: 'user not found' });

  res.setHeader(
    'Set-Cookie',
    'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict;'
  );
  res.setHeader('Location', '/');
  res.status(302).end();
}
