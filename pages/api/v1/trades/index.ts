import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { TradeData } from '../../../../types';
import requestIp from 'request-ip';
import { CheckAuth } from '../../../../utils/googleCloud';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { checkHash } from '../../../../utils/hash';
import { Items, Prisma } from '.prisma/client';
import { stringHasNumber } from '../../../../utils/utils';
import hash from 'object-hash';
import { autoPriceTrades2 } from './autoPrice2';

const TARNUM_KEY = process.env.TARNUM_KEY;

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

  const trades = await getItemTrades({ name, image_id });
  return res.json(trades);
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const tarnumkey = req.headers['tarnumkey'] as string | undefined;

  const tradeLots = data.tradeLots;
  const lang = data.lang;
  const dataHash = data.hash;

  if (!checkHash(dataHash, { tradeLots: tradeLots }) && tarnumkey !== TARNUM_KEY)
    return res.status(400).json({ error: 'Invalid hash' });

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

    if (itemList.length === 0) continue;

    const tradeHash = hash({
      wishlist: lot.wishList,
      items: itemList,
    });

    const similarTrades = await prisma.trades.findFirst({
      where: {
        owner: lot.owner,
        hash: tradeHash,
        addedAt: {
          gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 3),
        },
      },
    });

    if (similarTrades) continue;

    // its not possible to use createMany with multiple related records
    // so we have to try to create the trade and then create the items
    const prom = prisma.trades.create({
      data: {
        trade_id: Number(lot.tradeID),
        wishlist: lot.wishList,
        owner: lot.owner,
        ip_address: requestIp.getClientIp(req),
        priced: lot.wishList === 'none' || !stringHasNumber(lot.wishList),
        processed: lot.wishList === 'none' || !stringHasNumber(lot.wishList),
        hash: tradeHash,
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

  const allTrades = await prisma.trades.findMany({
    where: {
      trade_id: {
        in: result.filter((x) => x.status === 'fulfilled').map((x: any) => x.value.trade_id),
      },
      processed: false,
    },
    include: {
      items: true,
    },
  });

  await autoPriceTrades2(allTrades);

  res.json(result);
};

const PATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const trade = req.body.trade as TradeData;
  const { user } = await CheckAuth(req);

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  await processTradePrice(trade, req);

  return res.status(200).json({ success: true, message: false });
};

export const processTradePrice = async (trade: TradeData, req?: NextApiRequest) => {
  const tradeHash = trade.hash;
  const originalTrade = await prisma.trades.findFirst({
    where: {
      trade_id: trade.trade_id,
    },
  });

  const isUpdate = !!originalTrade?.processed;

  const updateItems = trade.items
    .filter((x) => x.price && x.price > 0 && x.price < Math.pow(2, 31)) // max int32
    .map((item) => {
      return prisma.tradeItems.updateMany({
        where: {
          OR: [
            {
              internal_id: item.internal_id,
            },
            tradeHash
              ? {
                  order: item.order,
                  trade: {
                    hash: tradeHash,
                    processed: false,
                    priced: false,
                  },
                }
              : {},
          ],
        },
        data: {
          price: item.price,
        },
      });
    });

  await Promise.all(updateItems);

  const itemUpdate = await prisma.tradeItems.findMany({
    where: {
      OR: [
        {
          trade: tradeHash
            ? {
                hash: tradeHash,
                processed: false,
                priced: false,
              }
            : {},
        },
        {
          trade_id: trade.trade_id,
        },
      ],
    },
    include: {
      trade: true,
    },
  });

  const tradesIDs = [...new Set(itemUpdate.map((x) => x.trade_id))];

  const tradeUpdate = prisma.trades.updateMany({
    where: {
      OR: [
        {
          trade_id: trade.trade_id,
        },
        tradeHash
          ? {
              hash: tradeHash,
              priced: false,
              processed: false,
            }
          : {},
      ],
    },
    data: {
      priced: true,
      tradesUpdated: tradesIDs.toString(),
      processed: true,
    },
  });

  if (isUpdate) {
    const ids = originalTrade.tradesUpdated?.split(',').map((x) => Number(x)) ?? [];
    await prisma.priceProcess.deleteMany({
      where: {
        neo_id: { in: ids },
        type: 'trade',
      },
    });
  }

  const addPriceProcess: Prisma.PriceProcessCreateInput[] = [];

  const itemHistory: { [id: string]: Items } = {};

  for (const item of itemUpdate.filter((x) => x.price)) {
    if (!item.image_id || !item.name) throw 'processTradePrice: Missing image_id or name';

    let dbItem: Items | null = itemHistory[`${item.name}-${item.image_id}`];

    if (!dbItem) {
      dbItem = await prisma.items.findFirst({
        where: {
          name: item.name,
          image_id: item.image_id,
        },
      });

      if (dbItem) itemHistory[`${item.name}-${item.image_id}`] = dbItem;
    }

    addPriceProcess.push({
      name: item.name,
      price: item.price as number,
      image: item.image,
      image_id: item.image_id,
      item_id: dbItem ? dbItem.item_id : undefined,
      neo_id: item.trade_id,
      type: 'trade',
      owner: item.trade.owner,
      addedAt: item.trade.addedAt,
      language: 'en',
      ip_address: req ? requestIp.getClientIp(req) : undefined,
    });
  }

  const priceProcess = prisma.priceProcess.createMany({
    data: addPriceProcess,
    skipDuplicates: true,
  });

  const priceHistory = prisma.priceProcessHistory.deleteMany({
    where: {
      name: {
        in: addPriceProcess.map((x) => x.name),
      },
    },
  });

  return await prisma.$transaction([tradeUpdate, priceProcess, priceHistory]);
};

type getItemTradesArgs = {
  name: string;
  image_id?: string;
};

export const getItemTrades = async (args: getItemTradesArgs) => {
  const { name, image_id } = args;

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
      hash: t.hash,
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

  return trades;
};
