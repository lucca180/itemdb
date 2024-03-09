import { Prisma, RestockSession as RawRestockSession } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { RestockSession, RestockStats } from '../../../../types';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import { differenceInMilliseconds } from 'date-fns';
import { removeOutliers } from '../../../../utils/utils';
import { getManyItems } from '../items/many';

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

    if (!sessions.length) return res.status(200).json(null);

    const stats = await calculateStats(sessions);

    return res.status(200).json(stats);
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

// --------- //

type ValueOf<T> = T[keyof T];
const calculateStats = async (rawSessions: RawRestockSession[]) => {
  const stats: RestockStats = JSON.parse(JSON.stringify(defaultStats));
  const sessions: RestockSession[] = [];
  const allShops: { [id: string]: number } = {};
  const allBought: RestockStats['hottestBought'] = [];
  const allLost: RestockStats['hottestBought'] = [];
  const allItems: ValueOf<RestockSession['items']>[] = [];

  let refreshTotalTime: number[] = [];
  let reactionTotalTime: number[] = [];

  rawSessions.map((rawSession) => {
    if (!rawSession.session) return;
    const session = JSON.parse(rawSession.session as string) as RestockSession;
    sessions.push(session);

    const duration = differenceInMilliseconds(
      new Date(rawSession.endedAt),
      new Date(rawSession.startedAt)
    );
    stats.durationCount += duration;
    allShops[rawSession.shop_id] = allShops[rawSession.shop_id]
      ? allShops[rawSession.shop_id] + duration
      : duration;
    stats.totalRefreshes += session.refreshes.length;
    stats.totalSessions++;

    let sessionRefreshTime: number[] = [];
    session.refreshes.map((x, i) => {
      if (i === 0) return;
      sessionRefreshTime.push(
        differenceInMilliseconds(new Date(x), new Date(session.refreshes[i - 1]))
      );
    });

    sessionRefreshTime = removeOutliers(sessionRefreshTime, 0.5);
    if (sessionRefreshTime.length) refreshTotalTime.push(...sessionRefreshTime);

    const sessionReactionTime: number[] = [];
    session.clicks.map((click) => {
      const item = session.items[click.restock_id];
      const time = click.haggle_timestamp || click.soldOut_timestamp;
      if (!item || !time) return;
      sessionReactionTime.push(
        Math.abs(differenceInMilliseconds(new Date(time), new Date(item.timestamp)))
      );
    });

    if (sessionReactionTime.length) {
      const sessionReactionTime2 = removeOutliers(sessionReactionTime, 1);
      const avgRt2 = sessionReactionTime2.reduce((a, b) => a + b, 0) / sessionReactionTime2.length;
      reactionTotalTime.push(...sessionReactionTime.filter((x) => x <= avgRt2));
    }

    allItems.push(...Object.values(session.items));

    stats.totalRefreshes += session.refreshes.length;
    stats.totalClicks += session.clicks.length;
  });

  const morePopularShop = Object.keys(allShops).reduce((a, b) =>
    allShops[a] > allShops[b] ? a : b
  );
  stats.mostPopularShop = {
    shopId: parseInt(morePopularShop),
    durationCount: allShops[morePopularShop] ?? 0,
  };

  // remove outliers
  refreshTotalTime = removeOutliers(refreshTotalTime, 1);
  stats.avgRefreshTime = refreshTotalTime.reduce((a, b) => a + b, 0) / refreshTotalTime.length;

  reactionTotalTime = removeOutliers(reactionTotalTime, 1);
  stats.avgReactionTime = reactionTotalTime.reduce((a, b) => a + b, 0) / reactionTotalTime.length;

  const allItemsID = new Set(allItems.map((x) => x.item_id.toString()));

  const allItemsData = await getManyItems({
    item_id: [...allItemsID],
  });

  sessions.map((session) => {
    session.clicks.map((click) => {
      const item = allItemsData[click.item_id];
      const restockItem = session.items[click.restock_id];
      if (!item) return;

      if (!item.price.value) stats.unknownPrices++;

      if (click.buy_timestamp) {
        stats.totalBought.count++;
        stats.totalBought.value += item.price.value ?? 0;

        stats.mostExpensiveBought =
          stats.mostExpensiveBought &&
          (stats.mostExpensiveBought.price.value ?? 0) > (item.price.value ?? 0)
            ? stats.mostExpensiveBought
            : item;

        allBought.push({ item, click, restockItem });

        stats.estRevenue += item.price.value ?? 0;
      } else {
        stats.totalLost.count++;
        stats.totalLost.value += item.price.value ?? 0;

        stats.mostExpensiveLost =
          stats.mostExpensiveLost &&
          (stats.mostExpensiveLost.price.value ?? 0) > (item.price.value ?? 0)
            ? stats.mostExpensiveLost
            : item;

        allLost.push({ item, click, restockItem });
      }
    });
  });

  stats.hottestRestocks = Object.values(allItemsData)
    .sort((a, b) => (b.price.value ?? 0) - (a.price.value ?? 0))
    .splice(0, 16);

  stats.hottestBought = allBought
    .sort((a, b) => (b.item.price.value ?? 0) - (a.item.price.value ?? 0))
    .splice(0, 10);

  stats.hottestLost = allLost
    .sort((a, b) => (b.item.price.value ?? 0) - (a.item.price.value ?? 0))
    .splice(0, 10);

  stats.shopList = Object.keys(allShops).map((x) => parseInt(x));

  return stats;
};

const defaultStats: RestockStats = {
  durationCount: 0,
  shopList: [],
  mostPopularShop: {
    shopId: 0,
    durationCount: 0,
  },
  totalSessions: 0,
  mostExpensiveBought: undefined,
  mostExpensiveLost: undefined,
  totalRefreshes: 0,
  totalClicks: 0,
  totalLost: {
    count: 0,
    value: 0,
  },
  totalBought: {
    count: 0,
    value: 0,
  },
  estRevenue: 0,
  avgRefreshTime: 0,
  avgReactionTime: 0,
  hottestRestocks: [],
  hottestBought: [],
  hottestLost: [],
  unknownPrices: 0,
};
