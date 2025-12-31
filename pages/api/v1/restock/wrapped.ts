/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import { ItemPriceData, RestockSession, RestockStats, User } from '../../../../types';
import prisma from '../../../../utils/prisma';
import { addMonths, differenceInCalendarDays, format, parse, startOfMonth } from 'date-fns';
import { getManyItemsPriceHistory } from '../prices/history';
import { calculateStats, defaultStats } from '.';
import { getItem } from '../items/[id_name]';
import { chunk } from 'lodash';

const TARNUM_KEY = process.env.TARNUM_KEY;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'PATCH') return PATCH(req, res);

  if (req.method == 'OPTIONS') return res.status(200).json({});

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const { year } = req.query;
  let user: User | null;

  try {
    user = (await CheckAuth(req)).user;
    if (!user) throw new Error('Unauthorized');
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const settings = await prisma.wrappedSettings.findUnique({
    where: {
      user_id_year: {
        user_id: user.id,
        year: Number(year ?? '2025'),
      },
    },
  });

  if (!settings) return res.json({ status: 'notJoined' });
  if (!settings.ready) return res.json({ status: 'notReady' });
  else return res.json({ status: 'ready' });
}

async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  if (
    process.env.NODE_ENV !== 'development' &&
    (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
  )
    return res.status(401).json({ error: 'Unauthorized' });

  const processAll = req.query.processAll === 'true';

  const pastMonth = addMonths(startOfMonth(new Date()), -1);

  const usersInQueue = await prisma.wrappedSettings.findMany({
    where: {
      ready: processAll ? undefined : false,
      user: {
        RestockWrapped: {
          none: {
            dateType: format(pastMonth, 'MM-yy'),
          },
        },
      },
    },
    orderBy: {
      user: {
        xp: 'desc',
      },
    },
  });

  if (usersInQueue.length === 0) {
    return res.status(200).json({ success: true });
  }

  const MAX_PROCESSED = 3;
  let processed = 0;

  for (const user of usersInQueue) {
    if (processed >= MAX_PROCESSED) break;
    console.log('Processing', user.user_id);
    const lastProcessed = await prisma.restockWrapped.findFirst({
      where: {
        user_id: user.user_id,
      },
      orderBy: {
        processed_at: 'desc',
      },
      select: {
        dateType: true,
      },
    });

    let lastMonth = parse(lastProcessed?.dateType ?? '01-25', 'MM-yy', new Date());
    let nextMonth = lastProcessed ? addMonths(lastMonth, 1) : lastMonth;

    if (nextMonth >= startOfMonth(new Date())) {
      continue;
    }

    while (nextMonth < startOfMonth(new Date())) {
      console.log('Processing', nextMonth);
      const data = await processMonth(
        user.user_id,
        nextMonth.getMonth() + 1,
        nextMonth.getFullYear()
      );

      await prisma.restockWrapped.create({
        data: {
          user_id: user.user_id,
          dateType: format(nextMonth, 'MM-yy'),
          sessionText: !data ? data : JSON.stringify(data),
        },
      });

      lastMonth = nextMonth;
      nextMonth = addMonths(nextMonth, 1);
    }

    await prisma.wrappedSettings.upsert({
      where: {
        user_id_year: {
          user_id: user.user_id,
          year: lastMonth.getFullYear(),
        },
      },
      update: {
        ready: true,
      },
      create: {
        user_id: user.user_id,
        year: lastMonth.getFullYear(),
        settings: '',
        ready: true,
      },
    });

    processed++;
  }

  return res.status(200).json({ success: true });
}

const processMonth = async (user_id: string, month: number, year = 2025) => {
  const sessions = await prisma.restockSession.findMany({
    where: {
      user_id,
      startedAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
  });

  if (!sessions.length) return null;

  const allItemsID = new Set<number>();

  sessions.map((rawSession) => {
    if (!rawSession.sessionText) return;
    let session = JSON.parse(rawSession.sessionText as string) as RestockSession | string;
    if (typeof session === 'string') session = JSON.parse(session) as RestockSession;

    Object.values(session.items).map((x) => {
      if (!x.item_id) return;
      if (priceHistoryMap.has(Number(x.item_id))) return;
      allItemsID.add(Number(x.item_id));
    });

    Object.values(session.clicks).map((x) => {
      if (!x.item_id) return;
      if (priceHistoryMap.has(Number(x.item_id))) return;
      allItemsID.add(Number(x.item_id));
    });
  });

  const allItemsPrices = await bulkGetMany(Array.from(allItemsID));

  Object.values(allItemsPrices).map((prices) => {
    priceHistoryMap.set(prices[0].item_iid, prices);
  });

  const [stats, chartStats] = await calculateStats(
    sessions,
    new Date(year, month - 1, 1).getTime(),
    new Date(year, month, 1).getTime(),
    (item, time) => getClosestPrice(item.internal_id, new Date(time))
  );

  return { stats, chartStats };
};

const priceHistoryMap: Map<number, (ItemPriceData & { item_iid: number; price_id: number })[]> =
  new Map();

const getClosestPrice = (item_iid: number, date: Date): number | null => {
  const prices = priceHistoryMap.get(item_iid);

  if (!prices || prices.length === 0) {
    return null;
  }

  const closest = prices.reduce((prev, curr) => {
    const prevDiff = differenceInCalendarDays(new Date(prev.addedAt ?? '0'), date);
    const currDiff = differenceInCalendarDays(new Date(curr.addedAt ?? '0'), date);

    if (Math.abs(currDiff) < Math.abs(prevDiff) && currDiff <= 15) return curr;

    return prev;
  }, prices[0]);

  return closest?.value ?? null;
};

export const getWrapped = async (user_id: string, year: number) => {
  const settings = await prisma.wrappedSettings.findUnique({
    where: {
      user_id_year: {
        user_id: user_id,
        year: Number(year ?? '2025'),
      },
    },
  });

  if (!settings) {
    const hasSession = await prisma.restockSession.findFirst({
      where: {
        user_id: user_id,
        addedAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year, 11, 1),
        },
      },
    });

    if (!hasSession) throw 'notFound';

    await prisma.wrappedSettings.create({
      data: {
        user_id: user_id,
        settings: '',
      },
    });

    throw 'notReady';
  }

  if (!settings.ready) throw 'notReady';

  const monthly = await prisma.restockWrapped.findMany({
    where: {
      user_id: user_id,
      sessionText: {
        not: null,
      },
      dateType: {
        in: Array.from({ length: 12 }, (_, i) => format(new Date(year, i, 1), 'MM-yy')),
      },
    },
  });

  if (!monthly.length) throw 'notFound';

  const wrapped: RestockStats = JSON.parse(JSON.stringify(defaultStats));
  const monthlyStats: RestockStats[] = [];
  let sumAvgRefreshTime = 0;
  let sumAvgReactionTime = 0;

  wrapped.startDate = Infinity;
  wrapped.endDate = 0;

  monthly.map((x) => {
    if (!x.sessionText) return;
    const { stats } = JSON.parse(x.sessionText) as {
      stats: typeof defaultStats;
      chartStats: any[];
    };

    monthlyStats.push(stats);

    wrapped.startDate = Math.min(wrapped.startDate, stats.startDate);
    wrapped.endDate = Math.max(wrapped.endDate, stats.endDate);

    wrapped.durationCount += stats.durationCount;
    wrapped.shopList.push(...stats.shopList);

    // wrapped.mostPopularShop = stats.mostPopularShop;

    Object.keys(stats.shopDuration).map((key) => {
      if (!stats.shopDuration[key]) return;
      if (!wrapped.shopDuration[key]) wrapped.shopDuration[key] = 0;
      wrapped.shopDuration[key] += stats.shopDuration[key];
    });

    wrapped.totalSessions += stats.totalSessions;
    // wrapped.mostExpensiveBought = stats.mostExpensiveBought;
    // wrapped.mostExpensiveLost = stats.mostExpensiveLost;
    wrapped.totalRefreshes += stats.totalRefreshes;

    wrapped.totalLost = {
      count: wrapped.totalLost.count + stats.totalLost.count,
      value: wrapped.totalLost.value + stats.totalLost.value,
    };

    wrapped.totalBought = {
      count: wrapped.totalBought.count + stats.totalBought.count,
      value: wrapped.totalBought.value + stats.totalBought.value,
    };

    wrapped.estRevenue += stats.estRevenue;

    // wrapped.avgRefreshTime += stats.avgRefreshTime;
    // wrapped.avgReactionTime += stats.avgReactionTime;
    sumAvgRefreshTime += stats.avgRefreshTime * stats.totalRefreshes;
    sumAvgReactionTime += stats.avgReactionTime * stats.totalClicks;

    wrapped.totalClicks += stats.totalClicks;
    wrapped.hottestRestocks.push(...stats.hottestRestocks);
    wrapped.hottestBought.push(...stats.hottestBought);
    wrapped.worstBaits.push(...stats.worstBaits);
    wrapped.hottestLost.push(...stats.hottestLost);

    if (!wrapped.fastestBuy && stats.fastestBuy) wrapped.fastestBuy = stats.fastestBuy;
    if (wrapped.fastestBuy && stats.fastestBuy)
      wrapped.fastestBuy =
        stats.fastestBuy.timediff < wrapped.fastestBuy.timediff
          ? stats.fastestBuy
          : wrapped.fastestBuy;

    // wrapped.favoriteItem = stats.favoriteItem;

    Object.keys(stats.buyCount).map((key) => {
      if (!stats.buyCount[key]) return;
      if (!wrapped.buyCount[key]) wrapped.buyCount[key] = 0;
      wrapped.buyCount[key] += stats.buyCount[key];
    });

    wrapped.unknownPrices += stats.unknownPrices;
  });

  const mostPopularShop = Object.keys(wrapped.shopDuration).reduce((prev, curr) =>
    wrapped.shopDuration[prev] > wrapped.shopDuration[curr] ? prev : curr
  );

  wrapped.mostPopularShop = {
    shopId: Number(mostPopularShop),
    durationCount: wrapped.shopDuration[mostPopularShop],
  };

  wrapped.hottestBought = wrapped.hottestBought
    .sort((a, b) => (b.item.price.value ?? 0) - (a.item.price.value ?? 0))
    .slice(0, 10);

  wrapped.mostExpensiveBought = wrapped.hottestBought[0]?.item ?? null;

  wrapped.hottestLost = wrapped.hottestLost
    .sort((a, b) => (b.item.price.value ?? 0) - (a.item.price.value ?? 0))
    .slice(0, 10);

  wrapped.mostExpensiveLost = wrapped.hottestLost[0]?.item ?? null;

  wrapped.avgRefreshTime = sumAvgRefreshTime / wrapped.totalRefreshes;
  wrapped.avgReactionTime = sumAvgReactionTime / wrapped.totalClicks;

  const favoriteItem_iid = Object.keys(wrapped.buyCount).reduce(
    (prev, curr) => (wrapped.buyCount[prev] > wrapped.buyCount[curr] ? prev : curr),
    Object.keys(wrapped.buyCount)[0]
  );

  const favoriteItem = await getItem(Number(favoriteItem_iid));
  if (!favoriteItem) throw 'Favorite Item not found';

  wrapped.favoriteItem = {
    item: favoriteItem,
    count: wrapped.buyCount[favoriteItem_iid],
  };

  return { wrapped, monthly: monthlyStats };
};

const bulkGetMany = async (item_iids: number[]) => {
  const batchSize = 10;

  let results = {};
  for (let batch of chunk(item_iids, batchSize)) {
    const res = await getManyItemsPriceHistory({ item_iids: batch });
    results = { ...results, ...res };
  }

  return results as Awaited<ReturnType<typeof getManyItemsPriceHistory>>;
};
