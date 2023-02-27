import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { CheckAuth } from '../../../utils/googleCloud';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const { name, description, cover_url, purpose, visibility, colorHex } =
    req.body;

  try {
    const { user } = await CheckAuth(req);
    if (!user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!name || !purpose || !visibility)
      return res.status(400).json({ success: false, message: 'Bad Request' });

    if (!['public', 'private', 'unlisted'].includes(visibility))
      return res.status(400).json({ success: false, message: 'Bad Request' });

    if (!['none', 'trading', 'seeking'].includes(purpose))
      return res.status(400).json({ success: false, message: 'Bad Request' });

    const list = await prisma.userList.create({
      data: {
        name,
        description,
        cover_url,
        colorHex,
        purpose: purpose as 'none' | 'trading' | 'seeking',
        visibility: visibility as 'public' | 'private' | 'unlisted',
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return res.status(200).json({ success: true, message: list });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
