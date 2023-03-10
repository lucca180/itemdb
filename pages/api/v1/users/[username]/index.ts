import type { NextApiRequest, NextApiResponse } from 'next';
import { User, UserRoles } from '../../../../../types';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;

  if (!username || typeof username !== 'string')
    return res.status(400).json({ error: 'Invalid Request' });

  try {
    const user = await prisma.user.findFirst({
      where: {
        username: username,
      },
    });

    if (!user) return res.status(200).json(null);

    // remove sensitive data
    const cleanedUser: User = {
      id: user.id,
      username: user.username,
      neo_user: user.neo_user,
      isAdmin: user.role === 'ADMIN',
      email: '',
      role: user.role as UserRoles,
      last_login: new Date(0),
      last_ip: null,
      createdAt: user.createdAt,
      xp: user.xp,
    };

    return res.status(200).json(cleanedUser);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { neo_user, username } = req.body;

  try {
    const authRes = await CheckAuth(req);
    const decodedToken = authRes.decodedToken;
    let user = authRes.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const tempUser = await prisma.user.update({
      where: { id: decodedToken.uid },
      data: {
        neo_user: neo_user,
        username: username,
      },
    });

    if (!tempUser) return res.status(400).json({ error: 'user not found' });

    user = {
      ...tempUser,
      role: tempUser.role as UserRoles,
      isAdmin: tempUser.role === 'ADMIN',
    };

    return res.json(user);
  } catch (e: any) {
    console.error(e);
    return res.status(400).json({ error: e?.message ?? 'Something went wrong' });
  }
};
