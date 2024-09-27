import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { TradeData } from '../../../../types';
import Chance from 'chance';
const chance = new Chance();
import { Prisma } from '@prisma/client';

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

    tradeRaw = await getPrecifyTrades(itemName, order, parseInt(limit), skipList);
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
      items: t.items.map((i) => {
        return {
          internal_id: i.internal_id,
          trade_id: i.trade_id,
          name: i.name,
          image: i.image,
          image_id: i.image_id,
          order: i.order,
          price: i.price?.toNumber() || null,
          addedAt: i.addedAt.toJSON(),
        };
      }),
    };
  });

  res.json({ trades, popularItem: itemName });
}

const getPopularItem = async (skipList?: string[]) => {
  const shouldGetOld = chance.bool();

  const rawData = await prisma.tradeItems.groupBy({
    where: {
      trade: {
        processed: false,
        trade_id: skipList
          ? {
              notIn: skipList.map((s) => parseInt(s)),
            }
          : undefined,
      },
    },
    by: ['name'],
    _count: true,
    _max: {
      addedAt: true,
    },
    orderBy: [
      shouldGetOld
        ? {}
        : {
            _count: {
              name: 'desc',
            },
          },
      {
        _max: {
          addedAt: 'asc',
        },
      },
    ],
    take: 1,
  });

  if (!rawData.length) return undefined;

  return rawData[0].name;
};

const getPrecifyTrades = async (
  itemName: string,
  order: Prisma.TradesOrderByWithRelationInput,
  limit = 1,
  skipList?: string[],
) => {
  const tradeRaw = await prisma.trades.findMany({
    where: {
      processed: false,
      trade_id: skipList
        ? {
            notIn: skipList.map((s) => parseInt(s)),
          }
        : undefined,
      items: {
        some: {
          name: itemName,
        },
      },
    },
    include: { items: true },
    distinct: 'hash',
    orderBy: order,
    take: limit,
  });

  if (!tradeRaw) return [];

  return tradeRaw;
};
