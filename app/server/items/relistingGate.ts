import 'server-only';

import { cacheLife } from 'next/cache';
import { countTradeQueue } from '@services/feedback/contributeQueues';
import prisma from '@utils/prisma';

/** The auction relisting gate only shows when a queue reaches one of these sizes. */
const RELISTING_GATE_TRADE_QUEUE = 1000;
const RELISTING_GATE_VOTE_QUEUE = 500;

/** Cached because the auction modal asks for this on every open and every 60s while open. */
async function getContributeQueues() {
  'use cache';
  cacheLife('itemFast');

  const [tradeQueue, voteQueue] = await Promise.all([
    countTradeQueue(),
    prisma.feedbacks.count({ where: { type: 'tradePrice', processed: false } }),
  ]);

  return { tradeQueue, voteQueue };
}

/** Global queue check, so it applies the same way to logged-out users. Fails open (no gate). */
export async function shouldGateAuctionRelisting(): Promise<boolean> {
  try {
    const { tradeQueue, voteQueue } = await getContributeQueues();
    return tradeQueue >= RELISTING_GATE_TRADE_QUEUE || voteQueue >= RELISTING_GATE_VOTE_QUEUE;
  } catch (error) {
    console.error('shouldGateAuctionRelisting error', error);
    return false;
  }
}
