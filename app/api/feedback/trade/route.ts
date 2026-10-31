import { after } from 'next/server';
import prisma from '@utils/prisma';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { reportBackgroundError } from '@utils/api/reportBackgroundError';
import { FeedbackCommitError } from '@services/feedback/feedbackCommit';
import { autoApproveTradeFeedback } from '@services/feedback/tradeAutoApprove';
import { getRequestClientIp } from '@utils/api/clientIp';
import type { TradeData } from '@types';
import {
  FEEDBACK_VOTE_TARGET,
  getVoteMultiplier,
  isNewFeedbackAccount,
} from '@utils/feedback/voteRules';

const MAX_SUPPORTED_PRICE = 99999999999;

type TradeFeedbackBody = {
  trade_id?: number | string;
  items?: { internal_id: number; price: number | string | null }[];
};

// Trade pricing suggestions. The author comes from the session and the trade is read from
// the db - the client only sends prices by internal_id, so it can't spoof the trade
// (hash/order/item_iid) nor submit on behalf of someone else.
export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (user.banned) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

  const isAdmin = user.role === 'ADMIN';
  if (isNewFeedbackAccount(user))
    return Response.json({ success: false, message: 'Account too new' }, { status: 403 });

  const body = (await request.json().catch(() => null)) as TradeFeedbackBody | null;
  const trade_id = Number(body?.trade_id);
  if (!body || !Number.isInteger(trade_id) || trade_id <= 0 || !Array.isArray(body.items))
    return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 });

  try {
    const trade = await getTradeWithPrices(trade_id, body.items);
    if (!trade) return Response.json({ success: false, message: 'Invalid trade' }, { status: 400 });

    if (trade.priced) return Response.json({ success: true, message: 'already processed' });

    const existing = await prisma.feedbacks.findFirst({
      where: { type: 'tradePrice', subject_id: trade_id, processed: false },
    });

    // someone else already suggested prices for this trade
    if (existing && existing.user_id !== user.id)
      return Response.json({ success: true, message: 'already processed' });

    const ip = getRequestClientIp(request);

    // resubmitting replaces the user's own pending suggestion
    const deleteOwn = existing
      ? [prisma.feedbacks.delete({ where: { feedback_id: existing.feedback_id } })]
      : [];

    const create = prisma.feedbacks.create({
      data: {
        type: 'tradePrice',
        subject_id: trade_id,
        user_id: user.id,
        email: '',
        ip_address: ip ?? '1',
        votes: isAdmin ? FEEDBACK_VOTE_TARGET * 2 : getVoteMultiplier(user.xp),
        json: JSON.stringify({
          ip: ip,
          pageRef: '/feedback/trades',
          content: { trade },
        }),
      },
      select: { feedback_id: true },
    });

    const markProcessed = prisma.trades.update({
      where: { trade_id },
      data: { processed: true },
    });

    const [feedback] = await prisma.$transaction([create, markProcessed, ...deleteOwn]);

    // prices that follow the guidelines skip the vote queue - doesn't block the response
    after(async () => {
      try {
        await autoApproveTradeFeedback(feedback.feedback_id, ip);
      } catch (e) {
        reportBackgroundError(e, {
          task: 'feedback.tradeAutoApprove',
          tags: { feedback_id: feedback.feedback_id, trade_id },
          data: {
            feedback_id: feedback.feedback_id,
            trade_id,
            ...(e instanceof FeedbackCommitError ? e.details : {}),
          },
        });
      }
    });

    return Response.json({ success: true, message: { feedback_id: feedback.feedback_id } });
  } catch (e) {
    console.error(e);
    return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

const getTradeWithPrices = async (
  trade_id: number,
  prices: NonNullable<TradeFeedbackBody['items']>
): Promise<TradeData | null> => {
  const trade = await prisma.trades.findUnique({
    where: { trade_id },
    include: { items: { include: { item: true }, orderBy: { order: 'asc' } } },
  });

  if (!trade || !trade.items.length || trade.items.length !== prices.length) return null;

  const items: TradeData['items'] = [];

  for (const i of trade.items) {
    const suggestion = prices.find((p) => Number(p?.internal_id) === i.internal_id);
    if (!suggestion) return null;

    const raw = suggestion.price;
    const price = raw === null || raw === undefined || raw === '' ? null : Number(raw);
    if (price !== null && (!Number.isInteger(price) || price < 0 || price > MAX_SUPPORTED_PRICE))
      return null;

    items.push({
      internal_id: i.internal_id,
      trade_id: i.trade_id,
      name: i.item?.name || '',
      image: i.item?.image || '',
      image_id: i.item?.image_id || '',
      item_iid: i.item_iid || null,
      order: i.order,
      price: price || null,
      addedAt: i.addedAt.toJSON(),
      amount: i.amount,
    });
  }

  return {
    trade_id: trade.trade_id,
    owner: trade.owner,
    wishlist: trade.wishlist,
    addedAt: trade.addedAt.toJSON(),
    processed: trade.processed,
    priced: trade.priced,
    hash: trade.hash,
    instantBuy: trade.instantBuy,
    createdAt: trade.createdAt?.toJSON() || null,
    items,
  };
};
