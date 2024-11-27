import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ItemAuctionData, ItemRestockData, TradeData } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { getManyItems } from '../many';

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
  const type = (req.query.type as string) ?? 'restock';

  if (type === 'restock') {
    const restock = await getRestockData(name);
    return res.json(restock);
  }

  if (type === 'trades') {
    const trade = await getTradeData(name);
    return res.json(trade);
  }

  if (type === 'auction') {
    const auction = await getAuctionData(name);
    return res.json(auction);
  }

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
    },
    orderBy: { addedAt: 'desc' },
    take: 20,
  });

  const items = await getManyItems({
    id: restockRaw.map((p) => p.item_iid?.toString() ?? ''),
  });

  const restock: ItemRestockData[] = restockRaw.map((p): ItemRestockData => {
    return {
      internal_id: p.internal_id,
      item: items[p.item_iid?.toString() ?? ''],
      stock: p.stock,
      price: p.price,
      addedAt: p.addedAt.toJSON(),
    };
  });

  return restock;
};

const getTradeData = async (name: string) => {
  const tradeRaw = await prisma.trades.findMany({
    where: {
      items: {
        some: {
          name: name,
        },
      },
    },
    include: {
      items: true,
    },
    orderBy: { addedAt: 'desc' },
    take: 20,
  });

  const trade: TradeData[] = tradeRaw.map((p) => {
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
  });

  return trade;
};

const getAuctionData = async (name: string) => {
  const auctionRaw = await prisma.restockAuctionHistory.findMany({
    where: {
      item: {
        name: name,
      },
      type: 'auction',
    },
    orderBy: { addedAt: 'desc' },
    take: 20,
  });

  const items = await getManyItems({
    id: auctionRaw.map((p) => p.item_iid.toString()),
  });

  const auctions: ItemAuctionData[] = auctionRaw.map((p) => {
    return {
      auction_id: p.neo_id,
      internal_id: p.internal_id,
      item: items[p.item_iid?.toString() ?? ''],
      price: p.price,
      owner: p.owner ?? 'unknown',
      isNF: !!p.otherInfo?.split(',').includes('nf'),
      hasBuyer: !p.otherInfo?.includes('nobody'),
      addedAt: p.addedAt.toJSON(),
      timeLeft: p.otherInfo?.split(',')?.[1] ?? null,
    };
  });

  return auctions;
};

const getOwlsTradeData = async (name: string) => {
  try {
    const res = await axios.get(
      'https://neo-owls.net/itemdata/profile/' + encodeURIComponent(name)
    );

    if (res.data?.trade_reports) return res.data.trade_reports;
    else return [];
  } catch (e) {
    return [];
  }
};
