import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { FeedbackParsed, TradeData } from '../../../types';
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
  const itemIds = feedbackRaw
    .map((f) => {
      if (f.type !== 'tradePrice') return -1;
      const parsed = JSON.parse(f.json as string) as FeedbackParsed;
      const tradeInfo = parsed.content.trade as TradeData;

      return tradeInfo.items.map((i) => i.item_iid);
    })
    .flat()
    .filter((id) => id !== -1 && !!id) as number[];

  const uniqueItemIds = Array.from(new Set(itemIds));

  const itemData = await prisma.items.findMany({
    where: {
      internal_id: { in: uniqueItemIds },
    },
    select: {
      internal_id: true,
      name: true,
      image: true,
    },
  });

  const feedbacks = [];
  for (const feedback of feedbackRaw) {
    const json = feedback.json as string;
    const parsed = JSON.parse(json) as FeedbackParsed;

    if (ip_address === parsed.ip) continue;
    feedbacks.push(fixTrade(feedback, itemData));
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

// we removed name and image from tradeitem table so now we need to fix report voting cause we need this info lol
const fixTrade = (
  feedback: Feedbacks,
  itemData: { internal_id: number; name: string; image: string | null }[]
) => {
  const parsed = JSON.parse(feedback.json as string) as FeedbackParsed;
  const tradeInfo = parsed.content.trade as TradeData;

  tradeInfo.items = tradeInfo.items.map((item) => {
    const itemInfo = itemData.find((i) => i.internal_id === item.item_iid);
    if (itemInfo) {
      item.name = itemInfo.name;
      item.image = itemInfo.image!;
    }
    return item;
  });

  parsed.content.trade = tradeInfo;
  feedback.json = JSON.stringify(parsed);
  return feedback;
};
