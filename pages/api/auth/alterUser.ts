import prisma from '../../../utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../utils/googleCloud';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const { neo_user, username } = req.body;

  try {
    const authRes = await CheckAuth(req);
    const decodedToken = authRes.decodedToken;
    let user = authRes.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    user = await prisma.user.update({
      where: { id: decodedToken.uid },
      data: {
        neo_user: neo_user,
        username: username,
      },
    });

    if (!user) return res.status(400).json({ error: 'user not found' });

    user.isAdmin = user?.role === 'ADMIN';

    res.json(user);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e?.message ?? 'Something went wrong' });
  }
}
