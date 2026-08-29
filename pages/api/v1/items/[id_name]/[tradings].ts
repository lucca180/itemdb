import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { LebronSearchResponse, NCTradeReport } from '@types';
import prisma from '@utils/prisma';
import { CheckAuth } from '@utils/googleCloud';
import { Prisma } from '@prisma/generated/client';
import { redis_setDataCount } from '@utils/api/redis';
import {
  ItemRevalidateTags,
  MallHubRevalidateTags,
  revalidateAppCache,
  revalidateItem,
} from '@utils/item/revalidateItem';
import {
  getAuctionHistory,
  getRestockHistory,
  getTradeHistory,
} from '@app/server/items/seenHistory';

export { getAuctionData, getRestockData, getTradeData } from '@app/server/items/tradingHistoryData';

const LEBRON_URL = process.env.LEBRON_API_URL;

async function resolveUserId(req: NextApiRequest): Promise<string | undefined> {
  try {
    return (await CheckAuth(req)).user?.id;
  } catch {
    return undefined;
  }
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);
  if (!isNaN(id)) return res.status(400).json({ error: 'Invalid Request' });

  const name = id_name;
  const type = req.query.tradings as string;

  if (type === 'restock') {
    const restock = await getRestockHistory(name);
    redis_setDataCount(restock.recent.length, req);
    return res.json(restock);
  }

  if (type === 'trades') {
    const onlyPriced = req.query.priced === 'true';
    const result = await getTradeHistory(name, {
      onlyPriced,
      userId: await resolveUserId(req),
    });

    if (!result.ok) return res.status(403).json(result.wall);

    redis_setDataCount(result.data.recent.length, req);
    return res.json(result.data);
  }

  if (type === 'auction') {
    const onlySold = req.query.sold === 'true';
    const result = await getAuctionHistory(name, {
      onlySold,
      userId: await resolveUserId(req),
    });

    if (!result.ok) return res.status(403).json(result.wall);

    if (onlySold) {
      res.setHeader('Cache-Control', 'max-age=0, s-maxage=120, must-revalidate');
    }

    redis_setDataCount(result.data.recent.length, req);
    return res.json(result.data);
  }

  if (type === 'lebron') {
    const lebron = await getLebronItemData(name);

    // trade report data doesn't change often and can be cached for a bit longer
    res.setHeader('Cache-Control', 'max-age=0, s-maxage=300, must-revalidate');

    return res.json(lebron);
  }

  if (type === 'nctrade') {
    const trades = await getNCTradeData(id || name);
    return res.json(trades);
  }

  return res.status(400).json({ error: 'Invalid Request' });
}

export const getLebronItemData = async (name: string) => {
  try {
    const res = await axios.get(LEBRON_URL + 'search/' + encodeURIComponent(name), {
      headers: {
        Authorization: 'Bearer ' + process.env.LEBRON_API_KEY,
        Referer: 'https://itemdb.com.br',
      },
    });

    const data = res.data as LebronSearchResponse;

    updateLebronVal(data);

    return data;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;

    console.error('Error fetching Lebron data:', e);
    return null;
  }
};

export const getNCTradeData = async (name: string | number) => {
  const ncTradeRaw = await prisma.ncTrade.findMany({
    where: {
      NCTradeItems: {
        some: typeof name === 'string' ? { item_name: name } : { item_iid: name },
      },
    },
    include: {
      NCTradeItems: {
        include: {
          item: true,
        },
      },
    },
    orderBy: { tradeDate: 'desc' },
  });

  const trades: NCTradeReport[] = ncTradeRaw.map((trade) => {
    return {
      notes: trade.notes,
      date: trade.tradeDate.toJSON(),
      offered: trade.NCTradeItems.filter((item) => item.type === 'offered').map((item) => ({
        itemName: (item.item?.name ?? item.item_name) as string,
        personalValue: item.personalValue,
        quantity: item.quantity,
      })),
      received: trade.NCTradeItems.filter((item) => item.type === 'received').map((item) => ({
        itemName: (item.item?.name ?? item.item_name) as string,
        personalValue: item.personalValue,
        quantity: item.quantity,
      })),
    };
  });

  return {
    trades: trades,
    totalTrades: ncTradeRaw.length,
  };
};

const updateLebronVal = async (res: LebronSearchResponse) => {
  if (!res.itemStats.value) return;
  const lebronItem = res.itemStats;

  const lastUpdated = lebronItem.lastUpdated;
  if (lastUpdated == null || lastUpdated === 'unknown') return;
  const pricedAt = new Date(lastUpdated);
  if (Number.isNaN(pricedAt.getTime())) return;

  const item = await prisma.items.findFirst({
    where: {
      name: lebronItem.name,
      isNC: true,
    },
  });

  if (!item) {
    console.error(`Item not found for Lebron update: ${lebronItem.name}`);
    return;
  }

  const oldVal = await prisma.owlsPrice.findFirst({
    where: {
      item_iid: item.internal_id,
      isLatest: true,
    },
  });

  if (
    oldVal &&
    oldVal.value === lebronItem.value &&
    oldVal.pricedAt.getTime() === pricedAt.getTime()
  )
    return;

  const newVal: Prisma.OwlsPriceUncheckedCreateInput = {
    value: lebronItem.value,
    item_iid: item.internal_id,
    addedAt: new Date(),
    isLatest: true,
    pricedAt,
    valueMin: Number(lebronItem.value.split('-')[0]) || 0,
    isVolatile: lebronItem.isVolatile,
    source: 'lebron',
  };

  const updateRaw = prisma.owlsPrice.updateMany({
    where: {
      item_iid: item.internal_id,
      isLatest: true,
    },
    data: {
      isLatest: null,
    },
  });

  const createRaw = prisma.owlsPrice.create({
    data: newVal,
  });

  await prisma.$transaction([updateRaw, createRaw]);

  await Promise.all([
    revalidateItem(item.internal_id, ItemRevalidateTags.root(item.internal_id)),
    revalidateAppCache([MallHubRevalidateTags.lebron]),
  ]);
};
