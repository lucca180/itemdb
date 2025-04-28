import prisma from '../../../utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../utils/googleCloud';
import { User as dbUser } from '@prisma/generated/client';
import { rawToUser } from './login';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const { neopetsUser, prefLang, username } = req.body as {
    neopetsUser: string;
    prefLang: string;
    username: string;
  };

  try {
    const authRes = await CheckAuth(req);
    const decodedToken = authRes.decodedToken;
    const authUser = authRes.user;
    if (!authUser || authUser.banned) return res.status(401).json({ error: 'Unauthorized' });

    const dbUser = (await prisma.user.update({
      where: { id: decodedToken.uid },
      data: {
        neo_user: neopetsUser,
        username: username,
        pref_lang: prefLang,
      },
    })) as dbUser;

    if (!dbUser) return res.status(400).json({ error: 'user not found' });

    const user = rawToUser(dbUser, true);

    res.json(user);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e?.message ?? 'Something went wrong' });
  }
}
