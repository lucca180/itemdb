import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/prisma';
import { getItem } from '.';
import { PriceProcess2, TradeItems, Trades } from '@prisma/client';
import { SaleStatus } from '../../../../../types';
import { differenceInCalendarDays, isSameDay } from 'date-fns';

const MIN_PRICE_DATA = process.env.MIN_PRICE_DATA ? parseInt(process.env.MIN_PRICE_DATA) : 5;
const DISABLE_SALE_STATS = process.env.DISABLE_SALE_STATS === 'true';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);

  const itemQuery = isNaN(id) ? id_name : id;

  const item = await getItem(itemQuery);

  if (!item) return res.status(400).json({ error: 'Item not found' });
  if (!item.price.value) return res.json(null);

  const stats = await getSaleStats(item.internal_id);

  res.json(stats);
}

export const getSaleStats = async (iid: number, dayLimit = 15): Promise<SaleStatus | null> => {
  if (DISABLE_SALE_STATS) return null;
  const saleStats = await prisma.saleStats.findFirst({
    where: {
      item_iid: iid,
      addedAt: {
        gte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  if (saleStats) {
    return {
      sold: saleStats.totalSold,
      total: saleStats.totalItems,
      percent: Math.round((saleStats.totalSold / saleStats.totalItems) * 100),
      status: saleStats.stats,
      type: saleStats.daysPeriod > 15 ? 'unbuyable' : 'buyable',
    };
  }

  const rawPriceData = await prisma.priceProcess2.findMany({
    where: {
      item_iid: iid,
      type: {
        not: 'trade',
      },
      addedAt: {
        gte: new Date(Date.now() - dayLimit * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      addedAt: 'asc',
    },
  });

  if (rawPriceData.length < MIN_PRICE_DATA) return getUBSaleStats(iid, dayLimit, true);

  const mostRecentData = rawPriceData[rawPriceData.length - 1];
  const mostOldData = rawPriceData[0];

  if (differenceInCalendarDays(Date.now(), mostOldData.addedAt) < 7)
    return getUBSaleStats(iid, dayLimit, true);

  const ownersData: { [owner: string]: PriceProcess2[] } = {};

  rawPriceData.map((price) => {
    if (!price.owner) return;
    if (!ownersData[price.owner]) ownersData[price.owner] = [];
    ownersData[price.owner].push(price);
  });

  let itemSold = 0;
  let itemTotal = 0;

  for (const owner in ownersData) {
    const prices = ownersData[owner];

    let lastStock = 0;
    for (let i = 0; i < prices.length; i++) {
      const price = prices[i];

      const isLastOne = i === prices.length - 1;
      const isFromLastXDays = price.addedAt > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      if (price.stock < lastStock) {
        itemSold += lastStock - price.stock;
      } else if (price.stock > lastStock) {
        itemTotal += price.stock - lastStock;
      } else if (
        isLastOne &&
        !isFromLastXDays &&
        !isSameDay(price.addedAt, mostRecentData.addedAt)
      ) {
        itemSold += Math.min(price.stock, 3);
      }

      lastStock = price.stock;
    }
  }

  let type: SaleStatus['type'] = 'buyable';

  const tradeStats = await getUBSaleStats(iid, dayLimit);
  if (tradeStats) {
    itemSold += tradeStats.sold;
    itemTotal += tradeStats.total;

    if (tradeStats.total > itemTotal) {
      type = 'unbuyable';
    }
  }

  if (itemTotal < MIN_PRICE_DATA) return null;

  const salePercent = Math.round((itemSold / itemTotal) * 100);
  let status: 'hts' | 'regular' | 'ets' = 'hts';

  if (salePercent >= 50) status = 'ets';
  else if (salePercent >= 25) status = 'regular';

  await prisma.saleStats.updateMany({
    where: {
      item_iid: iid,
      isLatest: true,
    },
    data: {
      isLatest: null,
    },
  });

  await prisma.saleStats.create({
    data: {
      item_iid: iid,
      totalSold: itemSold,
      totalItems: itemTotal,
      stats: status,
      daysPeriod: dayLimit,
      isLatest: true,
    },
  });

  return { sold: itemSold, total: itemTotal, percent: salePercent, status, type };
};

const getUBSaleStats = async (
  iid: number,
  dayLimit = 15,
  shouldCreate = false
): Promise<SaleStatus | null> => {
  const item = await prisma.items.findUnique({
    where: {
      internal_id: iid,
    },
  });
  if (!item) return null;

  const rawTradeData = await prisma.trades.findMany({
    where: {
      items: {
        some: {
          name: item.name,
          image_id: item.image_id ?? '',
        },
      },
      addedAt: {
        gte: new Date(Date.now() - dayLimit * 2 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      items: true,
    },
    orderBy: {
      addedAt: 'asc',
    },
  });

  if (rawTradeData.length < MIN_PRICE_DATA) return null;

  const mostOldData = rawTradeData[0];

  if (differenceInCalendarDays(Date.now(), mostOldData.addedAt) < 7) return null;

  const ownersData: { [owner: string]: (Trades & { items: TradeItems[] })[] } = {};

  rawTradeData.map((trade) => {
    if (!trade.owner) return;
    if (!ownersData[trade.owner]) ownersData[trade.owner] = [trade];
    else ownersData[trade.owner].push(trade);
  });

  let itemSold = 0;
  let itemTotal = 0;

  for (const owner in ownersData) {
    const trades = ownersData[owner];

    let lastStock = 0;

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      const isLastOne = i === trades.length - 1;
      const isFromLastXDays = trade.addedAt > new Date(Date.now() - dayLimit * 24 * 60 * 60 * 1000);

      const stock = trade.items.filter(
        (i) => i.name === item.name && i.image_id === item.image_id
      ).length;

      if (stock < lastStock) {
        itemSold += lastStock - stock;
      } else if (stock > lastStock) {
        itemTotal += stock - lastStock;
      } else if (isLastOne && !isFromLastXDays) {
        itemSold += Math.min(stock, 3);
      }

      lastStock = stock;
    }
  }

  if (itemTotal < MIN_PRICE_DATA) return null;

  const salePercent = Math.round((itemSold / itemTotal) * 100);

  let status: 'hts' | 'regular' | 'ets' = 'hts';

  if (salePercent >= 50) status = 'ets';
  else if (salePercent >= 25) status = 'regular';

  if (shouldCreate) {
    await prisma.saleStats.updateMany({
      where: {
        item_iid: iid,
        isLatest: true,
      },
      data: {
        isLatest: null,
      },
    });

    await prisma.saleStats.create({
      data: {
        item_iid: iid,
        totalSold: itemSold,
        totalItems: itemTotal,
        stats: status,
        daysPeriod: dayLimit * 2,
      },
    });
  }

  return { sold: itemSold, total: itemTotal, percent: salePercent, status, type: 'unbuyable' };
};
