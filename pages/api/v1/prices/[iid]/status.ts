import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '../../items/[id_name]';
import prisma from '../../../../../utils/prisma';
import { CheckAuth } from '../../../../../utils/googleCloud';
import { User } from '../../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  let user: User | null = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  const item_iid = req.query.iid as string;

  const item = await getItem(item_iid);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const GTE = new Date(
    Math.max(Date.now() - 1000 * 60 * 60 * 24 * 30, new Date(item.price.addedAt ?? 0).getTime())
  );

  const waitingTrades = await prisma.trades.findMany({
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
  });

  const trades = {
    waitingVote: waitingTrades.filter((x) => x.processed === true),
    waitingPrice: waitingTrades.filter((x) => x.processed === false),
  };

  const count = {
    waitingVote: trades.waitingVote.length,
    waitingPrice: trades.waitingPrice.length,
  };

  if (user) {
    const feedbackVotes = await prisma.feedbackVotes.count({
      where: {
        user_id: user.id,
        feedback: {
          subject_id: {
            in: trades.waitingVote.map((x) => x.trade_id),
          },
        },
      },
    });

    count.waitingVote -= feedbackVotes;
  }

  const priceData = await prisma.priceProcess2.findMany({
    where: {
      item_iid: item.internal_id,
      processed: false,
      addedAt: {
        gte: GTE,
      },
    },
  });

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

    // if data is from the last 3 days it is considered fresh
    if (price.addedAt >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)) {
      dataStatus.fresh++;
    } else {
      dataStatus.old++;
    }
  });

  return res.status(200).json({
    waitingTrades: {
      needPricing: count.waitingPrice ?? 0,
      needVoting: count.waitingVote ?? 0,
    },
    dataStatus,
  });
};
