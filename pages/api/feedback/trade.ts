import type { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';
import prisma from '@utils/prisma';
import { CheckAuth } from '@utils/googleCloud';
import { TradeData } from '@types';
import { FEEDBACK_VOTE_TARGET, getVoteMultiplier } from '@pages/api/feedback/vote';

const MIN_ACCOUNT_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_SUPPORTED_PRICE = 99999999999;

type TradeFeedbackBody = {
  trade_id?: number | string;
  items?: { internal_id: number; price: number | string | null }[];
};

// Trade pricing suggestions. The author comes from the session and the trade is read from
// the db - the client only sends prices by internal_id, so it can't spoof the trade
// (hash/order/item_iid) nor submit on behalf of someone else.
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user } = await CheckAuth(req);
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (user.banned) return res.status(403).json({ success: false, message: 'Forbidden' });

  const isAdmin = user.role === 'ADMIN';
  if (!isAdmin && Date.now() - new Date(user.createdAt).getTime() < MIN_ACCOUNT_AGE)
    return res.status(403).json({ success: false, message: 'Account too new' });

  const body = req.body as TradeFeedbackBody;
  const trade_id = Number(body.trade_id);
  if (!Number.isInteger(trade_id) || trade_id <= 0 || !Array.isArray(body.items))
    return res.status(400).json({ success: false, message: 'Missing required fields' });

  try {
    const trade = await getTradeWithPrices(trade_id, body.items);
    if (!trade) return res.status(400).json({ success: false, message: 'Invalid trade' });

    if (trade.priced) return res.json({ success: true, message: 'already processed' });

    const existing = await prisma.feedbacks.findFirst({
      where: { type: 'tradePrice', subject_id: trade_id, processed: false },
    });

    // someone else already suggested prices for this trade
    if (existing && existing.user_id !== user.id)
      return res.json({ success: true, message: 'already processed' });

    const ip = requestIp.getClientIp(req);

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

    return res.json({ success: true, message: { feedback_id: feedback.feedback_id } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
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
