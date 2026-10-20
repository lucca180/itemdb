import type { NextRequest } from 'next/server';
import prisma from '@utils/prisma';
import type { FeedbackParsed, TradeData } from '@types';
import type { Feedbacks } from '@prisma/generated/client';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getRequestClientIp } from '@utils/api/clientIp';
import { AUTO_PRICE_UID, isNewFeedbackAccount } from '@utils/feedback/voteRules';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;

  const limit = parseInt(query.get('limit') ?? '30') || 30;
  const includeProcessed = query.get('includeProcessed') === 'true';
  const target = query.get('itemName');
  let wishlist = query.get('wishlist');
  const order = query.get('order');
  const skipList = query.get('skipList')
    ? query
        .get('skipList')!
        .split(',')
        .map(Number)
        .filter((id) => !Number.isNaN(id))
    : [];

  const { user } = await getServerCurrentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.banned) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const ip_address = getRequestClientIp(request);
  const user_id = user.id;
  // new accounts can only vote on auto priced feedbacks
  const onlyAuto = isNewFeedbackAccount(user);

  let feedbackRaw: Feedbacks[] = [];

  if (order === 'wishlist' && !wishlist) {
    const wishlists = await getWishlists(limit);
    wishlist = wishlists[0]?.wishlist ?? null;
  }

  if (wishlist) {
    feedbackRaw = await getTradeFeedbackWishlist(wishlist, limit, user_id, skipList, onlyAuto);
  }

  if (target) {
    feedbackRaw = await getTradeFeedback(target, limit, user_id, skipList, onlyAuto);
  }

  if (!feedbackRaw.length) {
    feedbackRaw = await prisma.feedbacks.findMany({
      where: {
        ...(onlyAuto ? { user_id: AUTO_PRICE_UID } : {}),
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
        feedback_id: {
          notIn: skipList,
        },
      },
      orderBy: { addedAt: 'asc' },
      take: limit,
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
    const parsed = JSON.parse(feedback.json as string) as FeedbackParsed;

    if (ip_address === parsed.ip) continue;
    feedbacks.push(sanitizeFeedback(fixTrade(feedback, itemData)));
  }

  return Response.json(feedbacks);
}

// voters must not see who sent it (ip, email, user id) - only whether it was the auto pricer
const sanitizeFeedback = (feedback: Feedbacks) => {
  const parsed = JSON.parse(feedback.json as string) as Partial<FeedbackParsed>;
  delete parsed.ip;

  const trade = parsed.content?.trade as
    (TradeData & { ip_address?: unknown; ownerHash?: unknown }) | undefined;
  if (trade) {
    delete trade.ip_address;
    delete trade.ownerHash;
  }

  return {
    ...feedback,
    json: JSON.stringify(parsed),
    ip_address: '',
    email: null,
    user_id: feedback.user_id === AUTO_PRICE_UID ? feedback.user_id : null,
  };
};

const getTradeFeedback = async (
  itemName: string,
  limit: number,
  user_id: string,
  skipList: number[],
  onlyAuto: boolean
) => {
  const feedbackIds = (await prisma.$queryRaw`
    SELECT f.feedback_id FROM feedbacks f
    left join trades t on f.subject_id = t.trade_id and f.type = 'tradePrice'
    left join tradeitems ti on t.trade_id = ti.trade_id
    left join items i on ti.item_iid = i.internal_id
    where f.type = 'tradePrice' and i.name = ${itemName} and f.processed = 0
  `) as { feedback_id: number }[];

  return prisma.feedbacks.findMany({
    where: {
      feedback_id: {
        in: feedbackIds.map((f) => f.feedback_id),
        notIn: skipList,
      },
      user_id: onlyAuto ? AUTO_PRICE_UID : { not: user_id },
      vote: {
        none: {
          user_id: user_id,
        },
      },
    },
    orderBy: { addedAt: 'asc' },
    take: limit,
  });
};

const getTradeFeedbackWishlist = async (
  wishlist: string,
  limit: number,
  user_id: string,
  skipList: number[],
  onlyAuto: boolean
) => {
  const feedbackIds = (await prisma.$queryRaw`
    SELECT f.feedback_id FROM feedbacks f
    left join trades t on f.subject_id = t.trade_id and f.type = 'tradePrice'
    left join tradeitems ti on t.trade_id = ti.trade_id
    where f.type = 'tradePrice' and t.wishlist = ${wishlist} and f.processed = 0
  `) as { feedback_id: number }[];

  return prisma.feedbacks.findMany({
    where: {
      feedback_id: {
        in: feedbackIds.map((f) => f.feedback_id),
        notIn: skipList,
      },
      user_id: onlyAuto ? AUTO_PRICE_UID : { not: user_id },
      vote: {
        none: {
          user_id: user_id,
        },
      },
    },
    orderBy: { addedAt: 'asc' },
    take: limit,
  });
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
  if (feedback.type !== 'tradePrice') return feedback;

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
