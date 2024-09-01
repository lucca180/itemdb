import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { RestockChart, RestockSession, RestockStats } from '../../../../types';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import { differenceInMilliseconds } from 'date-fns';
import { getRestockProfitOnDate, removeOutliers } from '../../../../utils/utils';
import { getManyItems } from '../items/many';
import { UTCDate } from '@date-fns/utc';
import { countBy, maxBy } from 'lodash';

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

    if (!user || user.banned) return res.status(401).json({ error: 'Unauthorized' });
    let newStartDate = startDate;

    if (startDate && !endDate) {
      const diff = differenceInMilliseconds(Date.now(), new Date(Number(startDate)));
      newStartDate = (Number(startDate) - diff).toString();
    }

    const sessions = await prisma.restockSession.findMany({
      where: {
        user_id: user.id,
        startedAt: {
          gte: newStartDate ? new Date(Number(newStartDate)) : undefined,
          lte: endDate ? new Date(Number(endDate)) : undefined,
        },
        shop_id: shopId ? Number(shopId) : undefined,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit ? Number(limit) : undefined,
      select: {
        sessionText: true,
        startedAt: true,
        endedAt: true,
        shop_id: true,
      },
    });

    const currentStats = sessions.filter((x) => x.startedAt >= new Date(Number(startDate)));

    if (!currentStats.length) return res.status(200).json(null);

    const pastStats = sessions.filter((x) => x.startedAt < new Date(Number(startDate)));

    const [currentResult, pastResult] = await Promise.all([
      calculateStats(currentStats),
      pastStats.length ? calculateStats(pastStats) : null,
    ]);

    return res.status(200).json({ currentStats: currentResult?.[0], pastStats: pastResult?.[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { user } = await CheckAuth(req);

    if (!user || user.banned) return res.status(401).json({ error: 'Unauthorized' });

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
        // session: JSON.stringify(session),
        sessionText: typeof session === 'string' ? session : JSON.stringify(session),
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
export const calculateStats = async (
  rawSessions: {
    startedAt: Date;
    endedAt: Date;
    shop_id: number;
    sessionText: string | null;
  }[]
): Promise<[RestockStats, RestockChart]> => {
  const stats: RestockStats = JSON.parse(JSON.stringify(defaultStats));
  const sessions: RestockSession[] = [];
  const allShops: { [id: string]: number } = {};
  const allBought: RestockStats['hottestBought'] = [];
  const allLost: RestockStats['hottestBought'] = [];
  const allItems: ValueOf<RestockSession['items']>[] = [];
  const allBaits: RestockStats['worstBaits'] = [];

  const chart: RestockChart = JSON.parse(JSON.stringify(defaultCharts));
  const revenuePerDay: { [date: string]: number } = {};
  const lostPerDay: { [date: string]: number } = {};
  const refreshesPerDay: { [date: string]: number } = {};
  let fastestBuy: RestockStats['fastestBuy'] = undefined;

  let refreshTotalTime: number[] = [];
  let reactionTotalTime: number[] = [];

  rawSessions.map((rawSession) => {
    if (!rawSession.sessionText) return;
    let session = JSON.parse(rawSession.sessionText as string) as RestockSession | string;
    if (typeof session === 'string') session = JSON.parse(session) as RestockSession;

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
    const date = formatDate(session.startDate);
    refreshesPerDay[date] = refreshesPerDay[date]
      ? refreshesPerDay[date] + session.refreshes.length
      : session.refreshes.length;

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
      if (!item || !restockItem) return;

      if (!item.price.value) stats.unknownPrices++;

      if (click.buy_timestamp) {
        if (click.buy_timestamp < restockItem.timestamp) return;

        stats.totalBought.count++;
        stats.totalBought.value += item.price.value ?? 0;

        stats.mostExpensiveBought =
          stats.mostExpensiveBought &&
          (stats.mostExpensiveBought.price.value ?? 0) > (item.price.value ?? 0)
            ? stats.mostExpensiveBought
            : item;

        allBought.push({ item, click, restockItem });
        const profit = getRestockProfitOnDate(item, click.buy_timestamp);

        if (profit && profit < 1000) allBaits.push({ item, click, restockItem });

        stats.estRevenue += item.price.value ?? 0;
        const date = formatDate(click.buy_timestamp);
        revenuePerDay[date] = revenuePerDay[date]
          ? revenuePerDay[date] + (item.price.value ?? 0)
          : item.price.value ?? 0;

        const time = differenceInMilliseconds(
          new Date(click.buy_timestamp),
          new Date(restockItem.timestamp)
        );

        if (!fastestBuy)
          fastestBuy = {
            timediff: time,
            timestamp: click.buy_timestamp,
            item,
          };
        else {
          if (fastestBuy.timediff > time) {
            fastestBuy = {
              timediff: time,
              timestamp: click.buy_timestamp,
              item,
            };
          }
        }
      } else {
        stats.totalLost.count++;
        stats.totalLost.value += item.price.value ?? 0;

        if (click.soldOut_timestamp) {
          if (click.soldOut_timestamp < restockItem.timestamp) return;
          const date = formatDate(click.soldOut_timestamp);
          lostPerDay[date] = lostPerDay[date]
            ? lostPerDay[date] + (item.price.value ?? 0)
            : item.price.value ?? 0;
        }

        stats.mostExpensiveLost =
          stats.mostExpensiveLost &&
          (stats.mostExpensiveLost.price.value ?? 0) > (item.price.value ?? 0)
            ? stats.mostExpensiveLost
            : item;

        allLost.push({ item, click, restockItem });
      }
    });
  });

  stats.fastestBuy = fastestBuy;
  const favBuy = findMostFrequent(allBought.map((x) => x.item));
  stats.favoriteItem = {
    item: favBuy.item,
    count: favBuy.count,
  };

  stats.hottestRestocks = Object.values(allItemsData)
    .sort((a, b) => (b.price.value ?? 0) - (a.price.value ?? 0))
    .splice(0, 16);

  stats.hottestBought = allBought
    .sort((a, b) => (b.item.price.value ?? 0) - (a.item.price.value ?? 0))
    .splice(0, 10);

  stats.hottestLost = allLost
    .sort((a, b) => (b.item.price.value ?? 0) - (a.item.price.value ?? 0))
    .splice(0, 10);

  stats.worstBaits = allBaits
    .sort(
      (a, b) =>
        (getRestockProfitOnDate(a.item, a.click.buy_timestamp!) ?? 0) -
        (getRestockProfitOnDate(b.item, b.click.buy_timestamp!) ?? 0)
    )
    .splice(0, 10);

  stats.shopList = Object.keys(allShops).map((x) => parseInt(x));

  chart.revenuePerDay = Object.keys(revenuePerDay).map((date) => ({
    date,
    value: revenuePerDay[date],
  }));

  chart.lossesPerDay = Object.keys(lostPerDay).map((date) => ({
    date,
    value: lostPerDay[date],
  }));

  chart.refreshesPerDay = Object.keys(refreshesPerDay).map((date) => ({
    date,
    value: refreshesPerDay[date],
  }));

  return [stats, chart];
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
  fastestBuy: undefined,
  favoriteItem: {
    item: undefined,
    count: 0,
  },
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
  worstBaits: [],
  unknownPrices: 0,
};

const defaultCharts: RestockChart = {
  revenuePerDay: [],
  lossesPerDay: [],
  refreshesPerDay: [],
};

// format a timestamp to yyyy-mm-dd
const formatDate = (date: number) => {
  const d = new UTCDate(date);
  return d.toISOString().split('T')[0];
};

function findMostFrequent<T>(arr: T[]): { item: T; count: number } {
  // Convert objects to strings for comparison
  const frequencyMap = countBy(arr.map((item) => JSON.stringify(item)));

  // Find the string with the maximum frequency
  const mostFrequentString = maxBy(Object.keys(frequencyMap), (key) => frequencyMap[key]);
  if (!mostFrequentString) throw new Error('No most frequent string found');
  // Parse the string back to an object if it's an object
  try {
    return { item: JSON.parse(mostFrequentString) as T, count: frequencyMap[mostFrequentString] };
  } catch (e) {
    return { item: mostFrequentString as unknown as T, count: frequencyMap[mostFrequentString] };
  }
}
