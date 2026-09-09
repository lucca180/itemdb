import { Prisma, TradeItems, Trades } from '@prisma/generated/client';
import { NextApiRequest, NextApiResponse } from 'next';
import pMap from 'p-map';
import prisma from '../../../../utils/prisma';
import { processTradePrice } from '.';
import { MAX_VOTE_MULTIPLIER } from '../../feedback/vote';
import { getManyItems } from '../items/many';
import { differenceInCalendarDays } from 'date-fns';
import { ItemData } from '@types';
import { getTradeItemByOrder, normalizeCanonicalWishlist } from '@utils/item/tradeCanonical';
import { omitOwnerHash } from '@utils/ownerHash';
import {
  buildSimilarTradeLookupKey,
  buildTradeItemSignature,
  getTradeIsAllItemsEqual,
  isWishlistBanned,
  itemPriceExceedsInstantBuy,
  shouldSkipInstaBuySimilar,
} from '@utils/trades/findSimilarTrade';

const TARNUM_KEY = process.env.TARNUM_KEY;
const AUTO_PRICE_CONCURRENCY = 4;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
      return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') return POST(req, res);

    if (req.method == 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST');
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

const applyInstantBuyUnitPrice = async (trade: Trades & { items: TradeItems[] }) => {
  const itemsCount = trade.items.reduce((sum, item) => sum + (item.amount || 1), 0);
  const unitPrice = Math.floor(trade.instantBuy! / itemsCount);

  trade.items = trade.items.map((item) => ({
    ...item,
    price: unitPrice as any,
  }));

  await processTradePrice(trade as any);
};

export const autoPriceTrades2 = async (tradeRaw: (Trades & { items: TradeItems[] })[]) => {
  const similarCache = new Map<string, (Trades & { items: TradeItems[] }) | null>();
  const similarInflight = new Map<string, Promise<(Trades & { items: TradeItems[] }) | null>>();
  const itemDataCache = new Map<string, ItemData>();

  const promResult = await pMap(
    tradeRaw,
    async (trade) => {
      // Identical-item IB lots: apply IB unit price immediately (same as ingest).
      // Skip canonical/similar so they never land in the pricing queue.
      if (trade.instantBuy && getTradeIsAllItemsEqual(trade)) {
        await applyInstantBuyUnitPrice(trade);
        return null;
      }

      const afterCanonical = await findCanonical(trade);
      if (!afterCanonical) return null;
      return findSimilar(afterCanonical, similarCache, similarInflight, itemDataCache);
    },
    { concurrency: AUTO_PRICE_CONCURRENCY }
  );

  const filteredTrades = promResult.filter((t) => !!t && t?.[0] !== null) as [Trades, number][];

  const feedbackArray: Prisma.FeedbacksCreateInput[] = filteredTrades.map(([t, originalId]) => ({
    type: 'tradePrice',
    subject_id: t.trade_id,
    user_id: 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1',
    json: JSON.stringify({
      ip: 'auto',
      pageRef: 'auto',
      auto_ref: originalId,
      content: { trade: omitOwnerHash(t) },
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

const fetchSimilarTrade = async (trade: Trades & { items: TradeItems[] }) => {
  const isAllItemsEqual = getTradeIsAllItemsEqual(trade);

  // Match wishlist/size/mix and the same Instant Buy (null → IS NULL).
  // Without that, an IB 3.7M egg lot could seed prices onto an IB 1.5M lot
  // that only shared wishlist "none" + 2 mixed items.
  return prisma.trades.findFirst({
    where: {
      priced: true,
      wishlist: trade.wishlist,
      auto_ignore_pricing: false,
      itemsCount: trade.itemsCount,
      isAllItemsEqual,
      instantBuy: trade.instantBuy,
    },
    orderBy: { addedAt: 'desc' },
    include: { items: true },
  });
};

const getCachedSimilarTrade = async (
  trade: Trades & { items: TradeItems[] },
  cache: Map<string, (Trades & { items: TradeItems[] }) | null>,
  inflight: Map<string, Promise<(Trades & { items: TradeItems[] }) | null>>
) => {
  const key = buildSimilarTradeLookupKey(
    trade.wishlist,
    trade.itemsCount,
    getTradeIsAllItemsEqual(trade),
    buildTradeItemSignature(trade.items),
    trade.instantBuy
  );

  if (cache.has(key)) return cache.get(key)!;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = fetchSimilarTrade(trade).then((result) => {
    cache.set(key, result);
    inflight.delete(key);
    return result;
  });

  inflight.set(key, promise);
  return promise;
};

const findSimilar = async (
  trade: Trades & { items: TradeItems[] },
  similarCache: Map<string, (Trades & { items: TradeItems[] }) | null>,
  similarInflight: Map<string, Promise<(Trades & { items: TradeItems[] }) | null>>,
  itemDataCache: Map<string, ItemData>
) => {
  if (isWishlistBanned(trade.wishlist)) return null;

  // Handlers first: true means the lot was priced or closed — do not similar-match.
  const shouldSkip =
    (await checkTradeEstPrice(trade, itemDataCache)) || (await checkInstaBuy(trade, itemDataCache));
  if (shouldSkip) return null;

  const similar = await getCachedSimilarTrade(trade, similarCache, similarInflight);
  if (!similar) return null;

  const isAllItemsTheSame = getTradeIsAllItemsEqual(trade);

  const updatedItems: any[] = [...trade.items];

  // Copy by slot order (not item identity). Never copy a price above this lot's IB.
  for (const similarItem of similar.items) {
    const item = getTradeItemByOrder(updatedItems, similarItem.order);
    if (!item) continue;

    if (similarItem.amount !== 1 && item.amount !== similarItem.amount && similarItem.price)
      continue;

    item.addedAt = item.addedAt.toJSON();

    if (similarItem.amount === 1 && item.amount !== 1 && similarItem.price) {
      const adjustedPrice = Math.floor(Number(similarItem.price) / item.amount);
      if (itemPriceExceedsInstantBuy(adjustedPrice, trade.instantBuy)) continue;
      item.price = adjustedPrice;
      continue;
    }

    if (itemPriceExceedsInstantBuy(Number(similarItem.price), trade.instantBuy)) continue;
    item.price = similarItem.price;
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
  const normalizedWishlist = normalizeCanonicalWishlist(trade.wishlist);
  const [canonicalMatch] = (await prisma.$queryRaw`
    SELECT trade_id FROM Trades
    WHERE isCanonical = 1
      AND isAllItemsEqual = ${trade.isAllItemsEqual}
      AND itemsCount = ${trade.itemsCount}
      AND LOWER(REPLACE(REPLACE(REPLACE(REPLACE(wishlist, ' ', ''), '\n', ''), '\r', ''), '\t', '')) = ${normalizedWishlist}
    ORDER BY trade_id DESC
    LIMIT 1
  `) as { trade_id: number }[];

  if (!canonicalMatch) return trade;

  const canonical = await prisma.trades.findUnique({
    where: {
      trade_id: canonicalMatch.trade_id,
    },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!canonical) return trade;

  const updatedItems: any[] = [...trade.items];

  for (const canonicalItem of canonical.items) {
    const item = getTradeItemByOrder(updatedItems, canonicalItem.order);
    if (!item) throw new Error(`Missing trade item order ${canonicalItem.order}`);

    item.price = canonicalItem.price;
    item.addedAt = item.addedAt.toJSON();
  }

  await processTradePrice({
    ...trade,
    items: updatedItems,
  } as any);

  return null;
};

// Skip similar matching when every item has a recent non-inflated market price
// and the lot estimate is under 1M (and there is no Instant Buy).
const checkTradeEstPrice = async (
  trade: Trades & { items: TradeItems[] },
  itemDataCache: Map<string, ItemData>
) => {
  const itemsQuery = trade.items
    .map((item) => item.item_iid?.toString())
    .filter((id) => !!id) as string[];

  if (itemsQuery.length === 0) return false;

  const uniqueIds = itemsQuery.filter((id) => !itemDataCache.has(id));

  const itemsData = await getManyItems({ id: uniqueIds });
  Object.entries(itemsData).forEach(([id, data]) => {
    itemDataCache.set(id, data);
  });

  let priceSum = 0;

  for (const item of trade.items) {
    const itemData = itemDataCache.get(item.item_iid!.toString());

    if (!itemData) return false;

    if (!itemData.price.value) return false;

    if (itemData.price.inflated) return false;

    if (
      itemData.price.addedAt &&
      differenceInCalendarDays(new Date(), new Date(itemData.price.addedAt)) > 30
    )
      return false;

    priceSum += itemData.price.value * item.amount;
  }

  if (priceSum >= 1000000 || trade.instantBuy) return false;

  await processTradePrice(trade as any);

  return true;
};

// Mixed-lot Instant Buy. Returns true when handled here so findSimilar must not run.
//
// 1. Fresh market prices + rest of lot ≤ 25% of the expensive item → put IB on that item.
// 2. Else if shouldSkipInstaBuySimilar → close without prices (no similar match).
// 3. Else return false → high IB + real NP wishlist + similar-valued items may
//    still similar-match (only against the same IB).
//
// Stale/missing/inflated prices cannot do (1), but (2) still applies. Returning
// false on "none" lots used to leak them into findSimilar, which then copied
// prices from an unrelated IB lot by slot order.
const checkInstaBuy = async (
  trade: Trades & { items: TradeItems[] },
  itemDataCache: Map<string, ItemData>
) => {
  if (!trade.instantBuy) return false;

  const items = trade.items.map((item) =>
    itemDataCache.get(item.item_iid!.toString())
  ) as ItemData[];

  const closeWithoutSimilar = async () => {
    await processTradePrice(trade as any);
    return true;
  };

  // Cannot apply IB to the expensive item without item data; still skip similar if needed.
  if (items.includes(undefined!)) {
    console.error('Item data not found for trade:', trade.trade_id);
    if (shouldSkipInstaBuySimilar(trade)) return closeWithoutSimilar();
    return false;
  }

  const hasItemUnpriced = items.some(
    (item) =>
      !item.price.value ||
      item.price.inflated ||
      differenceInCalendarDays(new Date(), new Date(item.price.addedAt ?? 0)) > 30
  );
  // No usable market for the 25% path — still skip similar for none / cheap IB / skip-wishlist.
  if (hasItemUnpriced) {
    if (shouldSkipInstaBuySimilar(trade)) return closeWithoutSimilar();
    return false;
  }

  const mostExpensiveItem = items.reduce(
    (prev, current) => ((prev.price.value ?? 0) > (current.price.value ?? 0) ? prev : current),
    items[0]
  );

  // ItemData.internal_id is item_iid; TradeItems.internal_id is the row PK.
  const otherItems = trade.items.filter((item) => item.item_iid !== mostExpensiveItem.internal_id);

  const otherItemsValue = otherItems.reduce((sum, item) => {
    const itemData = itemDataCache.get(item.item_iid!.toString());
    return sum + (itemData?.price.value ?? 0) * item.amount;
  }, 0);

  if (otherItemsValue <= (mostExpensiveItem.price.value ?? 0) * 0.25) {
    trade.items = trade.items.map((item) => {
      if (item.item_iid === mostExpensiveItem.internal_id) {
        return {
          ...item,
          price: Math.floor(trade.instantBuy! / item.amount) as any,
        };
      }
      return item;
    });

    await processTradePrice(trade as any);
    return true;
  }

  if (shouldSkipInstaBuySimilar(trade)) return closeWithoutSimilar();

  return false;
};
