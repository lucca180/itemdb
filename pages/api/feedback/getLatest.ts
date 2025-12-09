import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { FeedbackParsed } from '../../../types';
import { CheckAuth } from '../../../utils/googleCloud';
import requestIp from 'request-ip';
import { Feedbacks } from '@prisma/generated/client';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const limit = (req.query.limit as string) ?? '30';

  const ip_address = requestIp.getClientIp(req);

  const includeProcessed = req.query.includeProcessed === 'true';
  const target = req.query.itemName as string;
  let wishlist = req.query.wishlist as string;
  const order = req.query.order as string;

  let user_id;
  let user;

  try {
    user = (await CheckAuth(req))?.user;
    if (!user) throw new Error('User not found');
    user_id = user.id;
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let feedbackRaw: Feedbacks[] = [];

  if (order === 'wishlist' && !wishlist) {
    const wishlists = await getWishlists(parseInt(limit));
    wishlist = wishlists[0].wishlist;
  }

  if (wishlist) {
    feedbackRaw = await getTradeFeedbackWishlist(wishlist, parseInt(limit), user_id);
  }

  if (target) {
    feedbackRaw = await getTradeFeedback(target, parseInt(limit), user_id);
  }

  if (!feedbackRaw.length) {
    feedbackRaw = await prisma.feedbacks.findMany({
      where: {
        processed: includeProcessed,
        OR: [{ user_id: { not: user_id } }, { user_id: null }],
        type: {
          in: ['tradePrice', user.isAdmin ? 'itemChange' : 'neverWillBeAType'],
        },
        vote: {
          none: {
            user_id: user_id,
          },
        },
      },
      orderBy: { addedAt: 'asc' },
      take: parseInt(limit),
    });
  }

  const feedbacks = [];
  for (const feedback of feedbackRaw) {
    const json = feedback.json as string;
    const parsed = JSON.parse(json) as FeedbackParsed;

    if (ip_address === parsed.ip) continue;
    feedbacks.push(feedback);
  }

  res.json(feedbackRaw);
}

const getTradeFeedback = async (itemName: string, limit: number, user_id: string) => {
  const feedbackIds = (await prisma.$queryRaw`
    SELECT f.feedback_id FROM feedbacks f 
    left join trades t on f.subject_id = t.trade_id and f.type = 'tradePrice'
    left join tradeitems ti on t.trade_id = ti.trade_id
    left join items i on ti.item_iid = i.internal_id
    where f.type = 'tradePrice' and i.name = ${itemName} and f.processed = 0
  `) as { feedback_id: number }[];

  const feedbackRaw = await prisma.feedbacks.findMany({
    where: {
      feedback_id: {
        in: feedbackIds.map((f) => f.feedback_id),
      },
      user_id: {
        not: user_id,
      },
      vote: {
        none: {
          user_id: user_id,
        },
      },
    },
    orderBy: { addedAt: 'asc' },
    take: limit,
  });

  return feedbackRaw;
};

const getTradeFeedbackWishlist = async (wishlist: string, limit: number, user_id: string) => {
  const feedbackIds = (await prisma.$queryRaw`
    SELECT f.feedback_id FROM feedbacks f 
    left join trades t on f.subject_id = t.trade_id and f.type = 'tradePrice'
    left join tradeitems ti on t.trade_id = ti.trade_id
    where f.type = 'tradePrice' and t.wishlist = ${wishlist} and f.processed = 0
  `) as { feedback_id: number }[];

  const feedbackRaw = await prisma.feedbacks.findMany({
    where: {
      feedback_id: {
        in: feedbackIds.map((f) => f.feedback_id),
      },
      user_id: {
        not: user_id,
      },
      vote: {
        none: {
          user_id: user_id,
        },
      },
    },
    orderBy: { addedAt: 'asc' },
    take: limit,
  });

  return feedbackRaw;
};

const getWishlists = async (limit: number) => {
  const wishlists = (await prisma.$queryRaw`
    select t.wishlist from feedbacks f 
    left join trades t on f.subject_id = t.trade_id 
    where f.type = 'tradePrice' and f.processed = 0
    group by t.wishlist 
    order by count(*) desc
    limit ${limit}
  `) as { wishlist: string }[];

  return wishlists;
};
