import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { TradeData } from '../../../../types';
import Chance from 'chance';
const chance = new Chance();
import { Prisma } from '@prisma/generated/client';
import { subDays } from 'date-fns';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  let order: Prisma.TradesOrderByWithRelationInput = { addedAt: 'asc' };

  // to prevent multiple people from pricing the same trade at the same time
  const dir = chance.bool() ? 'asc' : 'desc';
  const field = chance.pickone(['addedAt', 'trade_id', 'owner', 'wishlist', 'ip_address', 'hash']);

  order = {
    [field]: dir,
  };

  const limit = (req.query.limit as string) ?? '1';
  let itemName = req.query.itemName as string | undefined;
  const skipList: string[] = req.query.skipList ? (req.query.skipList as string).split(',') : [];

  if (!itemName) itemName = await getPopularItem(skipList);
  if (!itemName) return res.json({ trades: [], popularItem: null });

  let tradeRaw = await getPrecifyTrades(itemName, order, parseInt(limit), skipList);

  if (!tradeRaw || !tradeRaw.length) {
    itemName = await getPopularItem(skipList);
    if (!itemName) return res.json({ trades: [], popularItem: null });

    tradeRaw = await getPrecifyTrades(itemName, order, parseInt(limit), skipList, false);
  }

  const trades: TradeData[] = tradeRaw.map((t) => {
    return {
      trade_id: t.trade_id,
      owner: t.owner,
      wishlist: t.wishlist,
      addedAt: t.addedAt.toJSON(),
      processed: t.processed,
      priced: t.priced,
      hash: t.hash,
      instantBuy: t.instantBuy,
      createdAt: t.createdAt?.toJSON() || null,
      items: t.items.map((i) => {
        return {
          internal_id: i.internal_id,
          trade_id: i.trade_id,
          name: i.item?.name || '',
          image: i.item?.image || '',
          image_id: i.item?.image_id || '',
          item_iid: i.item_iid || null,
          order: i.order,
          price: i.price?.toNumber() || null,
          addedAt: i.addedAt.toJSON(),
          amount: i.amount,
        };
      }),
    };
  });

  res.json({ trades, popularItem: itemName });
}

const DATE_LIMIT = subDays(new Date(), 30);

const getPopularItem = async (skipList?: string[]) => {
  const shouldGetOld = chance.bool({ likelihood: 60 });
  const prismaSkip = Prisma.join(skipList && skipList.length > 0 ? skipList : [-1]);

  const orderBy = shouldGetOld
    ? Prisma.sql`ORDER BY max_addedAt asc`
    : Prisma.sql`ORDER BY count desc`;

  const dateLimit = !shouldGetOld ? Prisma.sql`AND t.addedAt >= ${DATE_LIMIT}` : Prisma.empty;

  const rawQuery = (await prisma.$queryRaw`
    select name, count(name) as count, max(t.addedAt) as max_addedAt FROM trades t 
    left join tradeitems ti2 on t.trade_id = ti2.trade_id
    left join items i2 on ti2.item_iid = i2.internal_id
    where processed = 0 and
    i2.name IS NOT NULL and 
    EXISTS (
        SELECT 1 
        FROM trades t2
        LEFT JOIN tradeitems ti ON t2.trade_id = ti.trade_id
        LEFT JOIN items i ON ti.item_iid = i.internal_id
        LEFT JOIN itemprices p ON p.item_iid = i.internal_id AND p.isLatest = 1 AND p.addedAt > t.addedAt
        WHERE t.trade_id = t2.trade_id
        AND p.price IS NULL
    ) and t.trade_id not in (${prismaSkip}) ${dateLimit}
    group by name ${orderBy}
    limit 1
  `) as { name: string; count: bigint; max_addedAt: Date }[];

  if (!rawQuery.length) return undefined;

  return rawQuery[0].name;
};

const getPrecifyTrades = async (
  itemName: string,
  order: Prisma.TradesOrderByWithRelationInput,
  limit = 1,
  skipList?: string[],
  skipOld = true
) => {
  const tradeRaw = await prisma.trades.findMany({
    where: {
      processed: false,
      addedAt: skipOld ? { gte: DATE_LIMIT } : undefined,
      trade_id: skipList
        ? {
            notIn: skipList.map((s) => parseInt(s)),
          }
        : undefined,
      items: {
        some: {
          item: { name: itemName },
        },
      },
    },
    include: { items: { include: { item: true } } },
    distinct: 'hash',
    orderBy: order,
    take: limit,
  });

  if (!tradeRaw) return [];

  return tradeRaw;
};
