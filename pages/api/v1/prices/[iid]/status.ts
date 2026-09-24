import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '../../items/[id_name]';
import prisma from '../../../../../utils/prisma';
import { CheckAuth } from '../../../../../utils/googleCloud';
import { User, PricingInfo } from '../../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const DAY_MS = 1000 * 60 * 60 * 24;

type PriceStatusItemRef = {
  internal_id: number;
  priceAddedAt: string | null;
};

/** Viewer-independent status; `waitingVoteTradeIds` lets callers subtract a user's own votes. */
export type PriceStatusBase = PricingInfo & {
  waitingVoteTradeIds: number[];
};

/** Shared by every viewer, so it can be `'use cache'`d. `now` is passed in for prerender safety. */
export async function getPriceStatusBase(
  item: PriceStatusItemRef,
  now: number
): Promise<PriceStatusBase> {
  const GTE = new Date(Math.max(now - DAY_MS * 30, new Date(item.priceAddedAt ?? 0).getTime()));

  const [waitingTrades, priceData] = await Promise.all([
    prisma.trades.findMany({
      where: {
        priced: false,
        addedAt: {
          gte: GTE,
        },
        items: {
          some: {
            item_iid: item.internal_id,
          },
        },
      },
      select: {
        processed: true,
        trade_id: true,
      },
    }),
    prisma.priceProcess2.findMany({
      where: {
        item_iid: item.internal_id,
        processed: false,
        addedAt: {
          gte: GTE,
        },
      },
    }),
  ]);

  const waitingVoteTradeIds = waitingTrades.filter((x) => x.processed).map((x) => x.trade_id);
  const waitingPriceCount = waitingTrades.filter((x) => !x.processed).length;

  const freshSince = new Date(now - DAY_MS * 4);
  const dataStatus = {
    fresh: 0,
    old: 0,
  };
  const uniqueOwners = new Set<string>();
  priceData.forEach((price) => {
    if (price.type === 'usershop') return;

    if (price.owner) {
      if (!uniqueOwners.has(price.owner)) {
        uniqueOwners.add(price.owner);
      } else return;
    }

    if (price.addedAt >= freshSince) {
      dataStatus.fresh++;
    } else {
      dataStatus.old++;
    }
  });

  return {
    waitingTrades: {
      needPricing: waitingPriceCount,
      needVoting: waitingVoteTradeIds.length,
    },
    dataStatus,
    waitingVoteTradeIds,
  };
}

/** How many of the waiting-vote trades this user already voted on. */
export async function countUserTradeVotes(userId: string, tradeIds: number[]): Promise<number> {
  if (!tradeIds.length) return 0;

  return prisma.feedbackVotes.count({
    where: {
      user_id: userId,
      feedback: {
        subject_id: {
          in: tradeIds,
        },
      },
    },
  });
}

/** Strips internal fields and discounts the viewer's own votes. */
export function toPricingInfo(base: PriceStatusBase, userVotes = 0): PricingInfo {
  return {
    waitingTrades: {
      needPricing: base.waitingTrades.needPricing,
      needVoting: base.waitingTrades.needVoting - userVotes,
    },
    dataStatus: base.dataStatus,
  };
}

export async function getPriceStatus(
  itemIid: number | string,
  userId?: string
): Promise<PricingInfo | null> {
  const item = await getItem(itemIid);
  if (!item) return null;

  const base = await getPriceStatusBase(
    { internal_id: item.internal_id, priceAddedAt: item.price.addedAt },
    Date.now()
  );
  const userVotes = userId ? await countUserTradeVotes(userId, base.waitingVoteTradeIds) : 0;

  return toPricingInfo(base, userVotes);
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  let user: User | null = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  const item_iid = req.query.iid as string;

  const status = await getPriceStatus(item_iid, user?.id);
  if (!status) {
    return res.status(404).json({ error: 'Item not found' });
  }

  return res.status(200).json(status);
};
