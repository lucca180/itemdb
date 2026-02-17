import { CheckAuth } from '@utils/googleCloud';
import prisma from '@utils/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  let user;

  try {
    user = (await CheckAuth(req)).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const apiKeys = await getAPIKeys(user.id);

  return res.status(200).json({ apiKeys: apiKeys });
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  let user;

  try {
    user = (await CheckAuth(req)).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const { name, description } = req.body as { name: string; description: string };

  const apiLimit = 3;
  const userApiKeys = await prisma.apiKeys.count({
    where: {
      user_id: user.id,
      OR: [
        {
          active: true,
        },
        {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  });

  if (userApiKeys >= apiLimit) return res.status(400).json({ error: `API key limit reached` });

  // Generate a new API key uuid v4
  const apikey = crypto.randomUUID().replace(/-/g, '');

  try {
    const key = await prisma.apiKeys.create({
      data: {
        api_key: apikey,
        user_id: user.id,
        name: name || '',
        description: description || '',
        limit: 2500,
      },
    });

    return res.status(200).json(key);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  let user;

  try {
    user = (await CheckAuth(req)).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const { key_id } = req.body as { key_id: number };

  await prisma.apiKeys.updateMany({
    where: {
      key_id,
      user_id: user.id,
    },
    data: {
      active: false,
    },
  });

  return res.status(200).json({ success: true });
}

export const getAPIKeys = async (userId: string) => {
  const apiKeys = await prisma.apiKeys.findMany({
    where: {
      user_id: userId,
      OR: [
        {
          active: true,
        },
        {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
    omit: {
      api_key: true,
    },
  });

  return apiKeys.map((key) => ({
    ...key,
    createdAt: key.createdAt.toJSON(),
    updatedAt: key.updatedAt.toJSON(),
  }));
};
