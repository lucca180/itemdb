import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import { calculateStats } from '.';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  // if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { shopId } = req.query as {
      shopId?: string;
    };
    const { user } = await CheckAuth(req);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const sessions = await prisma.restockSession.findMany({
      where: {
        user_id: user.id,
        shop_id: shopId ? Number(shopId) : undefined,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!sessions.length) return res.status(200).json(null);

    const [, chart] = await calculateStats(sessions);

    return res.status(200).json(chart);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
