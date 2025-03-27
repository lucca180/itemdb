import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { ItemData, RestockChart, RestockSession, RestockStats, User } from '../../../../types';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import { differenceInMilliseconds } from 'date-fns';
import { getRestockPrice, getRestockProfitOnDate, removeOutliers } from '../../../../utils/utils';
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

    const result = await getRestockStats({
      startDate,
      endDate,
      shopId,
      limit,
      user,
    });

    if (!result) return res.status(200).json(null);

    return res.status(200).json(result);
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
      if (isNaN(Number(session.shopId))) {
        if ((session.shopId as any) === 'attic') session.shopId = -1;
        else if ((session.shopId as any) === 'igloo') session.shopId = -2;
        else throw new Error('Invalid shopId');
      }
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

type GetRestockStatsParams = {
  startDate?: string | number;
  endDate?: string | number;
  shopId?: string | number;
  limit?: string;
  user: User;
};
export const getRestockStats = async (params: GetRestockStatsParams) => {
  const { startDate, endDate, shopId, limit, user } = params;
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

  if (!currentStats.length) return null;

  const pastStats = sessions.filter((x) => x.startedAt < new Date(Number(startDate)));

  const [currentResult, pastResult] = await Promise.all([
    calculateStats(
      currentStats,
      currentStats.at(0)?.startedAt.getTime() ?? 0,
      currentStats.at(-1)?.endedAt?.getTime() ?? 0
    ),
    pastStats.length
      ? calculateStats(
          pastStats,
          pastStats.at(0)?.startedAt?.getTime() ?? 0,
          pastStats.at(-1)?.endedAt?.getTime() ?? 0
        )
      : null,
  ]);

  return { currentStats: currentResult?.[0], pastStats: pastResult?.[0] };
};

type ValueOf<T> = T[keyof T];
export const calculateStats = async (
  rawSessions: {
    startedAt: Date;
    endedAt: Date;
    shop_id: number;
    sessionText: string | null;
  }[],
  startDate: number,
  endDate: number,
  pricingFunction: (item: ItemData, timestamp: number) => number | null = defaultPricingFunction
): Promise<[RestockStats, RestockChart]> => {
  const middleDate = startDate + (endDate - startDate) / 2;

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
  let fastestBuy: RestockStats['fastestBuy'] = null;

  let refreshTotalTime: number[] = [];
  let reactionTotalTime: number[] = [];

  const allItemsID = new Set<string>();

  const deDuplicatedSessions = removeDuplicatedSessions(rawSessions);

  stats.startDate = Infinity;
  stats.endDate = 0;

  deDuplicatedSessions.map((rawSession) => {
    if (!rawSession.sessionText) return;
    let session = JSON.parse(rawSession.sessionText as string) as RestockSession | string;
    if (typeof session === 'string') session = JSON.parse(session) as RestockSession;

    sessions.push(session);

    stats.startDate = Math.min(stats.startDate, new Date(rawSession.startedAt).getTime());
    stats.endDate = Math.max(stats.endDate, new Date(rawSession.endedAt).getTime());

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
    Object.values(session.items).map((x) =>
      x.item_id ? allItemsID.add(x.item_id.toString()) : null
    );
    Object.values(session.clicks).map((x) =>
      x.item_id ? allItemsID.add(x.item_id.toString()) : null
    );

    const date = formatDate(session.startDate);
    refreshesPerDay[date] = refreshesPerDay[date]
      ? refreshesPerDay[date] + session.refreshes.length
      : session.refreshes.length;

    stats.totalRefreshes += session.refreshes.length;
    stats.totalClicks += session.clicks.length;
  });

  stats.shopDuration = {};

  Object.keys(allShops).map((shopId) => {
    stats.shopDuration[shopId] = allShops[shopId];
  });

  const morePopularShop = Object.keys(allShops).reduce(
    (a, b) => (allShops[a] > allShops[b] ? a : b),
    Object.keys(allShops)[0]
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

  const allItemsData = await getManyItems({
    item_id: [...allItemsID],
  });

  sessions.map((session) => {
    session.clicks.map((click) => {
      const rawItem = allItemsData[click.item_id];
      let restockItem = session.items[click.restock_id];
      if (!rawItem) return;

      if (!restockItem) {
        session.items[click.restock_id] = {
          item_id: click.item_id,
          timestamp: (click.haggle_timestamp || click.soldOut_timestamp || 0) - 1,
          notTrust: true,
        };

        restockItem = session.items[click.restock_id];
        if (restockItem.timestamp < 0) return;
      }

      const buyVal = Number(click.buy_price ?? restockItem.stock_price ?? 0);

      const item = getItemWithPricing(rawItem, pricingFunction, restockItem.timestamp);

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
        let profit = getRestockProfitOnDate(item, click.buy_timestamp, restockItem.timestamp);
        if (buyVal && item.price.value) profit = item.price.value - buyVal;

        if (profit && profit <= 0) allBaits.push({ item, click, restockItem });

        stats.estRevenue += item.price.value ?? 0;

        if (!stats.totalSpent) stats.totalSpent = 0;
        stats.totalSpent += buyVal ?? 0;

        if (buyVal) {
          const restockVal =
            restockItem.stock_price ?? getRestockPrice(item, false, restockItem.timestamp)?.[0];

          if (restockVal && restockVal > buyVal) stats.totalHaggled += restockVal - buyVal;
        }

        const date = formatDate(click.buy_timestamp);
        revenuePerDay[date] = revenuePerDay[date]
          ? revenuePerDay[date] + (item.price.value ?? 0)
          : item.price.value ?? 0;

        const time = differenceInMilliseconds(
          new Date(click.buy_timestamp),
          new Date(restockItem.timestamp)
        );

        if (!restockItem.notTrust) {
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
  if (allBought.length) {
    const favBuy = findMostFrequent(allBought.map((x) => x.item));
    if (favBuy.item) {
      stats.buyCount = favBuy.frequencyMap;

      stats.favoriteItem = {
        item: favBuy.item,
        count: favBuy.count,
      };
    }
  }

  stats.hottestRestocks = Object.values(allItemsData)
    .map((item) => getItemWithPricing(item, pricingFunction, middleDate))
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
        (getItemProfitOnDate(a.click, a.item) ?? 0) - (getItemProfitOnDate(b.click, b.item) ?? 0)
    )
    .splice(0, 10);

  stats.shopList = Object.keys(allShops).map((x) => parseInt(x));

  stats.estProfit = stats.totalSpent ? stats.estRevenue - stats.totalSpent : null;

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

export const defaultStats: RestockStats = {
  startDate: 0,
  endDate: 0,
  durationCount: 0,
  shopList: [],
  shopDuration: {},
  mostPopularShop: {
    shopId: 0,
    durationCount: 0,
  },
  totalSessions: 0,
  mostExpensiveBought: null,
  mostExpensiveLost: null,
  fastestBuy: null,
  totalSpent: null,
  estProfit: null,
  totalHaggled: 0,
  favoriteItem: {
    item: null,
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
  buyCount: {},
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

// function findMostFrequent<T>(arr: T[]): { item: T; count: number } {
//   // Convert objects to strings for comparison
//   const frequencyMap = countBy(arr.map((item) => JSON.stringify(item)));

//   // Find the string with the maximum frequency
//   const mostFrequentString = maxBy(Object.keys(frequencyMap), (key) => frequencyMap[key]);
//   if (!mostFrequentString) throw new Error('No most frequent string found');
//   // Parse the string back to an object if it's an object
//   try {
//     return { item: JSON.parse(mostFrequentString) as T, count: frequencyMap[mostFrequentString] };
//   } catch (e) {
//     return { item: mostFrequentString as unknown as T, count: frequencyMap[mostFrequentString] };
//   }
// }

function findMostFrequent(arr: ItemData[]) {
  const frequencyMap = countBy(arr, (item) => item.internal_id);

  const mostFrequent = maxBy(Object.keys(frequencyMap), (key) => frequencyMap[key]);
  if (!mostFrequent) throw new Error('No most frequent found');
  return {
    item: arr.find((x) => x.internal_id === parseInt(mostFrequent))!,
    count: frequencyMap[mostFrequent],
    frequencyMap,
  };
}

const removeDuplicatedSessions = (
  sessions: {
    startedAt: Date;
    endedAt: Date;
    shop_id: number;
    sessionText: string | null;
  }[]
) => {
  // if a session has the same start date and shop id, remove the smaller lastRefresh
  const sessionMap: {
    [key: string]: {
      startedAt: Date;
      endedAt: Date;
      shop_id: number;
      sessionText: string | null;
    };
  } = {};

  sessions.map((session) => {
    const key = `${session.startedAt.toJSON()}_${session.shop_id}`;
    if (!sessionMap[key]) sessionMap[key] = session;
    else {
      if (session.endedAt > sessionMap[key].endedAt) sessionMap[key] = session;
    }
  });

  return Object.values(sessionMap);
};

const defaultPricingFunction = (item: ItemData): number | null => {
  return item.price.value;
};

const getItemWithPricing = (
  item: ItemData,
  pricingFunction: (item: ItemData, timestamp: number) => number | null,
  timestamp: number
): ItemData => {
  const price = pricingFunction(item, timestamp);
  return {
    ...item,
    price: {
      value: price,
      addedAt: price ? new Date(timestamp).toJSON() : null,
      inflated: false,
    },
  };
};

const getItemProfitOnDate = (click: RestockSession['clicks'][0], item: ItemData) => {
  if (click.buy_price && item.price.value) {
    return item.price.value - click.buy_price;
  }

  return getRestockProfitOnDate(item, click.buy_timestamp!);
};
