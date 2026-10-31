/**
 * Auto approves trade price feedbacks that follow the trade pricing guidelines: when the prices
 * sent match what the wishlist parser expects for every slot, no vote is needed. Anything else
 * (mismatch, ambiguous wishlist, Instant Buy...) stays in the vote queue.
 */
import 'server-only';

import * as Sentry from '@sentry/nextjs';
import prisma from '@utils/prisma';
import type { Feedbacks } from '@prisma/generated/client';
import type { FeedbackParsed, TradeData } from '@types';
import {
  getWishlistNameCandidates,
  getWishlistPrices,
  wishlistPricesMatch,
  type WishlistPrices,
} from '@utils/trades/wishlistPrice';
import { commitFeedbackDecision } from '@services/feedback/feedbackCommit';

/** Bump when the parser rules change, so approvals can be traced to the rules that made them. */
export const TRADE_AUTO_APPROVE_VERSION = 1;

/** Kill switch: TRADE_AUTO_APPROVE=off (+ restart) stops new auto approvals without a build. */
export const isTradeAutoApproveEnabled = () => process.env.TRADE_AUTO_APPROVE !== 'off';

type TradeFeedbackItem = Pick<TradeData['items'][number], 'item_iid' | 'amount' | 'price'> & {
  name?: string | null;
};

export type TradeFeedbackCheck = {
  match: boolean;
  sent: (number | null)[];
  expected: WishlistPrices;
};

// tradeable np items the wishlist mentions by name (payment items, "+ Hungry Fungus"...)
const findWishlistItemNames = async (wishlist: string) => {
  const candidates = getWishlistNameCandidates(wishlist);
  if (!candidates.length) return new Set<string>();

  const items = await prisma.items.findMany({
    where: {
      name: { in: candidates },
      type: 'np',
      OR: [{ status: null }, { status: { not: 'no trade' } }],
    },
    select: { name: true },
  });

  return new Set(items.map((i) => i.name.toLowerCase()));
};

// auto priced feedbacks store raw TradeItems (no names)
const withItemNames = async (items: TradeFeedbackItem[]) => {
  const missing = items.filter((i) => !i.name && i.item_iid).map((i) => i.item_iid!);
  if (!missing.length) return items;

  const rows = await prisma.items.findMany({
    where: { internal_id: { in: missing } },
    select: { internal_id: true, name: true },
  });
  const names = new Map(rows.map((r) => [r.internal_id, r.name]));

  return items.map((i) => ({ ...i, name: i.name || (i.item_iid ? names.get(i.item_iid) : null) }));
};

/** Compares the prices of a trade price suggestion with what the guidelines expect. */
export const checkTradeFeedback = async (trade: {
  wishlist: string;
  instantBuy?: number | null;
  items: TradeFeedbackItem[];
}): Promise<TradeFeedbackCheck> => {
  const items = await withItemNames(trade.items);
  const sent = items.map((i) =>
    i.price != null && Number(i.price) > 0 ? Math.round(Number(i.price)) : null
  );

  const knownItemNames = await findWishlistItemNames(trade.wishlist ?? '');
  const expected = getWishlistPrices(trade.wishlist ?? '', items, trade.instantBuy, knownItemNames);
  const match = 'prices' in expected && wishlistPricesMatch(sent, expected.prices);

  return { match, sent, expected };
};

const parseFeedback = (feedback: Feedbacks) => {
  const parsed = JSON.parse(feedback.json as string) as FeedbackParsed;
  const trade = parsed.content?.trade as TradeData | undefined;
  return { parsed, trade };
};

/**
 * Approves a pending tradePrice feedback when it follows the guidelines.
 * Returns true when it was approved here.
 */
export const autoApproveTradeFeedback = async (feedback_id: number, ip?: string | null) => {
  if (!isTradeAutoApproveEnabled()) return false;

  const feedback = await prisma.feedbacks.findUnique({
    where: { feedback_id },
    include: { vote: { select: { user_id: true, approve: true } } },
  });

  if (!feedback || feedback.processed || feedback.type !== 'tradePrice') return false;

  const { parsed, trade } = parseFeedback(feedback);
  if (!trade?.items?.length) return false;

  const check = await checkTradeFeedback(trade);
  if (!check.match || !('prices' in check.expected)) return false;

  const json = JSON.stringify({
    ...parsed,
    autoApprove: {
      by: 'wishlist-parser',
      version: TRADE_AUTO_APPROVE_VERSION,
      reason: check.expected.reason,
    },
  });

  const decision = await commitFeedbackDecision(feedback, 'approve', { ip, json });
  if (decision !== 'approve') return false;

  Sentry.metrics.count('feedback.trade_auto_approve', 1, {
    attributes: { reason: check.expected.reason, source: parsed.auto_ref ? 'auto' : 'user' },
  });

  return true;
};
