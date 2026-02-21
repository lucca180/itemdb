import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ItemData, TradeData } from '../../../../types';
import requestIp from 'request-ip';
import { CheckAuth } from '../../../../utils/googleCloud';

import { checkHash } from '../../../../utils/hash';
import { Prisma } from '@prisma/generated/client';
import { shouldSkipTrade } from '../../../../utils/utils';
import hash from 'object-hash';
import { autoPriceTrades2 } from './autoPrice2';
import { newCreatePriceProcessFlow } from '../prices';
import { TradeItems, Trades } from '@prisma/generated/client';
import { getManyItems } from '../items/many';
import { processSimilarTrades } from '../../feedback/send';

const TARNUM_KEY = process.env.TARNUM_KEY;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

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
  const item_iid = req.query.item_iid as string | undefined;

  if (!item_iid) return res.status(400).json({ error: 'Missing item_iid' });

  const trades = await getItemTrades({ item_iid: Number(item_iid) });
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
  const toPriceProcess = [] as Prisma.PriceProcess2UncheckedCreateInput[];
  let itemDataRaw: { [key: string]: ItemData } = {};

  for (const lot of tradeLots) {
    const itemList: {
      name: string;
      image: string;
      image_id: string;
      order: number;
      item_iid: number | null;
      amount: number;
      price?: number;
    }[] = [];

    let fetchList: [string, string][] = [];

    for (const item of lot.items) {
      let { name, img, order, amount } = item;
      let imageId;

      if (!name || !img) continue;

      if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');

      if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? null;

      if (!imageId) continue;

      const itemKey = `${encodeURI(name.toLowerCase())}_${imageId}`;
      const itemData = itemDataRaw[itemKey];

      if (!itemData) {
        fetchList.push([name, imageId]);
      }

      const x = {
        name: name,
        image: img,
        image_id: imageId as string,
        item_iid: itemData ? itemData.internal_id : null,
        order: order,
        amount: amount || 1,
      };

      itemList.push(x);
    }

    if (itemList.length === 0) continue;

    const itemReq = await getManyItems({
      name_image_id: fetchList,
    });

    fetchList = [];

    itemDataRaw = { ...itemDataRaw, ...itemReq };

    let isMissingInfo = false;

    itemList.forEach((item) => {
      if (!item.item_iid) {
        const itemData = itemReq[`${encodeURI(item.name.toLowerCase())}_${item.image_id}`];
        if (itemData) {
          item.item_iid = itemData.internal_id;
        } else {
          item.item_iid = null;
          isMissingInfo = true;
        }
      }
    });

    // if we are missing item info, skip the trade
    if (isMissingInfo) continue;

    const oldTradeHash = hash({
      wishlist: lot.wishList,
      items: itemList,
    });

    const newTradeHash = hash({
      wishlist: lot.wishList.toLowerCase().trim().replace(/\s/g, ''),
      items: itemList,
    });

    const similarTrades = await prisma.trades.findFirst({
      where: {
        owner: lot.owner,
        OR: [{ hash: newTradeHash }, { hash: oldTradeHash }],
        addedAt: {
          gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 3),
        },
      },
    });

    if (similarTrades) continue;

    const isAllItemsEqual = itemList.every(
      (item) => item.name === itemList[0].name && item.image_id === itemList[0].image_id
    );

    const itemCount = itemList.reduce((acc, item) => acc + (item.amount || 1), 0);

    let isPriced = false;

    if (isAllItemsEqual && lot.instantBuy) {
      const uniquePrice = Math.floor(lot.instantBuy / itemCount);
      itemList.forEach((item) => {
        item['price'] = uniquePrice;
      });
      isPriced = true;
    }

    const createItems: Prisma.TradeItemsUncheckedCreateWithoutTradeInput[] = itemList.map(
      (item) => ({
        item_iid: item.item_iid,
        order: item.order,
        amount: item.amount || 1,
        price: item.price || null,
      })
    );

    const tradeData: Prisma.TradesCreateInput = {
      trade_id: Number(lot.tradeID),
      wishlist: lot.wishList.trim(),
      owner: lot.owner,
      ip_address: requestIp.getClientIp(req),
      priced:
        isPriced || (!lot.instantBuy && (lot.wishList === 'none' || shouldSkipTrade(lot.wishList))),
      processed:
        isPriced || (!lot.instantBuy && (lot.wishList === 'none' || shouldSkipTrade(lot.wishList))),
      isAllItemsEqual: isAllItemsEqual,
      itemsCount: itemCount,
      hash: newTradeHash,
      instantBuy: lot.instantBuy || null,
      createdAt: lot.createdAt ? new Date(lot.createdAt) : null,
      items: {
        create: createItems,
      },
    };

    // its not possible to use createMany with multiple related records
    // so we have to try to create the trade and then create the items
    const prom = prisma.trades.create({
      data: tradeData,
      include: {
        items: true,
      },
    });

    toPriceProcess.push(
      ...tradeItemToProcessItem(
        tradeData.items!.create as Prisma.TradeItemsCreateManyInput[],
        tradeData
      )
    );
    promiseArr.push(prom);
  }

  // we have to use Promise.allSettled because we dont want to fail the whole request if one trade fails
  // (and it will fail, because we cant create the same trade twice)
  const result = await Promise.allSettled(promiseArr);

  const tradesFulfilled = result
    .filter((x) => x.status === 'fulfilled')
    .map((x: any) => x.value) as unknown as (Trades & {
    items: TradeItems[];
  })[];

  await updateLastSeenTrades(tradesFulfilled);
  await newCreatePriceProcessFlow(toPriceProcess, true);
  await autoPriceTrades2(tradesFulfilled.filter((x) => !x.processed));

  res.json(result);
};

const PATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const trade = req.body.trade as TradeData;
  const { user } = await CheckAuth(req);

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  await Promise.all([
    processTradePrice(trade, req),
    processSimilarTrades(trade, trade.trade_id, user.id),
  ]);

  return res.status(200).json({ success: true, message: false });
};

const MAX_SUPPORTED_NUMBER = 99999999999;

export const processTradePrice = async (
  trade: TradeData | (Trades & { items: TradeItems[] }),
  req?: NextApiRequest
) => {
  let tradeHash = trade.hash;

  const originalTrade = await prisma.trades.findFirst({
    where: {
      trade_id: trade.trade_id,
    },
    include: {
      items: true,
    },
  });

  if (!tradeHash && originalTrade) tradeHash = originalTrade.hash;
  if (!tradeHash) throw 'processTradePrice: Missing tradeHash';

  const isUpdate = !!originalTrade?.processed;

  // this is the worst (or is it?)
  // update: (its getting worse and worse)
  // update 2: god help us all
  const updateItems = trade.items
    .filter((x) => x.price && Number(x.price) > 0 && Number(x.price) < MAX_SUPPORTED_NUMBER)
    .map((item) => {
      if (
        isUpdate &&
        originalTrade.items.find((x) => x.internal_id === item.internal_id)?.price === item.price
      )
        return [];

      const transaction: any = [
        prisma.tradeItems.update({
          where: {
            internal_id: item.internal_id,
          },
          data: {
            price: item.price,
          },
        }),

        prisma.$executeRaw(Prisma.sql`
          UPDATE TradeItems ti
          JOIN Trades t0
            ON ti.trade_id = t0.trade_id
          AND t0.hash = ${tradeHash}
          AND t0.processed = 0
          AND t0.priced = 0
          SET ti.price = ${item.price}
          WHERE ti.order = ${item.order}
        `),
      ];

      if (isUpdate && originalTrade.tradesUpdated) {
        transaction.push(
          prisma.$executeRaw(Prisma.sql`
          UPDATE TradeItems ti
          JOIN Trades t ON ti.trade_id = t.trade_id
          SET ti.price = ${item.price}
          WHERE ti.order = ${item.order}
            AND t.trade_id IN (${Prisma.join(
              originalTrade.tradesUpdated.split(',').map((x) => Number(x))
            )})
        `)
        );
      }

      return prisma.$transaction(transaction, { isolationLevel: 'ReadUncommitted' });
    });

  await Promise.all(updateItems.flat());

  const itemUpdate = await getTradeItems(trade.trade_id, tradeHash);

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
    await prisma.priceProcess2.deleteMany({
      where: {
        neo_id: { in: ids },
        type: 'trade',
      },
    });
  }

  const addPriceProcess: Prisma.PriceProcess2UncheckedCreateInput[] = [];

  for (const item of itemUpdate.filter((x) => x.price)) {
    if (!item.item_iid) throw 'processTradePrice: Missing item_iid';

    addPriceProcess.push({
      item_iid: item.item_iid,
      price: item.price!.toNumber(),
      neo_id: item.trade_id,
      type: 'trade',
      owner: item.trade.owner,
      addedAt: item.trade.addedAt,
      ip_address: req ? requestIp.getClientIp(req) : undefined,
    });
  }

  const [result] = await Promise.all([
    prisma.$transaction([tradeUpdate]),
    newCreatePriceProcessFlow(addPriceProcess, true),
  ]);

  return result;
};

type getItemTradesArgs = {
  item_iid?: number;
};

export const getItemTrades = async (args: getItemTradesArgs) => {
  const { item_iid } = args;

  if (!item_iid) {
    throw new Error('getItemTrades: At least one argument (item_iid) must be provided');
  }

  const tradeRaw = await prisma.trades.findMany({
    where: {
      items: {
        some: {
          item_iid: item_iid,
        },
      },
    },
    include: {
      items: {
        include: {
          item: true,
        },
      },
    },
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
      instantBuy: t.instantBuy || null,
      createdAt: t.createdAt ? t.createdAt.toJSON() : null,
      items: t.items.map((i) => {
        return {
          name: i.item?.name || '',
          image: i.item?.image || '',
          image_id: i.item?.image_id || '',
          internal_id: i.internal_id,
          trade_id: i.trade_id,
          item_iid: i.item_iid || null,
          price: i.price?.toNumber() || null,
          order: i.order,
          addedAt: i.addedAt.toJSON(),
          amount: i.amount || 1,
        };
      }),
    };
  });

  return trades;
};

const updateLastSeenTrades = async (
  trades: (Trades & {
    items: TradeItems[];
  })[]
) => {
  const items_iid = trades
    .map((x) => x.items.map((i) => i.item_iid))
    .flat()
    .filter((x) => x !== null) as number[];

  const createMany = items_iid.map((iid) => ({
    item_iid: iid,
    type: 'trade',
    lastSeen: new Date(),
  }));

  await prisma.lastSeen.updateMany({
    where: {
      item_iid: {
        in: items_iid,
      },
      type: 'trade',
    },
    data: {
      lastSeen: new Date(),
    },
  });

  await prisma.lastSeen.createMany({
    data: createMany,
    skipDuplicates: true,
  });
};

const getTradeItems = async (trade_id: number, hash: string | null) => {
  const res = (await prisma.$queryRaw`
    select * from tradeitems ti left join trades t on ti.trade_id = t.trade_id 
    where (t.hash = ${
      hash ?? '-1'
    } and t.processed = 0 and t.priced = 0) or t.trade_id = ${trade_id}
  `) as (TradeItems & Trades)[];

  return res.map((x) => ({
    internal_id: x.internal_id,
    trade_id: x.trade_id,
    order: x.order,
    price: x.price,
    addedAt: x.addedAt,
    item_iid: x.item_iid,
    trade: {
      trade_id: x.trade_id,
      owner: x.owner,
      wishlist: x.wishlist,
      addedAt: x.addedAt,
      processed: x.processed,
      priced: x.priced,
      hash: x.hash,
      tradesUpdated: x.tradesUpdated,
    },
  }));
};

const tradeItemToProcessItem = (
  tradeItems: Prisma.TradeItemsCreateManyInput[],
  trade: Prisma.TradesCreateInput
): Prisma.PriceProcess2CreateManyInput[] => {
  return tradeItems
    .filter((x) => !!x.price)
    .map((item) => ({
      item_iid: item.item_iid!,
      price: item.price as number,
      neo_id: item.trade_id,
      stock: item.amount || 1,
      type: 'trade',
      addedAt: item.addedAt,
      owner: trade.owner,
      ip_address: trade.ip_address,
    }));
};
