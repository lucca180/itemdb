import type { NextApiRequest, NextApiResponse } from 'next';
import { ItemAuctionData, ItemRestockData, TradeData } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { getManyItems } from '../many';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
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

  if (type === 'trade') {
    const trade = await getTradeData(name);
    return res.json(trade);
  }

  if (type === 'auction') {
    const auction = await getAuctionData(name);
    return res.json(auction);
  }

  return res.status(400).json({ error: 'Invalid Request' });
}

const getRestockData = async (name: string) => {
  const restockRaw = await prisma.priceProcess.findMany({
    where: {
      name: name,
      type: 'restock',
    },
    orderBy: { addedAt: 'desc' },
    take: 20,
  });

  const items = await getManyItems({
    item_id: restockRaw.map((p) => p.item_id?.toString() ?? ''),
  });

  const restock: ItemRestockData[] = restockRaw.map((p) => {
    return {
      internal_id: p.internal_id,
      item: items[p.item_id?.toString() ?? ''],
      type: p.type,
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
      items: p.items.map((i) => ({
        internal_id: i.internal_id,
        trade_id: i.trade_id,
        name: i.name,
        image: i.image,
        image_id: i.image_id,
        price: i.price,
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
  const auctionRaw = await prisma.priceProcess.findMany({
    where: {
      name: name,
      type: 'auction',
    },
    orderBy: { addedAt: 'desc' },
    take: 20,
  });

  const items = await getManyItems({
    name_image_id: auctionRaw.map((p) => [p.name, p.image_id] as [string, string]),
  });

  const auctions: ItemAuctionData[] = auctionRaw.map((p) => {
    const name_image_id = `${encodeURI(p.name.toLowerCase())}_${p.image_id}`;
    return {
      auction_id: p.neo_id,
      internal_id: p.internal_id,
      item: items[name_image_id],
      price: p.price,
      owner: p.owner ?? 'unknown',
      isNF: !!p.otherInfo?.split(',').includes('nf'),
      hasBuyer: !!p.otherInfo?.includes('nobody'),
      addedAt: p.addedAt.toJSON(),
      timeLeft: p.otherInfo?.split(',')?.[1] ?? null,
    };
  });

  return auctions;
};
