import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { RestockSession } from '../../../../types';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { startDate, endDate, shopId, limit } = req.query as {
      startDate?: string;
      endDate?: string;
      shopId?: string;
      limit?: string;
    };
    const { user } = await CheckAuth(req);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const sessions = await prisma.restockSession.findMany({
      where: {
        user_id: user.id,
        startedAt: {
          gte: startDate ? new Date(Number(startDate)) : undefined,
          lte: endDate ? new Date(Number(endDate)) : undefined,
        },
        shop_id: shopId ? Number(shopId) : undefined,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({ sessions });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { user } = await CheckAuth(req);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { sessionList } = req.body as { sessionList: RestockSession[] };

    if (!sessionList || !Array.isArray(sessionList))
      return res.status(400).json({ error: 'Bad Request' });

    const sessions: Prisma.RestockSessionCreateManyInput[] = sessionList.map((session) => {
      if (isNaN(Number(session.shopId))) throw new Error('Invalid shopId');
      return {
        user_id: user.id,
        modelVersion: session.version,
        startedAt: new Date(session.startDate),
        endedAt: new Date(session.lastRefresh),
        shop_id: Number(session.shopId),
        session: JSON.stringify(session),
      };
    });

    await prisma.restockSession.createMany({
      data: sessions,
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
