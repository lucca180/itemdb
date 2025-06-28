import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  ItemAuctionData,
  ItemRestockData,
  LebronSearchResponse,
  NCTradeReport,
  TradeData,
} from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { getManyItems } from '../many';
import { CheckAuth } from '../../../../../utils/googleCloud';
import { contributeCheck } from '../../restock/wrapped-check';
import { Prisma } from '@prisma/generated/client';

const LEBRON_URL = process.env.LEBRON_API_URL;

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
    const restock = await getRestockData(name);
    return res.json(restock);
  }

  if (type === 'trades') {
    const onlyPriced = req.query.priced === 'true';
    if (onlyPriced && !(await checkGoal(req, res))) return;

    const trade = await getTradeData(name, onlyPriced);
    return res.json(trade);
  }

  if (type === 'auction') {
    const onlySold = req.query.sold === 'true';
    if (onlySold && !(await checkGoal(req, res))) return;

    const auction = await getAuctionData(name, onlySold);
    return res.json(auction);
  }

  if (type === 'lebron') {
    const lebron = await getLebronItemData(name);
    return res.json(lebron);
  }

  if (type === 'nctrade') {
    const trades = await getNCTradeData(id || name);
    return res.json(trades);
  }

  return res.status(400).json({ error: 'Invalid Request' });
}

const getRestockData = async (name: string) => {
  const restockRaw = await prisma.restockAuctionHistory.findMany({
    where: {
      item: {
        name: name,
      },
      type: 'restock',
      owner: {
        not: 'restock-haggle',
      },
      addedAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
      },
    },
    orderBy: { addedAt: 'desc' },
  });

  const items = await getManyItems({
    id: restockRaw.map((p) => p.item_iid?.toString() ?? ''),
  });

  let totalStock = 0;

  const restock: ItemRestockData[] = restockRaw.map((p): ItemRestockData => {
    totalStock += p.stock;
    return {
      internal_id: p.internal_id,
      item: items[p.item_iid?.toString() ?? ''],
      stock: p.stock,
      price: p.price,
      addedAt: p.addedAt.toJSON(),
    };
  });

  return {
    recent: restock.slice(0, 20),
    appearances: restock.length,
    totalStock: totalStock,
    period: '90-days',
  };
};

const getTradeData = async (name: string, onlyPriced = false) => {
  const tradeRaw = await prisma.trades.findMany({
    where: {
      items: {
        some: {
          name: name,
        },
      },
      addedAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
      },
      priced: onlyPriced ? true : undefined,
    },
    include: {
      items: true,
    },
    orderBy: { addedAt: 'desc' },
  });

  const uniqueOwners = new Set();
  let priced = 0;

  const tradeList: TradeData[] = tradeRaw
    .map((p) => {
      const item = p.items.find((i) => i.name === name);

      if (item && !!item.price?.toNumber() && p.priced) priced++;
      if (onlyPriced && item && !item.price?.toNumber()) return null;

      uniqueOwners.add(p.owner);
      return {
        trade_id: p.trade_id,
        owner: p.owner,
        priced: p.priced,
        hash: p.hash,
        items: p.items.map((i) => ({
          internal_id: i.internal_id,
          trade_id: i.trade_id,
          name: i.name,
          image: i.image,
          image_id: i.image_id,
          price: i.price?.toNumber() || null,
          order: i.order,
          addedAt: i.addedAt.toJSON(),
        })),
        wishlist: p.wishlist,
        processed: p.processed,
        addedAt: p.addedAt.toJSON(),
      };
    })
    .filter((p) => p !== null) as TradeData[];

  return {
    recent: tradeList.slice(0, 20),
    total: tradeRaw.length,
    uniqueOwners: uniqueOwners.size,
    priced: priced,
    period: '90-days',
  };
};

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
  } catch (e) {
    console.error('Error fetching Lebron data:', e);
    return null;
  }
};

const getAuctionData = async (name: string, onlySold = false) => {
  const auctionRaw = await prisma.restockAuctionHistory.findMany({
    where: {
      item: {
        name: name,
      },
      otherInfo: onlySold
        ? {
            not: {
              contains: 'nobody',
            },
          }
        : {},
      addedAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
      },
      type: 'auction',
    },
    orderBy: { addedAt: 'desc' },
  });

  const items = await getManyItems({
    id: auctionRaw.map((p) => p.item_iid.toString()),
  });

  const uniqueOwners = new Set();
  let soldAuctions = 0;
  const totalAuctions = auctionRaw.length;

  const auctions: ItemAuctionData[] = auctionRaw.map((p) => {
    uniqueOwners.add(p.owner);
    if (!p.otherInfo?.includes('nobody')) soldAuctions++;

    return {
      auction_id: p.neo_id,
      internal_id: p.internal_id,
      item: items[p.item_iid?.toString() ?? ''],
      price: p.price,
      owner: p.owner ?? 'unknown',
      isNF: !!p.otherInfo?.toLowerCase().split(',').includes('nf'),
      hasBuyer: !p.otherInfo?.includes('nobody'),
      addedAt: p.addedAt.toJSON(),
      timeLeft: p.otherInfo?.split(',')?.[1] ?? null,
    };
  });

  return {
    recent: auctions.slice(0, 20),
    total: totalAuctions,
    sold: soldAuctions,
    uniqueOwners: uniqueOwners.size,
    period: '90-days',
  };
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

// -------------------- //

const checkGoal = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { user } = await CheckAuth(req);

    const contributeGoal = await contributeCheck(user?.id, 2);

    if (!contributeGoal.success) {
      res.status(403).json(contributeGoal);
      return false;
    }
  } catch (err) {
    const contributeGoal = await contributeCheck(undefined, 2);

    if (!contributeGoal.success) {
      res.status(403).json(contributeGoal);
      return false;
    }
  }

  return true;
};

const updateLebronVal = async (res: LebronSearchResponse) => {
  if (!res.itemStats.value) return;
  const lebronItem = res.itemStats;

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
    oldVal.pricedAt.getTime() === lebronItem.lastUpdated
  )
    return;

  const newVal: Prisma.OwlsPriceUncheckedCreateInput = {
    value: lebronItem.value,
    item_iid: item.internal_id,
    addedAt: new Date(),
    isLatest: true,
    pricedAt: new Date(lebronItem.lastUpdated),
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
};
