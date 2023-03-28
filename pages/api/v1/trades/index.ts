import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { TradeData } from '../../../../types';
import requestIp from 'request-ip';
import { CheckAuth } from '../../../../utils/googleCloud';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { checkHash } from '../../../../utils/hash';
import { Prisma } from '.prisma/client';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') return GET(req, res);
    if (req.method === 'POST') return POST(req, res);
    if (req.method === 'PATCH') return PATCH(req, res);

    if (req.method == 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH');
      return res.status(200).json({});
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const name = req.query.name as string;
  const image_id = req.query.image_id as string | undefined;

  const tradeRaw = await prisma.trades.findMany({
    where: {
      items: {
        some: {
          name: name,
          image_id: image_id || undefined,
        },
      },
    },
    include: { items: true },
    orderBy: { trade_id: 'desc' },
    take: 20,
  });

  const trades: TradeData[] = tradeRaw.map((t) => {
    return {
      trade_id: t.trade_id,
      owner: t.owner,
      wishlist: t.wishlist,
      addedAt: t.addedAt.toJSON(),
      processed: t.processed,
      priced: t.priced,
      items: t.items.map((i) => {
        return {
          internal_id: i.internal_id,
          trade_id: i.trade_id,
          name: i.name,
          image: i.image,
          image_id: i.image_id,
          price: i.price,
          order: i.order,
          addedAt: i.addedAt.toJSON(),
        };
      }),
    };
  });

  return res.json(trades);
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  const tradeLots = data.tradeLots;
  const lang = data.lang;
  //const dataHash = data.hash;

  // if(!checkHash(dataHash, {tradeLots: tradeLots}))
  //   return res.status(400).json({ error: 'Invalid hash' });

  if (lang !== 'en') return res.status(400).json('Language must be english');

  const promiseArr = [];

  for (const lot of tradeLots) {
    const itemList = [];

    for (const item of lot.items) {
      let { name, img, order } = item;
      let imageId;

      if (!name || !img) continue;

      if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');

      if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? null;

      const x = {
        name: name,
        image: img,
        image_id: imageId as string,
        order: order,
      };

      itemList.push(x);
    }

    // its not possible to use createMany with multiple related records
    // so we have to try to create the trade and then create the items
    const prom = prisma.trades.create({
      data: {
        trade_id: Number(lot.tradeID),
        wishlist: lot.wishList,
        owner: lot.owner,
        ip_address: requestIp.getClientIp(req),
        priced: lot.wishList === 'none',
        processed: lot.wishList === 'none',
        items: {
          create: [...itemList],
        },
      },
    });

    promiseArr.push(prom);
  }

  // we have to use Promise.allSettled because we dont want to fail the whole request if one trade fails
  // (and it will fail, because we cant create the same trade twice)
  const result = await Promise.allSettled(promiseArr);

  res.json(result);
};

const PATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const trade = req.body.trade as TradeData;
  const { user } = await CheckAuth(req);

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const result = await processTradePrice(trade, req);

  return res.json(result);
};

export const processTradePrice = async (trade: TradeData, req?: NextApiRequest) => {
  const updateTrade = prisma.trades.update({
    where: { trade_id: trade.trade_id },
    data: {
      priced: true,
      processed: true,
    },
  });

  const updateItems = trade.items.map((item) => {
    return prisma.tradeItems.update({
      where: { internal_id: item.internal_id },
      data: {
        price: item.price,
      },
    });
  });

  const addPriceProcess: Prisma.PriceProcessCreateInput[] = [];

  for (const item of trade.items.filter((x) => x.price)) {
    if (!item.image_id || !item.name) throw 'processTradePrice: Missing image_id or name';

    const dbItem = await prisma.items.findFirst({
      where: {
        name: item.name,
        image_id: item.image_id,
      },
    });

    addPriceProcess.push({
      name: item.name,
      price: item.price as number,
      image: item.image,
      image_id: item.image_id,
      item_id: dbItem ? dbItem.item_id : undefined,
      type: 'trade',
      owner: trade.owner,
      addedAt: trade.addedAt,
      language: 'en',
      ip_address: req ? requestIp.getClientIp(req) : undefined,
    });
  }

  const priceProcess = prisma.priceProcess.createMany({
    data: addPriceProcess,
    skipDuplicates: true,
  });

  return await prisma.$transaction([updateTrade, ...updateItems, priceProcess]);
};
