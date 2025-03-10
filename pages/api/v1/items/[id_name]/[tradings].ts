import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ItemRestockData, TradeData } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { getManyItems } from '../many';

const OWLS_URL = process.env.OWLS_API_URL;

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
    const trade = await getTradeData(name);
    return res.json(trade);
  }

  // if (type === 'auction') {
  //   const auction = await getAuctionData(name);
  //   return res.json(auction);
  // }

  if (type === 'owls') {
    const owls = await getOwlsTradeData(name);
    return res.json(owls);
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

const getTradeData = async (name: string) => {
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
    },
    include: {
      items: true,
    },
    orderBy: { addedAt: 'desc' },
  });

  const uniqueOwners = new Set();
  let priced = 0;

  const tradeList: TradeData[] = tradeRaw.map((p) => {
    uniqueOwners.add(p.owner);
    return {
      trade_id: p.trade_id,
      owner: p.owner,
      priced: p.priced,
      hash: p.hash,
      items: p.items.map((i) => {
        if (i.name === name && !!i.price?.toNumber() && p.priced) priced++;

        return {
          internal_id: i.internal_id,
          trade_id: i.trade_id,
          name: i.name,
          image: i.image,
          image_id: i.image_id,
          price: i.price?.toNumber() || null,
          order: i.order,
          addedAt: i.addedAt.toJSON(),
        };
      }),
      wishlist: p.wishlist,
      processed: p.processed,
      addedAt: p.addedAt.toJSON(),
    };
  });

  return {
    recent: tradeList.slice(0, 20),
    total: tradeRaw.length,
    uniqueOwners: uniqueOwners.size,
    priced: priced,
    period: '90-days',
  };
};

const getOwlsTradeData = async (name: string) => {
  try {
    const res = await axios.get(OWLS_URL + '/itemdata/profile/' + encodeURIComponent(name));

    if (res.data?.trade_reports) return res.data.trade_reports;
    else return [];
  } catch (e) {
    return [];
  }
};
