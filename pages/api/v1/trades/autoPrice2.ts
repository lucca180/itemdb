import { Prisma, TradeItems, Trades } from '@prisma/generated/client';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { processTradePrice } from '.';
import { MAX_VOTE_MULTIPLIER } from '../../feedback/vote';
import { getManyItems } from '../items/many';
import { differenceInCalendarDays } from 'date-fns';

const TARNUM_KEY = process.env.TARNUM_KEY;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
      return res.status(401).json({ error: 'Unauthorized' });

    // if (req.method === 'GET') return GET(req, res);
    if (req.method === 'POST') return POST(req, res);
    // if (req.method === 'PATCH') return PATCH(req, res);

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

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const take = req.body.take as number | undefined;
  const skip = req.body.skip as number | undefined;

  const tradeRaw = await prisma.trades.findMany({
    where: {
      processed: false,
    },
    distinct: ['hash'],
    include: { items: true },
    orderBy: { addedAt: 'asc' },
    take: take || 100,
    skip: skip || 0,
  });

  const result = await autoPriceTrades2(tradeRaw);

  return res.status(200).json(result);
};

export const autoPriceTrades2 = async (tradeRaw: (Trades & { items: TradeItems[] })[]) => {
  const promises = [];

  for (const trade of tradeRaw) {
    const promise = findCanonical(trade).then((x) => {
      if (x) return findSimilar(x);
      return null;
    });

    promises.push(promise);
  }

  const promResult = await Promise.all(promises);
  const filteredTrades = promResult.filter((t) => !!t && t?.[0] !== null) as [Trades, number][];

  const feedbackArray: Prisma.FeedbacksCreateInput[] = filteredTrades.map(([t, originalId]) => ({
    type: 'tradePrice',
    subject_id: t.trade_id,
    user_id: 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1',
    json: JSON.stringify({
      ip: 'auto',
      pageRef: 'auto',
      auto_ref: originalId,
      content: { trade: t },
    }),
    votes: MAX_VOTE_MULTIPLIER - 1,
  }));

  const feedbacks = prisma.feedbacks.createMany({
    data: feedbackArray,
  });

  const updateTrades = prisma.trades.updateMany({
    where: {
      trade_id: {
        in: filteredTrades.map(([t]) => t.trade_id),
      },
    },
    data: {
      processed: true,
    },
  });

  return await prisma.$transaction([feedbacks, updateTrades]);
};

const findSimilar = async (trade: Trades & { items: TradeItems[] }) => {
  // we have a lot of "cool negg" trades that are not following our guidelines
  // so let's just skip them for now
  if (trade.wishlist.toLowerCase().includes('cool negg')) return null;

  const shouldSkip = await checkTradeEstPrice(trade);
  if (shouldSkip) return null;

  const similarList = await prisma.trades.findMany({
    where: {
      priced: true,
      wishlist: trade.wishlist,
      auto_ignore_pricing: false,
    },
    orderBy: { addedAt: 'desc' },
    include: { items: true },
    take: 50,
  });

  if (similarList.length === 0) return null;

  const isAllItemsTheSame = trade.items.every((t) => t.item_iid === trade.items[0].item_iid);

  // let unpriced = null;

  const similar = similarList.find((t) => {
    const isTheSame = t.items.every((t2) => t2.item_iid === t.items[0].item_iid);

    // const isSimilar = t.items.length === trade.items.length && isTheSame === isAllItemsTheSame;
    // const isAllEmpty = t.items.every((item) => !item.price);

    // // if (isAllEmpty && isSimilar) {
    // //   unpriced = t;
    // //   return false;
    // // }

    return t.items.length === trade.items.length && isTheSame === isAllItemsTheSame;
  });

  // if (!similar && unpriced) similar = unpriced;

  if (!similar) return null;

  const updatedItems: any[] = [...trade.items];

  for (const similarItem of similar.items) {
    updatedItems[similarItem.order].price = similarItem.price;
    updatedItems[similarItem.order].addedAt = updatedItems[similarItem.order].addedAt.toJSON();
  }

  const isAllEmpty = updatedItems.every((item) => !item.price);

  if (
    (!isAllItemsTheSame && isAllEmpty) ||
    (isAllEmpty && trade.items.length > 1 && !isNaN(Number(trade.wishlist.trim())))
  ) {
    await processTradePrice({
      ...trade,
      items: updatedItems,
    } as any);
    return null;
  }

  return [
    {
      ...trade,
      items: updatedItems,
    },
    similar.trade_id,
  ];
};

const findCanonical = async (trade: Trades & { items: TradeItems[] }) => {
  const canonical = await prisma.trades.findUnique({
    where: {
      wishlist_isCanonical_isAllItemsEqual_itemsCount: {
        wishlist: trade.wishlist,
        isCanonical: true,
        isAllItemsEqual: trade.isAllItemsEqual!,
        itemsCount: trade.itemsCount,
      },
    },
    include: { items: true },
  });

  if (!canonical) return trade;

  const updatedItems: any[] = [...trade.items];

  for (const canonicalItem of canonical.items) {
    updatedItems[canonicalItem.order].price = canonicalItem.price;
    updatedItems[canonicalItem.order].addedAt = updatedItems[canonicalItem.order].addedAt.toJSON();
  }

  await processTradePrice({
    ...trade,
    items: updatedItems,
  } as any);

  return null;
};

// this will skip trade pricing if the trade is est price is less than 100k
const checkTradeEstPrice = async (trade: Trades & { items: TradeItems[] }) => {
  // if (trade.items.length === 1) return false;

  const itemsQuery = trade.items
    .map((item) => item.item_iid?.toString())
    .filter((id) => !!id) as string[];

  const itemsData = await getManyItems({ id: itemsQuery });

  let priceSum = 0;

  for (const item of trade.items) {
    const itemData = itemsData[item.item_iid!.toString()];

    if (!itemData) return false;

    if (!itemData.price.value) return false;

    if (itemData.price.inflated) return false;

    if (
      itemData.price.addedAt &&
      differenceInCalendarDays(new Date(), new Date(itemData.price.addedAt)) > 30
    )
      return false;

    priceSum += itemData.price.value;
  }

  if (priceSum >= Math.max(300000, trade.items.length * 100000)) return false;

  await processTradePrice(trade as any);

  return true;
};
